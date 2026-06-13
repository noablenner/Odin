"""SSE formatting helpers for the web chat stream."""
from __future__ import annotations

import json
from typing import Any, AsyncGenerator

from app.agent.core import run_agent
from app.models.schemas import AuthUser


def sse(event: dict[str, Any]) -> str:
    """Serialise an event as a Server-Sent Event frame."""
    return f"data: {json.dumps(event, default=str)}\n\n"


async def chat_event_stream(
    user: AuthUser, message: str, conversation: dict[str, Any]
) -> AsyncGenerator[str, None]:
    """Yield SSE frames for the agent run, finishing with a [DONE] sentinel."""
    try:
        async for event in run_agent(user, message, conversation):
            yield sse(event)
    except Exception as exc:  # pragma: no cover - surface errors to the client
        yield sse({"type": "error", "error": str(exc)})
    yield "data: [DONE]\n\n"
