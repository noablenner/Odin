"""Google Sheets read/write (uses the Google OAuth credentials)."""
from __future__ import annotations

from typing import Any

import httpx

from app.connectors.google_drive import _ensure_token

SHEETS_API = "https://sheets.googleapis.com/v4/spreadsheets"


async def read_range(creds: dict[str, Any], sheet_id: str, cell_range: str) -> list[list[Any]]:
    token = await _ensure_token(creds)
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.get(
            f"{SHEETS_API}/{sheet_id}/values/{cell_range}",
            headers={"Authorization": f"Bearer {token}"},
        )
        resp.raise_for_status()
        return resp.json().get("values", [])


async def write_range(
    creds: dict[str, Any], sheet_id: str, cell_range: str, values: list[list[Any]]
) -> dict[str, Any]:
    token = await _ensure_token(creds)
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.put(
            f"{SHEETS_API}/{sheet_id}/values/{cell_range}",
            headers={"Authorization": f"Bearer {token}"},
            params={"valueInputOption": "USER_ENTERED"},
            json={"values": values},
        )
        resp.raise_for_status()
        return resp.json()


async def test(creds: dict[str, Any]) -> dict[str, Any]:
    # Sheets shares the Google connection; presence of a token is enough.
    await _ensure_token(creds)
    return {"ok": True}
