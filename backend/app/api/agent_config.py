"""Agent configuration API — company profile, personality, channels, model."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException

from app.api.deps import get_current_user
from app.db import queries
from app.models.schemas import AuthUser, ChannelIn, CompanyProfile, OkResponse
from app.utils.encryption import encrypt_json, sha256

router = APIRouter(prefix="/api/agent", tags=["agent"])


@router.get("/profile", response_model=CompanyProfile)
async def get_profile(user: AuthUser = Depends(get_current_user)):
    profile = queries.get_profile(user.id) or {}
    return CompanyProfile(**{k: profile.get(k) for k in CompanyProfile.model_fields})


@router.put("/profile", response_model=CompanyProfile)
async def update_profile(
    body: CompanyProfile, user: AuthUser = Depends(get_current_user)
):
    patch = body.model_dump(exclude_none=True)
    saved = queries.upsert_profile(user.id, patch)
    return CompanyProfile(**{k: saved.get(k) for k in CompanyProfile.model_fields})


@router.get("/channels")
async def list_channels(user: AuthUser = Depends(get_current_user)):
    channels = queries.list_channels(user.id)
    # Never leak secrets back to the client.
    out = []
    for c in channels:
        cfg = c.get("config") or {}
        out.append(
            {
                "type": c["type"],
                "is_active": c["is_active"],
                "phone_number": cfg.get("phone_number"),
                "has_bot_token": bool(cfg.get("bot_token_encrypted")),
            }
        )
    return out


@router.put("/channels", response_model=OkResponse)
async def configure_channel(
    body: ChannelIn, user: AuthUser = Depends(get_current_user)
):
    config: dict = {}
    external_id = None

    if body.type == "whatsapp":
        if body.is_active and not body.phone_number:
            raise HTTPException(422, "WhatsApp requires a phone number")
        config["phone_number"] = body.phone_number
        external_id = (body.phone_number or "").replace("whatsapp:", "").strip()
    elif body.type == "telegram":
        if body.is_active and not body.bot_token:
            raise HTTPException(422, "Telegram requires a bot token")
        if body.bot_token:
            config["bot_token_encrypted"] = encrypt_json({"token": body.bot_token})
            external_id = sha256(body.bot_token)

    queries.upsert_channel(
        user.id,
        body.type,
        {"is_active": body.is_active, "config": config, "external_id": external_id},
    )
    return OkResponse(detail=f"{body.type} channel updated")
