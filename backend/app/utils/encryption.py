"""Fernet (AES-256) encryption for connector credentials at rest."""
from __future__ import annotations

import hashlib
import json
from typing import Any

from cryptography.fernet import Fernet, InvalidToken

from app.config import settings
from app.utils.logger import get_logger

log = get_logger(__name__)


def _fernet() -> Fernet:
    key = settings.encryption_key
    if not key:
        raise RuntimeError("ENCRYPTION_KEY is not set; cannot encrypt credentials.")
    return Fernet(key.encode() if isinstance(key, str) else key)


def encrypt_str(plaintext: str) -> str:
    return _fernet().encrypt(plaintext.encode()).decode()


def decrypt_str(ciphertext: str) -> str:
    try:
        return _fernet().decrypt(ciphertext.encode()).decode()
    except InvalidToken as exc:  # pragma: no cover - defensive
        log.error("Failed to decrypt credential blob: %s", exc)
        raise


def encrypt_json(data: dict[str, Any]) -> str:
    return encrypt_str(json.dumps(data, separators=(",", ":")))


def decrypt_json(ciphertext: str) -> dict[str, Any]:
    if not ciphertext:
        return {}
    return json.loads(decrypt_str(ciphertext))


def sha256(value: str) -> str:
    """Stable hash used for API keys and bot-token lookups (not reversible)."""
    return hashlib.sha256(value.encode()).hexdigest()
