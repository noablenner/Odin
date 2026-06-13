"""Connectors API — connect (OAuth / API key), test, preview, disconnect."""
from __future__ import annotations

import base64
import hashlib
import secrets
import time
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import RedirectResponse

from app.api.deps import get_current_user
from app.config import settings
from app.connectors import airtable, generic, google_drive, outlook, qonto, sheets
from app.connectors.base import load_credentials, mark_error, save_credentials
from app.db import queries
from app.models.schemas import (
    ApiKeyConnectIn,
    AuthUser,
    ConnectorOut,
    GenericRestConnectIn,
    OkResponse,
)
from app.utils.logger import get_logger

log = get_logger(__name__)
router = APIRouter(prefix="/api/connectors", tags=["connectors"])

# Ephemeral OAuth state store (state -> {user_id, verifier, ts}).
# For production, back this with Redis; in-memory is fine for a single worker.
_OAUTH_STATE: dict[str, dict[str, Any]] = {}
_STATE_TTL = 600


def _new_state(user_id: str, verifier: str | None = None) -> str:
    state = secrets.token_urlsafe(24)
    _OAUTH_STATE[state] = {"user_id": user_id, "verifier": verifier, "ts": time.time()}
    # prune old entries
    cutoff = time.time() - _STATE_TTL
    for k in [k for k, v in _OAUTH_STATE.items() if v["ts"] < cutoff]:
        _OAUTH_STATE.pop(k, None)
    return state


def _pop_state(state: str) -> dict[str, Any]:
    data = _OAUTH_STATE.pop(state, None)
    if not data or data["ts"] < time.time() - _STATE_TTL:
        raise HTTPException(400, "Invalid or expired OAuth state")
    return data


def _pkce_pair() -> tuple[str, str]:
    verifier = secrets.token_urlsafe(64)
    challenge = (
        base64.urlsafe_b64encode(hashlib.sha256(verifier.encode()).digest())
        .decode()
        .rstrip("=")
    )
    return verifier, challenge


# ---------------------------------------------------------------------------
# List + status
# ---------------------------------------------------------------------------
@router.get("", response_model=list[ConnectorOut])
async def list_connectors(user: AuthUser = Depends(get_current_user)):
    return queries.list_connectors(user.id)


# ---------------------------------------------------------------------------
# API-key style connectors (Qonto, Airtable PAT, generic REST)
# ---------------------------------------------------------------------------
@router.post("/api-key", response_model=ConnectorOut)
async def connect_api_key(
    body: ApiKeyConnectIn, user: AuthUser = Depends(get_current_user)
):
    if body.type not in {"airtable", "qonto", "rest"}:
        raise HTTPException(422, f"{body.type} does not support API-key connection")

    creds: dict[str, Any] = {"api_key": body.api_key, **body.config}
    if body.type == "qonto":
        # Expect "login:secret" or separate config fields.
        if ":" in body.api_key and "login" not in body.config:
            login, secret = body.api_key.split(":", 1)
            creds = {"login": login, "secret_key": secret}

    saved = save_credentials(
        user.id,
        body.type,
        creds,
        display_name=body.display_name or body.type.title(),
        config=body.config,
    )
    return saved


@router.post("/rest", response_model=ConnectorOut)
async def connect_rest(
    body: GenericRestConnectIn, user: AuthUser = Depends(get_current_user)
):
    config = {
        "base_url": body.base_url,
        "auth_header": body.auth_header,
        "auth_scheme": body.auth_scheme,
    }
    saved = save_credentials(
        user.id,
        "rest",
        {"api_key": body.api_key, "base_url": body.base_url},
        display_name=body.display_name or "REST API",
        config=config,
    )
    return saved


# ---------------------------------------------------------------------------
# OAuth — Airtable (PKCE)
# ---------------------------------------------------------------------------
@router.get("/airtable/authorize")
async def airtable_authorize(user: AuthUser = Depends(get_current_user)):
    verifier, challenge = _pkce_pair()
    state = _new_state(user.id, verifier)
    return {"url": airtable.authorize_url(state, challenge)}


@router.get("/airtable/callback")
async def airtable_callback(code: str = Query(...), state: str = Query(...)):
    data = _pop_state(state)
    tokens = await airtable.exchange_code(code, data["verifier"])
    save_credentials(data["user_id"], "airtable", tokens, display_name="Airtable")
    return RedirectResponse(f"{settings.frontend_url}/connectors?connected=airtable")


