"""Google connector base + Drive operations. Shared OAuth for Drive & Sheets."""
from __future__ import annotations

import time
from typing import Any
from urllib.parse import urlencode

import httpx

from app.config import settings
from app.connectors.base import ConnectorError

AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
TOKEN_URL = "https://oauth2.googleapis.com/token"
DRIVE_API = "https://www.googleapis.com/drive/v3"

SCOPES = [
    "https://www.googleapis.com/auth/drive.readonly",
    "https://www.googleapis.com/auth/spreadsheets",
    "openid",
    "email",
]


def authorize_url(state: str) -> str:
    params = {
        "client_id": settings.google_client_id,
        "redirect_uri": settings.google_redirect_uri,
        "response_type": "code",
        "scope": " ".join(SCOPES),
        "access_type": "offline",
        "prompt": "consent",
        "state": state,
    }
    return f"{AUTH_URL}?{urlencode(params)}"


async def exchange_code(code: str) -> dict[str, Any]:
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(
            TOKEN_URL,
            data={
                "code": code,
                "client_id": settings.google_client_id,
                "client_secret": settings.google_client_secret,
                "redirect_uri": settings.google_redirect_uri,
                "grant_type": "authorization_code",
            },
        )
        resp.raise_for_status()
        tok = resp.json()
        tok["expires_at"] = time.time() + tok.get("expires_in", 3600)
        return tok


async def _ensure_token(creds: dict[str, Any]) -> str:
    """Return a valid access token, refreshing if expired."""
    if creds.get("expires_at", 0) > time.time() + 60 and creds.get("access_token"):
        return creds["access_token"]
    refresh = creds.get("refresh_token")
    if not refresh:
        if creds.get("access_token"):
            return creds["access_token"]
        raise ConnectorError("Google token expired and no refresh token available")
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(
            TOKEN_URL,
            data={
                "refresh_token": refresh,
                "client_id": settings.google_client_id,
                "client_secret": settings.google_client_secret,
                "grant_type": "refresh_token",
            },
        )
        resp.raise_for_status()
        tok = resp.json()
        creds["access_token"] = tok["access_token"]
        creds["expires_at"] = time.time() + tok.get("expires_in", 3600)
        return creds["access_token"]


async def search_files(creds: dict[str, Any], query: str, limit: int = 10) -> list[dict]:
    token = await _ensure_token(creds)
    q = f"fullText contains '{query}'" if query else None
    params = {
        "pageSize": limit,
        "fields": "files(id,name,mimeType,modifiedTime,webViewLink)",
    }
    if q:
        params["q"] = q
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.get(
            f"{DRIVE_API}/files",
            headers={"Authorization": f"Bearer {token}"},
            params=params,
        )
        resp.raise_for_status()
        return resp.json().get("files", [])


async def get_file_text(creds: dict[str, Any], file_id: str) -> str:
    token = await _ensure_token(creds)
    async with httpx.AsyncClient(timeout=60) as client:
        # Try export (Google Docs) first, then raw download.
        resp = await client.get(
            f"{DRIVE_API}/files/{file_id}/export",
            headers={"Authorization": f"Bearer {token}"},
            params={"mimeType": "text/plain"},
        )
        if resp.status_code == 200:
            return resp.text
        resp = await client.get(
            f"{DRIVE_API}/files/{file_id}",
            headers={"Authorization": f"Bearer {token}"},
            params={"alt": "media"},
        )
        resp.raise_for_status()
        return resp.text


async def test(creds: dict[str, Any]) -> dict[str, Any]:
    files = await search_files(creds, "", limit=3)
    return {"ok": True, "files": len(files), "preview": files[:3]}
