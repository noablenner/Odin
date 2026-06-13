"""Generic connectors: inbound webhook + outbound REST API."""
from __future__ import annotations

from typing import Any, Optional

import httpx

from app.connectors.base import ConnectorError


async def rest_request(
    creds: dict[str, Any],
    path: str = "",
    method: str = "GET",
    params: Optional[dict] = None,
    json_body: Optional[dict] = None,
) -> Any:
    cfg = creds.get("__config__", {})
    base_url = cfg.get("base_url") or creds.get("base_url")
    if not base_url:
        raise ConnectorError("REST connector missing base_url")

    headers: dict[str, str] = {}
    api_key = creds.get("api_key")
    if api_key:
        scheme = cfg.get("auth_scheme", "Bearer")
        header_name = cfg.get("auth_header", "Authorization")
        headers[header_name] = f"{scheme} {api_key}".strip()

    url = base_url.rstrip("/") + ("/" + path.lstrip("/") if path else "")
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.request(
            method.upper(), url, params=params, json=json_body, headers=headers
        )
        resp.raise_for_status()
        ctype = resp.headers.get("content-type", "")
        return resp.json() if "application/json" in ctype else resp.text


async def test_rest(creds: dict[str, Any]) -> dict[str, Any]:
    result = await rest_request(creds, path="")
    preview = result if isinstance(result, (list, dict)) else str(result)[:300]
    return {"ok": True, "preview": preview}


def store_webhook_payload(config: dict[str, Any], payload: Any) -> dict[str, Any]:
    """Append an inbound webhook payload to the connector's rolling buffer."""
    history = config.get("recent", [])
    history.insert(0, payload)
    config["recent"] = history[:20]
    return config
