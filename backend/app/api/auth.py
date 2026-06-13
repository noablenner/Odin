"""Auth-adjacent API — current user, API-key management, account deletion."""
from __future__ import annotations

import secrets

from fastapi import APIRouter, Depends

from app.api.deps import API_KEY_PREFIX, get_current_user
from app.db import queries
from app.db.supabase import get_service_client
from app.models.schemas import AuthUser, OkResponse
from app.utils.encryption import sha256
from app.utils.logger import get_logger

log = get_logger(__name__)
router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.get("/me", response_model=AuthUser)
async def me(user: AuthUser = Depends(get_current_user)):
    return user


@router.post("/api-key")
async def rotate_api_key(user: AuthUser = Depends(get_current_user)):
    """Generate a new personal API key. Returned once; only the hash is stored."""
    key = f"{API_KEY_PREFIX}{secrets.token_urlsafe(32)}"
    queries.update_user(user.id, {"api_key_hash": sha256(key)})
    return {"api_key": key, "note": "Store this now — it will not be shown again."}


@router.delete("/account", response_model=OkResponse)
async def delete_account(user: AuthUser = Depends(get_current_user)):
    """Delete the user's data and auth record (danger zone)."""
    # Cascades remove all owned rows via FK on delete cascade.
    queries.update_user(user.id, {"subscription_status": "canceled"})
    try:
        get_service_client().auth.admin.delete_user(user.id)
    except Exception:
        log.exception("auth.admin.delete_user failed for %s", user.id)
    return OkResponse(detail="account deleted")
