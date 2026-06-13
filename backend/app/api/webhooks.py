"""Inbound webhooks: Twilio WhatsApp, Telegram, generic data webhook.

Messaging webhooks resolve the channel → user, run the *same* agent loop, and
reply on the originating channel. Signatures are verified where the platform
supports it.
"""
from __future__ import annotations

from typing import Any

import httpx
from fastapi import APIRouter, Form, Header, HTTPException, Request
from fastapi.responses import PlainTextResponse, Response
from twilio.request_validator import RequestValidator

from app.agent.core import run_agent_collect
from app.config import settings
from app.connectors import generic
from app.db import queries
from app.models.schemas import AuthUser
from app.utils.encryption import decrypt_json, sha256
from app.utils.logger import get_logger

log = get_logger(__name__)
router = APIRouter(prefix="/api/webhooks", tags=["webhooks"])


def _auth_user_from_row(row: dict[str, Any]) -> AuthUser:
    return AuthUser(
        id=row["id"],
        email=row.get("email", ""),
        plan=row.get("plan", "free"),
        is_superadmin=bool(row.get("is_superadmin")),
        subscription_status=row.get("subscription_status", "inactive"),
        timezone=row.get("timezone", "UTC"),
    )


# ---------------------------------------------------------------------------
# WhatsApp (Twilio)
# ---------------------------------------------------------------------------
@router.post("/whatsapp")
async def whatsapp_webhook(
    request: Request,
    From: str = Form(default=""),
    Body: str = Form(default=""),
    x_twilio_signature: str | None = Header(default=None),
):
    # Verify Twilio signature.
    if settings.twilio_auth_token:
        validator = RequestValidator(settings.twilio_auth_token)
        form = await request.form()
        url = str(request.url)
        if not validator.validate(url, dict(form), x_twilio_signature or ""):
            raise HTTPException(403, "Invalid Twilio signature")

    phone = From.replace("whatsapp:", "").strip()
    channel = queries.find_channel_by_external("whatsapp", phone)
    if not channel:
        return _twiml("This number is not linked to an Odin account.")

    user_row = queries.get_user(channel["user_id"])
    if not user_row:
        return _twiml("Account not found.")

    user = _auth_user_from_row(user_row)
    conversation = queries.get_or_create_conversation(user.id, "whatsapp", phone)
    result = await run_agent_collect(user, Body, conversation)
    return _twiml(result["content"])


def _twiml(text: str) -> Response:
    safe = (text or "").replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    xml = f"<?xml version='1.0' encoding='UTF-8'?><Response><Message>{safe}</Message></Response>"
    return Response(content=xml, media_type="application/xml")


# ---------------------------------------------------------------------------
# Telegram
# ---------------------------------------------------------------------------
@router.post("/telegram")
async def telegram_webhook(
    request: Request,
    x_telegram_bot_api_secret_token: str | None = Header(default=None),
):
    if (
        settings.telegram_webhook_secret
        and x_telegram_bot_api_secret_token != settings.telegram_webhook_secret
    ):
        raise HTTPException(403, "Invalid Telegram secret token")

    update = await request.json()
    msg = update.get("message") or update.get("edited_message")
    if not msg:
        return {"ok": True}

    chat_id = str(msg["chat"]["id"])
    text = msg.get("text", "")

    # Telegram doesn't tell us which bot received this unless we route per-bot.
    # We match by conversation external_id first; otherwise the first active
    # telegram channel. Production: use a per-bot webhook path with the token.
    conversation = _find_telegram_conversation(chat_id)
    if not conversation:
        # No prior conversation — find any active telegram channel to onboard.
        return {"ok": True}

    user_row = queries.get_user(conversation["user_id"])
    user = _auth_user_from_row(user_row)
    result = await run_agent_collect(user, text, conversation)

    # Reply via the user's bot token.
    channel = queries.list_channels(user.id)
    bot = next((c for c in channel if c["type"] == "telegram" and c["is_active"]), None)
    if bot:
        token = decrypt_json(bot["config"]["bot_token_encrypted"]).get("token")
        await _telegram_send(token, chat_id, result["content"])
    return {"ok": True}


def _find_telegram_conversation(chat_id: str) -> dict[str, Any] | None:
    from app.db.supabase import db

    found = (
        db()
        .table("conversations")
        .select("*")
        .eq("channel", "telegram")
        .eq("external_id", chat_id)
        .limit(1)
        .execute()
    )
    return found.data[0] if found.data else None


async def _telegram_send(token: str, chat_id: str, text: str) -> None:
    async with httpx.AsyncClient(timeout=15) as client:
        await client.post(
            f"https://api.telegram.org/bot{token}/sendMessage",
            json={"chat_id": chat_id, "text": text},
        )


@router.post("/telegram/link")
async def telegram_link(payload: dict, user_id: str):
    """Helper to bind a Telegram chat to a user (called once per chat)."""
    chat_id = str(payload.get("chat_id"))
    queries.get_or_create_conversation(user_id, "telegram", chat_id)
    return {"ok": True}


# ---------------------------------------------------------------------------
# Generic inbound data webhook
# ---------------------------------------------------------------------------
@router.post("/data/{token}")
async def generic_data_webhook(token: str, request: Request):
    """Receive arbitrary JSON for a user's 'webhook' connector.

    The {token} is the sha256 of the connector id (set when the webhook
    connector is created on the frontend).
    """
    from app.db.supabase import db

    res = (
        db()
        .table("connectors")
        .select("*")
        .eq("type", "webhook")
        .execute()
    )
    match = next(
        (c for c in (res.data or []) if sha256(c["id"]) == token), None
    )
    if not match:
        raise HTTPException(404, "Unknown webhook token")

    payload = await request.json()
    config = generic.store_webhook_payload(match.get("config") or {}, payload)
    queries.upsert_connector(
        match["user_id"],
        "webhook",
        {"config": config, "status": "connected", "last_sync_at": queries._now()},
    )
    return {"ok": True}
