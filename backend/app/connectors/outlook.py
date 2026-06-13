"""Microsoft connector — Outlook mail + calendar via Graph. Shared MS OAuth.

Also backs Excel Online (workbook ranges) using the same token.
"""
from __future__ import annotations

import time
from typing import Any, Optional
from urllib.parse import urlencode

import httpx

from app.config import settings
from app.connectors.base import ConnectorError

GRAPH = "https://graph.microsoft.com/v1.0"

SCOPES = [
    "offline_access",
    "User.Read",
    "Mail.Read",
    "Calendars.Read",
    "Files.Read.All",
]


def _tenant() -> str:
    return settings.microsoft_tenant or "common"


def authorize_url(state: str) -> str:
    params = {
        "client_id": settings.microsoft_client_id,
        "response_type": "code",
        "redirect_uri": settings.microsoft_redirect_uri,
        "response_mode": "query",
        "scope": " ".join(SCOPES),
        "state": state,
    }
    return (
        f"https://login.microsoftonline.com/{_tenant()}/oauth2/v2.0/authorize?"
        + urlencode(params)
    )


async def exchange_code(code: str) -> dict[str, Any]:
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(
            f"https://login.microsoftonline.com/{_tenant()}/oauth2/v2.0/token",
            data={
                "client_id": settings.microsoft_client_id,
                "client_secret": settings.microsoft_client_secret,
                "code": code,
                "redirect_uri": settings.microsoft_redirect_uri,
                "grant_type": "authorization_code",
                "scope": " ".join(SCOPES),
            },
        )
        resp.raise_for_status()
        tok = resp.json()
        tok["expires_at"] = time.time() + tok.get("expires_in", 3600)
        return tok


async def _ensure_token(creds: dict[str, Any]) -> str:
    if creds.get("expires_at", 0) > time.time() + 60 and creds.get("access_token"):
        return creds["access_token"]
    refresh = creds.get("refresh_token")
    if not refresh:
        if creds.get("access_token"):
            return creds["access_token"]
        raise ConnectorError("Microsoft token expired and no refresh token available")
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(
            f"https://login.microsoftonline.com/{_tenant()}/oauth2/v2.0/token",
            data={
                "client_id": settings.microsoft_client_id,
                "client_secret": settings.microsoft_client_secret,
                "refresh_token": refresh,
                "grant_type": "refresh_token",
                "scope": " ".join(SCOPES),
            },
        )
        resp.raise_for_status()
        tok = resp.json()
        creds["access_token"] = tok["access_token"]
        creds["refresh_token"] = tok.get("refresh_token", refresh)
        creds["expires_at"] = time.time() + tok.get("expires_in", 3600)
        return creds["access_token"]


async def _get(creds: dict[str, Any], path: str, params: dict | None = None) -> dict:
    token = await _ensure_token(creds)
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.get(
            f"{GRAPH}{path}",
            headers={"Authorization": f"Bearer {token}"},
            params=params,
        )
        resp.raise_for_status()
        return resp.json()


async def search_emails(
    creds: dict[str, Any], query: Optional[str] = None, limit: int = 15
) -> list[dict[str, Any]]:
    params: dict[str, Any] = {
        "$top": limit,
        "$select": "subject,from,receivedDateTime,bodyPreview",
        "$orderby": "receivedDateTime desc",
    }
    if query:
        params["$search"] = f'"{query}"'
        params.pop("$orderby", None)  # $search and $orderby conflict in Graph
    data = await _get(creds, "/me/messages", params=params)
    return data.get("value", [])


async def get_calendar_events(
    creds: dict[str, Any], date_from: str, date_to: str, limit: int = 25
) -> list[dict[str, Any]]:
    params = {
        "startDateTime": date_from,
        "endDateTime": date_to,
        "$top": limit,
        "$select": "subject,start,end,location,organizer",
        "$orderby": "start/dateTime",
    }
    data = await _get(creds, "/me/calendarView", params=params)
    return data.get("value", [])


async def read_workbook_range(
    creds: dict[str, Any], item_id: str, worksheet: str, address: str
) -> list[list[Any]]:
    data = await _get(
        creds,
        f"/me/drive/items/{item_id}/workbook/worksheets/{worksheet}/range(address='{address}')",
    )
    return data.get("values", [])


async def test(creds: dict[str, Any]) -> dict[str, Any]:
    me = await _get(creds, "/me", params={"$select": "displayName,mail"})
    return {"ok": True, "account": me.get("mail") or me.get("displayName")}
