"""Dashboard API — activity feed, connector health, stats, active channels."""
from __future__ import annotations

from fastapi import APIRouter, Depends

from app.api.deps import get_current_user
from app.db import queries
from app.models.schemas import AuthUser

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("")
async def dashboard(user: AuthUser = Depends(get_current_user)):
    connectors = queries.list_connectors(user.id)
    channels = queries.list_channels(user.id)
    usage = queries.token_usage(user.id)
    memory = queries.memory_stats(user.id)

    return {
        "activity": queries.activity_feed(user.id, limit=20),
        "connectors": [
            {
                "type": c["type"],
                "status": c["status"],
                "last_sync_at": c.get("last_sync_at"),
                "last_error": c.get("last_error"),
            }
            for c in connectors
        ],
        "memory": memory,
        "channels": {
            "web": True,
            "whatsapp": any(
                c["type"] == "whatsapp" and c["is_active"] for c in channels
            ),
            "telegram": any(
                c["type"] == "telegram" and c["is_active"] for c in channels
            ),
        },
        "stats": {
            "messages_today": queries.messages_today(user.id),
            "tokens_in": usage["tokens_in"],
            "tokens_out": usage["tokens_out"],
            "total_messages": usage["messages"],
        },
    }
