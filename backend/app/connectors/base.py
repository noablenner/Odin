"""Shared helpers for connectors: credential load/store + result envelope."""
from __future__ import annotations

from typing import Any, Optional

from app.db import queries
from app.utils.encryption import decrypt_json, encrypt_json


class ConnectorError(Exception):
    """Raised when a connector cannot complete an operation."""


def load_credentials(user_id: str, conn_type: str) -> dict[str, Any]:
    conn = queries.get_connector(user_id, conn_type)
    if not conn:
        raise ConnectorError(f"{conn_type} is not connected")
    blob = conn.get("credentials_encrypted")
    creds = decrypt_json(blob) if blob else {}
    creds["__config__"] = conn.get("config") or {}
    return creds


def save_credentials(
    user_id: str,
    conn_type: str,
    credentials: dict[str, Any],
    *,
    display_name: Optional[str] = None,
    status: str = "connected",
    config: Optional[dict[str, Any]] = None,
    last_error: Optional[str] = None,
) -> dict[str, Any]:
    patch: dict[str, Any] = {
        "credentials_encrypted": encrypt_json(credentials),
        "status": status,
        "last_error": last_error,
    }
    if display_name is not None:
        patch["display_name"] = display_name
    if config is not None:
        patch["config"] = config
    return queries.upsert_connector(user_id, conn_type, patch)


def mark_error(user_id: str, conn_type: str, error: str) -> None:
    queries.upsert_connector(
        user_id, conn_type, {"status": "error", "last_error": error[:500]}
    )
