"""Pydantic request/response models shared across the API."""
from __future__ import annotations

from datetime import datetime
from typing import Any, Literal, Optional

from pydantic import BaseModel, Field

# ---------------------------------------------------------------------------
# Auth / user
# ---------------------------------------------------------------------------
class AuthUser(BaseModel):
    id: str
    email: str
    plan: str = "free"
    is_superadmin: bool = False
    subscription_status: str = "inactive"
    timezone: str = "UTC"


# ---------------------------------------------------------------------------
# Company profile / agent config
# ---------------------------------------------------------------------------
class CompanyProfile(BaseModel):
    company_name: Optional[str] = None
    activity_description: Optional[str] = None
    custom_instructions: Optional[str] = None
    custom_system_prompt: Optional[str] = None
    agent_name: Optional[str] = "Odin"
    agent_personality: Optional[str] = None
    model_preference: Optional[str] = "auto"
    response_language: Optional[str] = "auto"


# ---------------------------------------------------------------------------
# Chat
# ---------------------------------------------------------------------------
class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1)
    conversation_id: Optional[str] = None


class MessageOut(BaseModel):
    id: str
    role: str
    content: str
    sources_used: list[dict[str, Any]] = []
    tokens_in: int = 0
    tokens_out: int = 0
    created_at: datetime


class ConversationOut(BaseModel):
    id: str
    channel: str
    title: Optional[str] = None
    created_at: datetime
    last_message_at: datetime


# ---------------------------------------------------------------------------
# Memory
# ---------------------------------------------------------------------------
class NoteIn(BaseModel):
    title: str
    content: str
    tags: list[str] = []


class UrlIn(BaseModel):
    url: str
    title: Optional[str] = None
    tags: list[str] = []


class KnowledgeItemOut(BaseModel):
    id: str
    type: str
    title: str
    source_url: Optional[str] = None
    byte_size: int = 0
    chunk_count: int = 0
    tags: list[str] = []
    status: str
    created_at: datetime


# ---------------------------------------------------------------------------
# Connectors / channels
# ---------------------------------------------------------------------------
class ApiKeyConnectIn(BaseModel):
    type: str
    display_name: Optional[str] = None
    api_key: str
    config: dict[str, Any] = {}


class GenericRestConnectIn(BaseModel):
    display_name: Optional[str] = None
    base_url: str
    api_key: Optional[str] = None
    auth_header: str = "Authorization"
    auth_scheme: str = "Bearer"


class ConnectorOut(BaseModel):
    id: str
    type: str
    display_name: Optional[str] = None
    status: str
    last_sync_at: Optional[datetime] = None
    last_error: Optional[str] = None
    config: dict[str, Any] = {}


class ChannelIn(BaseModel):
    type: Literal["whatsapp", "telegram"]
    is_active: bool = False
    # whatsapp
    phone_number: Optional[str] = None
    # telegram
    bot_token: Optional[str] = None


# ---------------------------------------------------------------------------
# Billing
# ---------------------------------------------------------------------------
class CheckoutIn(BaseModel):
    plan: Literal["pro", "business"] = "pro"


class CheckoutOut(BaseModel):
    url: str


# ---------------------------------------------------------------------------
# Generic
# ---------------------------------------------------------------------------
class OkResponse(BaseModel):
    ok: bool = True
    detail: Optional[str] = None