# ---------------------------------------------------------------------------
# OAuth — Google (Drive + Sheets)
# ---------------------------------------------------------------------------
@router.get("/google/authorize")
async def google_authorize(user: AuthUser = Depends(get_current_user)):
    state = _new_state(user.id)
    return {"url": google_drive.authorize_url(state)}


@router.get("/google/callback")
async def google_callback(code: str = Query(...), state: str = Query(...)):
    data = _pop_state(state)
    tokens = await google_drive.exchange_code(code)
    # One Google connection backs both Drive and Sheets tools.
    save_credentials(data["user_id"], "google_drive", tokens, display_name="Google Drive")
    save_credentials(data["user_id"], "google_sheets", tokens, display_name="Google Sheets")
    return RedirectResponse(f"{settings.frontend_url}/connectors?connected=google")


# ---------------------------------------------------------------------------
# OAuth — Microsoft (Outlook + Excel Online)
# ---------------------------------------------------------------------------
@router.get("/microsoft/authorize")
async def microsoft_authorize(user: AuthUser = Depends(get_current_user)):
    state = _new_state(user.id)
    return {"url": outlook.authorize_url(state)}


@router.get("/microsoft/callback")
async def microsoft_callback(code: str = Query(...), state: str = Query(...)):
    data = _pop_state(state)
    tokens = await outlook.exchange_code(code)
    save_credentials(data["user_id"], "outlook", tokens, display_name="Microsoft Outlook")
    save_credentials(data["user_id"], "excel_online", tokens, display_name="Excel Online")
    return RedirectResponse(f"{settings.frontend_url}/connectors?connected=microsoft")


# ---------------------------------------------------------------------------
# Test + preview + disconnect
# ---------------------------------------------------------------------------
_TESTERS = {
    "airtable": airtable.test,
    "qonto": qonto.test,
    "google_drive": google_drive.test,
    "google_sheets": sheets.test,
    "outlook": outlook.test,
    "excel_online": outlook.test,
    "rest": generic.test_rest,
}


@router.post("/{conn_type}/test")
async def test_connector(conn_type: str, user: AuthUser = Depends(get_current_user)):
    tester = _TESTERS.get(conn_type)
    if not tester:
        raise HTTPException(422, f"No test available for {conn_type}")
    try:
        creds = load_credentials(user.id, conn_type)
        result = await tester(creds)
        queries.upsert_connector(
            user.id,
            conn_type,
            {"status": "connected", "last_sync_at": queries._now(), "last_error": None},
        )
        return {"ok": True, "result": result}
    except Exception as exc:
        mark_error(user.id, conn_type, str(exc))
        raise HTTPException(400, f"Connection test failed: {exc}")


@router.get("/{conn_type}/preview")
async def preview_connector(conn_type: str, user: AuthUser = Depends(get_current_user)):
    """Return up to the last 3 records fetched, for the connector card."""
    try:
        creds = load_credentials(user.id, conn_type)
        if conn_type == "qonto":
            return {"records": (await qonto.get_balances(creds))[:3]}
        if conn_type == "airtable":
            return {"records": (await airtable.list_bases(creds))[:3]}
        if conn_type in {"google_drive", "google_sheets"}:
            return {"records": (await google_drive.search_files(creds, "", 3))[:3]}
        if conn_type in {"outlook", "excel_online"}:
            return {"records": (await outlook.search_emails(creds, None, 3))[:3]}
        if conn_type == "webhook":
            conn = queries.get_connector(user.id, "webhook") or {}
            return {"records": (conn.get("config") or {}).get("recent", [])[:3]}
        if conn_type == "rest":
            return {"records": [await generic.rest_request(creds)]}
    except Exception as exc:
        raise HTTPException(400, f"Preview failed: {exc}")
    raise HTTPException(422, f"No preview for {conn_type}")


@router.delete("/{conn_type}", response_model=OkResponse)
async def disconnect(conn_type: str, user: AuthUser = Depends(get_current_user)):
    queries.delete_connector(user.id, conn_type)
    # Google/Microsoft back two connector rows; clean up the sibling.
    sibling = {
        "google_drive": "google_sheets",
        "google_sheets": "google_drive",
        "outlook": "excel_online",
        "excel_online": "outlook",
    }.get(conn_type)
    if sibling:
        queries.delete_connector(user.id, sibling)
    return OkResponse(detail=f"{conn_type} disconnected")
