"""Thin data-access helpers built on the Supabase service client.

Every function here runs with the service-role key (RLS bypassed), so each
query MUST be explicitly scoped by user_id. Treat user_id as a hard boundary.
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Optional

from app.db.supabase import db
from app.utils.logger import get_logger

log = get_logger(__name__)


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


# ----------------------------------------------------------------------------
# users
# ----------------------------------------------------------------------------
def get_user(user_id: str) -> Optional[dict[str, Any]]:
    res = db().table("users").select("*").eq("id", user_id).limit(1).execute()
    return res.data[0] if res.data else None


def get_user_by_email(email: str) -> Optional[dict[str, Any]]:
    res = db().table("users").select("*").eq("email", email).limit(1).execute()
    return res.data[0] if res.data else None


def get_user_by_api_key_hash(api_key_hash: str) -> Optional[dict[str, Any]]:
    res = (
        db().table("users").select("*").eq("api_key_hash", api_key_hash).limit(1).execute()
    )
    return res.data[0] if res.data else None


def upsert_user(user_id: str, email: str) -> dict[str, Any]:
    res = (
        db()
        .table("users")
        .upsert({"id": user_id, "email": email}, on_conflict="id")
        .execute()
    )
    return res.data[0] if res.data else {"id": user_id, "email": email}


def update_user(user_id: str, patch: dict[str, Any]) -> None:
    db().table("users").update(patch).eq("id", user_id).execute()


def list_users(limit: int = 200) -> list[dict[str, Any]]:
    res = (
        db().table("users").select("*").order("created_at", desc=True).limit(limit).execute()
    )
    return res.data or []


# ----------------------------------------------------------------------------
# company_profile
# ----------------------------------------------------------------------------
def get_profile(user_id: str) -> Optional[dict[str, Any]]:
    res = (
        db().table("company_profile").select("*").eq("user_id", user_id).limit(1).execute()
    )
    return res.data[0] if res.data else None


def upsert_profile(user_id: str, patch: dict[str, Any]) -> dict[str, Any]:
    patch = {**patch, "user_id": user_id}
    res = db().table("company_profile").upsert(patch, on_conflict="user_id").execute()
    return res.data[0] if res.data else patch


# ----------------------------------------------------------------------------
# knowledge_items / chunks
# ----------------------------------------------------------------------------
def create_knowledge_item(item: dict[str, Any]) -> dict[str, Any]:
    res = db().table("knowledge_items").insert(item).execute()
    return res.data[0]


def update_knowledge_item(item_id: str, patch: dict[str, Any]) -> None:
    db().table("knowledge_items").update(patch).eq("id", item_id).execute()


def get_knowledge_item(user_id: str, item_id: str) -> Optional[dict[str, Any]]:
    res = (
        db()
        .table("knowledge_items")
        .select("*")
        .eq("user_id", user_id)
        .eq("id", item_id)
        .limit(1)
        .execute()
    )
    return res.data[0] if res.data else None


def list_knowledge_items(user_id: str, search: str | None = None) -> list[dict[str, Any]]:
    q = db().table("knowledge_items").select("*").eq("user_id", user_id)
    if search:
        q = q.ilike("title", f"%{search}%")
    res = q.order("created_at", desc=True).execute()
    return res.data or []


def delete_knowledge_item(user_id: str, item_id: str) -> None:
    db().table("knowledge_items").delete().eq("user_id", user_id).eq("id", item_id).execute()


def insert_chunks(chunks: list[dict[str, Any]]) -> int:
    if not chunks:
        return 0
    db().table("knowledge_chunks").insert(chunks).execute()
    return len(chunks)


def match_chunks(
    user_id: str, embedding: list[float], match_count: int = 6, threshold: float = 0.0
) -> list[dict[str, Any]]:
    res = db().rpc(
        "match_chunks",
        {
            "p_user_id": user_id,
            "query_embedding": embedding,
            "match_count": match_count,
            "similarity_threshold": threshold,
        },
    ).execute()
    return res.data or []


def memory_stats(user_id: str) -> dict[str, Any]:
    items = db().table("knowledge_items").select("id, byte_size, chunk_count").eq(
        "user_id", user_id
    ).execute().data or []
    chunks = db().table("knowledge_chunks").select("id", count="exact").eq(
        "user_id", user_id
    ).execute()
    return {
        "doc_count": len(items),
        "chunk_count": chunks.count or 0,
        "storage_bytes": sum(i.get("byte_size") or 0 for i in items),
    }


# ----------------------------------------------------------------------------
# connectors
# ----------------------------------------------------------------------------
def list_connectors(user_id: str) -> list[dict[str, Any]]:
    res = db().table("connectors").select("*").eq("user_id", user_id).execute()
    return res.data or []


def get_connector(user_id: str, conn_type: str) -> Optional[dict[str, Any]]:
    res = (
        db()
        .table("connectors")
        .select("*")
        .eq("user_id", user_id)
        .eq("type", conn_type)
        .limit(1)
        .execute()
    )
    return res.data[0] if res.data else None


def upsert_connector(user_id: str, conn_type: str, patch: dict[str, Any]) -> dict[str, Any]:
    payload = {**patch, "user_id": user_id, "type": conn_type}
    res = db().table("connectors").upsert(payload, on_conflict="user_id,type").execute()
    return res.data[0] if res.data else payload


def delete_connector(user_id: str, conn_type: str) -> None:
    db().table("connectors").delete().eq("user_id", user_id).eq("type", conn_type).execute()


# ----------------------------------------------------------------------------
# channels
# ----------------------------------------------------------------------------
def list_channels(user_id: str) -> list[dict[str, Any]]:
    res = db().table("channels").select("*").eq("user_id", user_id).execute()
    return res.data or []


def upsert_channel(user_id: str, ch_type: str, patch: dict[str, Any]) -> dict[str, Any]:
    payload = {**patch, "user_id": user_id, "type": ch_type}
    res = db().table("channels").upsert(payload, on_conflict="user_id,type").execute()
    return res.data[0] if res.data else payload


def find_channel_by_external(ch_type: str, external_id: str) -> Optional[dict[str, Any]]:
    res = (
        db()
        .table("channels")
        .select("*")
        .eq("type", ch_type)
        .eq("external_id", external_id)
        .eq("is_active", True)
        .limit(1)
        .execute()
    )
    return res.data[0] if res.data else None


# ----------------------------------------------------------------------------
# conversations / messages
# ----------------------------------------------------------------------------
def get_or_create_conversation(
    user_id: str, channel: str, external_id: str | None = None
) -> dict[str, Any]:
    q = (
        db()
        .table("conversations")
        .select("*")
        .eq("user_id", user_id)
        .eq("channel", channel)
    )
    if external_id is not None:
        q = q.eq("external_id", external_id)
    res = q.order("last_message_at", desc=True).limit(1).execute()
    if res.data:
        return res.data[0]
    created = (
        db()
        .table("conversations")
        .insert({"user_id": user_id, "channel": channel, "external_id": external_id})
        .execute()
    )
    return created.data[0]


def get_conversation(user_id: str, conversation_id: str) -> Optional[dict[str, Any]]:
    res = (
        db()
        .table("conversations")
        .select("*")
        .eq("user_id", user_id)
        .eq("id", conversation_id)
        .limit(1)
        .execute()
    )
    return res.data[0] if res.data else None


def list_conversations(user_id: str, limit: int = 50) -> list[dict[str, Any]]:
    res = (
        db()
        .table("conversations")
        .select("*")
        .eq("user_id", user_id)
        .order("last_message_at", desc=True)
        .limit(limit)
        .execute()
    )
    return res.data or []


def touch_conversation(conversation_id: str, title: str | None = None) -> None:
    patch: dict[str, Any] = {"last_message_at": _now()}
    if title:
        patch["title"] = title
    db().table("conversations").update(patch).eq("id", conversation_id).execute()


def add_message(message: dict[str, Any]) -> dict[str, Any]:
    res = db().table("messages").insert(message).execute()
    return res.data[0]


def list_messages(conversation_id: str, limit: int = 200) -> list[dict[str, Any]]:
    res = (
        db()
        .table("messages")
        .select("*")
        .eq("conversation_id", conversation_id)
        .order("created_at", desc=False)
        .limit(limit)
        .execute()
    )
    return res.data or []


def recent_messages(conversation_id: str, limit: int = 10) -> list[dict[str, Any]]:
    res = (
        db()
        .table("messages")
        .select("*")
        .eq("conversation_id", conversation_id)
        .order("created_at", desc=True)
        .limit(limit)
        .execute()
    )
    return list(reversed(res.data or []))


def activity_feed(user_id: str, limit: int = 20) -> list[dict[str, Any]]:
    res = (
        db()
        .table("messages")
        .select("id, role, content, created_at, conversation_id")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .limit(limit)
        .execute()
    )
    return res.data or []


# ----------------------------------------------------------------------------
# usage / admin
# ----------------------------------------------------------------------------
def token_usage(user_id: str | None = None) -> dict[str, Any]:
    q = db().table("messages").select("tokens_in, tokens_out")
    if user_id:
        q = q.eq("user_id", user_id)
    rows = q.execute().data or []
    return {
        "tokens_in": sum(r.get("tokens_in") or 0 for r in rows),
        "tokens_out": sum(r.get("tokens_out") or 0 for r in rows),
        "messages": len(rows),
    }


def messages_today(user_id: str) -> int:
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    res = (
        db()
        .table("messages")
        .select("id", count="exact")
        .eq("user_id", user_id)
        .gte("created_at", f"{today}T00:00:00+00:00")
        .execute()
    )
    return res.count or 0
