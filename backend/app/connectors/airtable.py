"""Airtable connector — OAuth or personal access token; read/write records."""
from __future__ import annotations

from typing import Any, Optional
from urllib.parse import quote

import httpx

from app.config import settings
from app.connectors.base import ConnectorError

API_BASE = "https://api.airtable.com/v0"
META_BASE = "https://api.airtable.com/v0/meta"
OAUTH_AUTH = "https://airtable.com/oauth2/v1/authorize"
OAUTH_TOKEN = "https://airtable.com/oauth2/v1/token"


def authorize_url(state: str, code_challenge: str) -> str:
    from urllib.parse import urlencode

    params = {
        "client_id": settings.airtable_client_id,
        "redirect_uri": settings.airtable_redirect_uri,
        "response_type": "code",
        "scope": "data.records:read data.records:write schema.bases:read",
        "state": state,
        "code_challenge": code_challenge,
        "code_challenge_method": "S256",
    }
    return f"{OAUTH_AUTH}?{urlencode(params)}"


async def exchange_code(code: str, code_verifier: str) -> dict[str, Any]:
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(
            OAUTH_TOKEN,
            data={
                "grant_type": "authorization_code",
                "code": code,
                "redirect_uri": settings.airtable_redirect_uri,
                "client_id": settings.airtable_client_id,
                "code_verifier": code_verifier,
            },
            auth=(settings.airtable_client_id, settings.airtable_client_secret),
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        resp.raise_for_status()
        return resp.json()


def _token(creds: dict[str, Any]) -> str:
    token = creds.get("access_token") or creds.get("api_key")
    if not token:
        raise ConnectorError("Airtable token missing")
    return token


async def _get(creds: dict[str, Any], url: str, params: dict | None = None) -> dict:
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.get(
            url, headers={"Authorization": f"Bearer {_token(creds)}"}, params=params
        )
        resp.raise_for_status()
        return resp.json()


async def list_bases(creds: dict[str, Any]) -> list[dict[str, Any]]:
    data = await _get(creds, f"{META_BASE}/bases")
    return data.get("bases", [])


async def list_tables(creds: dict[str, Any], base_id: str) -> list[dict[str, Any]]:
    data = await _get(creds, f"{META_BASE}/bases/{base_id}/tables")
    return data.get("tables", [])


async def get_records(
    creds: dict[str, Any],
    base_id: str,
    table: str,
    filter_formula: Optional[str] = None,
    max_records: int = 50,
) -> list[dict[str, Any]]:
    params: dict[str, Any] = {"maxRecords": max_records}
    if filter_formula:
        params["filterByFormula"] = filter_formula
    data = await _get(creds, f"{API_BASE}/{base_id}/{quote(table)}", params=params)
    return data.get("records", [])


async def create_record(
    creds: dict[str, Any], base_id: str, table: str, fields: dict[str, Any]
) -> dict[str, Any]:
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(
            f"{API_BASE}/{base_id}/{quote(table)}",
            headers={
                "Authorization": f"Bearer {_token(creds)}",
                "Content-Type": "application/json",
            },
            json={"fields": fields},
        )
        resp.raise_for_status()
        return resp.json()


async def test(creds: dict[str, Any]) -> dict[str, Any]:
    bases = await list_bases(creds)
    return {"ok": True, "bases": len(bases), "preview": bases[:3]}
