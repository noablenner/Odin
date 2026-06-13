"""Admin API (superadmin only) — users, global usage, health, impersonation."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException

from app.api.deps import require_superadmin
from app.db import queries
from app.db.supabase import db
from app.models.schemas import AuthUser

router = APIRouter(prefix="/api/admin", tags=["admin"])

# Rough per-million-token pricing (USD) for cost estimation.
_PRICE_IN = 3.0 / 1_000_000
_PRICE_OUT = 15.0 / 1_000_000


@router.get("/users")
async def list_users(_: AuthUser = Depends(require_superadmin)):
    users = queries.list_users(limit=500)
    enriched = []
    for u in users:
        usage = queries.token_usage(u["id"])
        enriched.append(
            {
                "id": u["id"],
                "email": u["email"],
                "plan": u.get("plan"),
                "subscription_status": u.get("subscription_status"),
                "created_at": u.get("created_at"),
                "tokens_in": usage["tokens_in"],
                "tokens_out": usage["tokens_out"],
                "messages": usage["messages"],
            }
        )
    return enriched


@router.get("/usage")
async def global_usage(_: AuthUser = Depends(require_superadmin)):
    usage = queries.token_usage(None)
    est_cost = usage["tokens_in"] * _PRICE_IN + usage["tokens_out"] * _PRICE_OUT
    return {
        "tokens_in": usage["tokens_in"],
        "tokens_out": usage["tokens_out"],
        "total_messages": usage["messages"],
        "estimated_cost_usd": round(est_cost, 4),
    }


@router.get("/connectors/health")
async def connector_health(_: AuthUser = Depends(require_superadmin)):
    res = db().table("connectors").select("type, status, user_id, last_error").execute()
    rows = res.data or []
    by_status: dict[str, int] = {}
    for r in rows:
        by_status[r["status"]] = by_status.get(r["status"], 0) + 1
    return {"total": len(rows), "by_status": by_status, "errors": [r for r in rows if r["status"] == "error"][:50]}


@router.get("/memory/overview")
async def memory_overview(_: AuthUser = Depends(require_superadmin)):
    items = db().table("knowledge_items").select("byte_size", count="exact").execute()
    chunks = db().table("knowledge_chunks").select("id", count="exact").execute()
    total_bytes = sum((r.get("byte_size") or 0) for r in (items.data or []))
    return {
        "total_items": items.count or 0,
        "total_chunks": chunks.count or 0,
        "storage_bytes": total_bytes,
    }


@router.get("/impersonate/{user_id}")
async def impersonate(user_id: str, _: AuthUser = Depends(require_superadmin)):
    """Read-only snapshot of a user's account for support."""
    user = queries.get_user(user_id)
    if not user:
        raise HTTPException(404, "User not found")
    return {
        "user": {
            "id": user["id"],
            "email": user["email"],
            "plan": user.get("plan"),
            "subscription_status": user.get("subscription_status"),
        },
        "profile": queries.get_profile(user_id),
        "connectors": [
            {"type": c["type"], "status": c["status"]}
            for c in queries.list_connectors(user_id)
        ],
        "memory": queries.memory_stats(user_id),
        "recent_activity": queries.activity_feed(user_id, limit=10),
    }
