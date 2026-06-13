"""Qonto connector — API key (login:secret-key); transactions, balances."""
from __future__ import annotations

from typing import Any, Optional

import httpx

from app.connectors.base import ConnectorError

API_BASE = "https://thirdparty.qonto.com/v2"


def _auth_header(creds: dict[str, Any]) -> dict[str, str]:
    login = creds.get("login")
    secret = creds.get("secret_key") or creds.get("api_key")
    if not (login and secret):
        raise ConnectorError("Qonto credentials require login and secret_key")
    return {"Authorization": f"{login}:{secret}"}


async def _get(creds: dict[str, Any], path: str, params: dict | None = None) -> dict:
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.get(
            f"{API_BASE}{path}", headers=_auth_header(creds), params=params
        )
        resp.raise_for_status()
        return resp.json()


async def get_organization(creds: dict[str, Any]) -> dict[str, Any]:
    return await _get(creds, "/organization")


async def get_balances(creds: dict[str, Any]) -> list[dict[str, Any]]:
    org = (await get_organization(creds)).get("organization", {})
    accounts = org.get("bank_accounts", [])
    return [
        {
            "name": a.get("name"),
            "iban": a.get("iban"),
            "balance": a.get("balance"),
            "currency": a.get("currency"),
        }
        for a in accounts
    ]


async def get_transactions(
    creds: dict[str, Any],
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    iban: Optional[str] = None,
) -> list[dict[str, Any]]:
    params: dict[str, Any] = {"per_page": 100}
    if not iban:
        balances = await get_balances(creds)
        if not balances:
            return []
        iban = balances[0]["iban"]
    params["iban"] = iban
    if date_from:
        params["settled_at_from"] = date_from
    if date_to:
        params["settled_at_to"] = date_to
    data = await _get(creds, "/transactions", params=params)
    return data.get("transactions", [])


async def test(creds: dict[str, Any]) -> dict[str, Any]:
    balances = await get_balances(creds)
    return {"ok": True, "accounts": len(balances), "preview": balances[:3]}
