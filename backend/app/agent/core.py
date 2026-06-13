"""The agent loop — identical across web, WhatsApp and Telegram.

`run_agent` is an async generator yielding events:
  {"type": "text", "text": ...}        incremental assistant text
  {"type": "tool", "tool": ...}        a tool was invoked (for UI/citations)
  {"type": "done", "message_id": ..., "sources": [...], "content": ...}

It also persists the user message and the final assistant message, and tracks
token usage.
"""
from __future__ import annotations

from typing import Any, AsyncGenerator

from anthropic import AsyncAnthropic

from app.agent import rag, tools as agent_tools
from app.agent.prompt_builder import build_system_prompt
from app.config import settings
from app.db import queries
from app.models.schemas import AuthUser
from app.utils.logger import get_logger

log = get_logger(__name__)

MAX_TOOL_ITERATIONS = 6
VALID_MODELS = {"claude-sonnet-4-6", "claude-opus-4-8", "claude-fable-5"}


def _client() -> AsyncAnthropic:
    return AsyncAnthropic(api_key=settings.anthropic_api_key)


def _resolve_model(profile: dict[str, Any] | None) -> str:
    pref = (profile or {}).get("model_preference") or settings.default_model
    return pref if pref in VALID_MODELS else settings.default_model


def _history_to_messages(rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Convert stored messages to Anthropic message format (user/assistant only)."""
    msgs: list[dict[str, Any]] = []
    for r in rows:
        if r["role"] in ("user", "assistant") and r.get("content"):
            msgs.append({"role": r["role"], "content": r["content"]})
    return msgs


async def run_agent(
    user: AuthUser,
    message: str,
    conversation: dict[str, Any],
) -> AsyncGenerator[dict[str, Any], None]:
    user_id = user.id
    conversation_id = conversation["id"]

    profile = queries.get_profile(user_id)
    connectors = queries.list_connectors(user_id)
    model = _resolve_model(profile)

    # Persist the incoming user message.
    queries.add_message(
        {
            "conversation_id": conversation_id,
            "user_id": user_id,
            "role": "user",
            "content": message,
        }
    )

    # RAG retrieval for the system prompt (step 4).
    matches = await rag.retrieve(user_id, message)
    rag_context = rag.format_context(matches)
    system_prompt = build_system_prompt(profile, connectors, rag_context, user.timezone)

    # Conversation history (last 10) — excludes the message we just added by
    # fetching before-insert ordering; recent_messages includes it, which is fine.
    history = queries.recent_messages(conversation_id, limit=12)
    messages = _history_to_messages(history)
    if not messages or messages[-1]["content"] != message:
        messages.append({"role": "user", "content": message})

    tool_defs = agent_tools.build_tools(connectors)

    client = _client()
    total_in = 0
    total_out = 0
    final_text_parts: list[str] = []
    sources: list[dict[str, Any]] = []
    if matches:
        sources.append(
            {
                "tool": "rag",
                "matches": len(matches),
                "sources": list(
                    {(m.get("metadata") or {}).get("title") for m in matches}
                ),
            }
        )

    for _iteration in range(MAX_TOOL_ITERATIONS):
        assistant_blocks: list[dict[str, Any]] = []
        current_text = ""
        tool_uses: list[dict[str, Any]] = []

        async with client.messages.stream(
            model=model,
            max_tokens=2048,
            system=system_prompt,
            messages=messages,
            tools=tool_defs,
        ) as stream:
            async for event in stream:
                if event.type == "content_block_delta" and event.delta.type == "text_delta":
                    current_text += event.delta.text
                    yield {"type": "text", "text": event.delta.text}

            final = await stream.get_final_message()

        usage = getattr(final, "usage", None)
        if usage:
            total_in += usage.input_tokens or 0
            total_out += usage.output_tokens or 0

        # Collect content blocks for the assistant turn.
        for block in final.content:
            if block.type == "text":
                assistant_blocks.append({"type": "text", "text": block.text})
            elif block.type == "tool_use":
                tool_uses.append(
                    {"id": block.id, "name": block.name, "input": block.input}
                )
                assistant_blocks.append(
                    {
                        "type": "tool_use",
                        "id": block.id,
                        "name": block.name,
                        "input": block.input,
                    }
                )

        if current_text:
            final_text_parts.append(current_text)

        if final.stop_reason != "tool_use" or not tool_uses:
            break

        # Execute tools and feed results back.
        messages.append({"role": "assistant", "content": assistant_blocks})
        tool_results = []
        for tu in tool_uses:
            yield {"type": "tool", "tool": tu["name"], "input": tu["input"]}
            result_text, citation = await agent_tools.execute_tool(
                user_id, tu["name"], tu["input"]
            )
            sources.append(citation)
            tool_results.append(
                {
                    "type": "tool_result",
                    "tool_use_id": tu["id"],
                    "content": result_text,
                }
            )
        messages.append({"role": "user", "content": tool_results})

    final_content = "".join(final_text_parts).strip() or "(no response)"

    stored = queries.add_message(
        {
            "conversation_id": conversation_id,
            "user_id": user_id,
            "role": "assistant",
            "content": final_content,
            "tokens_in": total_in,
            "tokens_out": total_out,
            "model": model,
            "sources_used": sources,
        }
    )
    title = conversation.get("title") or message[:60]
    queries.touch_conversation(conversation_id, title=title)

    yield {
        "type": "done",
        "message_id": stored["id"],
        "content": final_content,
        "sources": sources,
        "tokens_in": total_in,
        "tokens_out": total_out,
    }


async def run_agent_collect(
    user: AuthUser, message: str, conversation: dict[str, Any]
) -> dict[str, Any]:
    """Non-streaming convenience wrapper (used by messaging channels)."""
    result: dict[str, Any] = {"content": "", "sources": []}
    async for event in run_agent(user, message, conversation):
        if event["type"] == "done":
            result = {
                "content": event["content"],
                "sources": event["sources"],
                "message_id": event["message_id"],
            }
    return result
