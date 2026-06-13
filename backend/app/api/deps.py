"""Authentication dependencies.

A request is authenticated by either:
  * a Supabase user JWT (Authorization: Bearer <jwt>), or
  * a personal API key (Authorization: Bearer odin_sk_...), matched by sha256.

`get_current_user` returns an AuthUser and ensures a row exists in public.users.
`require_subscription` gates premium features. `require_superadmin` gates /admin.
"""
from __future__ import annotations

from typing import Optional

import jwt
from fastapi import Depends, Header, HTTPException, status

from app.config import settings
from app.db import queries
from app.models.schemas import AuthUser
from app.utils.encryption import sha256
from app.utils.logger import get_logger

log = get_logger(__name__)

API_KEY_PREFIX = "odin_sk_"


def _decode_supabase_jwt(token: str) -> dict:
    return jwt.decode(
        token,
        settings.supabase_jwt_secret,
        algorithms=["HS256"],
        audience="authenticated",
        options={"verify_aud": True},
    )


async def get_current_user(
    authorization: Optional[str] = Header(default=None),
) -> AuthUser:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Missing bearer token")

    token = authorization.split(" ", 1)[1].strip()

    # --- Personal API key path ---
    if token.startswith(API_KEY_PREFIX):
        row = queries.get_user_by_api_key_hash(sha256(token))
        if not row:
            raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid API key")
        return _to_auth_user(row)

    # --- Supabase JWT path ---
    try:
        payload = _decode_supabase_jwt(token)
    except jwt.PyJWTError as exc:
        log.warning("JWT decode failed: %s", exc)
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid or expired token")

    user_id = payload.get("sub")
    email = payload.get("email", "")
    if not user_id:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Token missing subject")

    row = queries.get_user(user_id)
    if not row:
        # First request after signup (trigger may not have fired in local dev).
        row = queries.upsert_user(user_id, email)
        # Auto-promote configured superadmins.
        if email.lower() in settings.superadmin_email_list:
            queries.update_user(user_id, {"is_superadmin": True})
            row["is_superadmin"] = True
    return _to_auth_user(row)


def _to_auth_user(row: dict) -> AuthUser:
    return AuthUser(
        id=row["id"],
        email=row.get("email", ""),
        plan=row.get("plan", "free"),
        is_superadmin=bool(row.get("is_superadmin")),
        subscription_status=row.get("subscription_status", "inactive"),
        timezone=row.get("timezone", "UTC"),
    )


async def require_subscription(
    user: AuthUser = Depends(get_current_user),
) -> AuthUser:
    """Gate premium features: active subscription OR superadmin."""
    if user.is_superadmin:
        return user
    if user.subscription_status in {"active", "trialing"}:
        return user
    raise HTTPException(
        status.HTTP_402_PAYMENT_REQUIRED,
        "An active subscription is required for this feature.",
    )


async def require_superadmin(
    user: AuthUser = Depends(get_current_user),
) -> AuthUser:
    if not user.is_superadmin:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Superadmin only")
    return user
