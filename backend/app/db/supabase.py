"""Supabase client factory.

Two clients are used:
  * service client  — service-role key, bypasses RLS, used by the backend
                      for all privileged data access.
  * anon client     — anon key, used only when we need to validate a user
                      token in the auth flow.
"""
from __future__ import annotations

from functools import lru_cache

from supabase import Client, create_client

from app.config import settings
from app.utils.logger import get_logger

log = get_logger(__name__)


@lru_cache
def get_service_client() -> Client:
    if not settings.supabase_url or not settings.supabase_service_role_key:
        raise RuntimeError("Supabase URL / service role key not configured.")
    return create_client(settings.supabase_url, settings.supabase_service_role_key)


@lru_cache
def get_anon_client() -> Client:
    if not settings.supabase_url or not settings.supabase_anon_key:
        raise RuntimeError("Supabase URL / anon key not configured.")
    return create_client(settings.supabase_url, settings.supabase_anon_key)


# Convenient module-level accessor for the privileged client.
def db() -> Client:
    return get_service_client()
