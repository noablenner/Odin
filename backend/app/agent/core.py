"""The agent loop — identical across web, WhatsApp and Telegram, and across
LLM providers (Anthropic Claude or OpenAI GPT, chosen per-user).

`run_agent` is an async generator yielding events:
  {"type": "text", "text": ...}        incremental assistant text
  {"type": "tool", "tool": ...}        a tool was invoked (for UI/citations)
  {"type": "done", "message_id": ..., "sources": [...], "content": ...}

It also persists the user message and the final assistant message, and tracks
token usage.
"""
from __future__ import annotations

import json
import unicodedata
from typing import Any, AsyncGenerator

from anthropic import AsyncAnthropic
from openai import AsyncOpenAI

from app.agent import rag, tools as agent_tools
from app.agent.prompt_builder import build_system_prompt
from app.config import settings
from app.db import queries
from app.models.schemas import AuthUser
from app.utils.logger import get_logger

log = get_logger(__name__)

MAX_TOOL_ITERATIONS = 6

ANTHROPIC_MODELS = {"claude-sonnet-4-6", "claude-opus-4-8", "claude-fable-5"}
OPENAI_MODELS = {"gpt-4o", "gpt-4o-mini", "gpt-4.1"}
VALID_MODELS = ANTHROPIC_MODELS | OPENAI_MODELS

# Automatic model routing (100% OpenAI). Simple/short requests go to the cheap
# model; complex ones (long, code, reasoning, multi-document RAG) are escalated.
AUTO_SIMPLE_MODEL = "gpt-4o-mini"
AUTO_COMPLEX_MODEL = "gpt-4o"

_COMPLEX_KEYWORDS = (
    "analyse", "analyser", "compare", "comparer", "strateg", "strateg",
    "explique", "expliquer", "pourquoi", "redige", "rediger",
    "code", "coder", "debug", "debog", "corrige", "function",
    "fonction", "script", "calcule", "calculer", "resous", "resoudre",
    "resoudre", "plan", "traduis", "traduire", "rapport",
    "resume", "synthese", "ecris", "rediges",
    "write", "draft", "summarize", "translate", "reasoning", "step by step",
    "etape par etape", "algorithm", "algorithme",
)


# Words that signal the request will touch a connected tool / live data, where
# reliable multi-step tool use matters; escalate those to the stronger model.
_TOOL_KEYWORDS = (
    "airtable", "base", "table", "tableau", "enregistrement", "record",
    "prospect", "client", "contact", "lead", "deal", "crm", "email", "mail",
    "qonto", "transaction", "solde", "facture", "invoice", "compte",
    "drive", "fichier", "document", "sheet", "spreadsheet", "feuille",
    "outlook", "calendrier", "calendar", "agenda", "rendez", "connecteur",
)


def _auto_select_model(
    message: str, match_count: int = 0, has_connectors: bool = False
) -> str:
    """Heuristic, per-message model selection - no extra API call, no latency.

    Returns AUTO_COMPLEX_MODEL for requests that look demanding, otherwise the
    cheaper AUTO_SIMPLE_MODEL. Tuned to keep ~90% of casual chat on the cheap
    model while escalating anything that benefits from a stronger model.
    """
    text = (message or "").strip()
    # Lowercase and strip accents so ASCII keywords match accented French input.
    lowered = "".join(
        c for c in unicodedata.normalize("NFD", text.lower())
        if unicodedata.category(c) != "Mn"
    )
    if "```" in text or len(text) > 320 or len(text.split()) > 60:
        return AUTO_COMPLEX_MODEL
    if match_count >= 3:
        return AUTO_COMPLEX_MODEL
    if text.count("?") >= 3:
        return AUTO_COMPLEX_MODEL
    if any(kw in lowered for kw in _COMPLEX_KEYWORDS):
        return AUTO_COMPLEX_MODEL
    # When tools are connected, route data-ish requests to the stronger model so
    # multi-step tool calls (discover base -> read records) stay reliable.
    if has_connectors and any(kw in lowered for kw in _TOOL_KEYWORDS):
        return AUTO_COMPLEX_MODEL
    return AUTO_SIMPLE_MODEL


def _resolve_model(
    message: str, match_count: int = 0, has_connectors: bool = False
) -> str:
    """Always auto-route. The manual model picker has been removed from the UI."""
    return _auto_select_model(message, match_count, has_connectors)


def _provider_for(model: str) -> str:
    return "openai" if model in OPENAI_MODELS else "anthropic"


def _history_to_messages(rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Convert stored messages to a shared user/assistant message list."""
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

    # Automatic per-message model selection (depends on RAG match count).
    has_connectors = any(c.get("status") == "connected" for c in connectors)
    model = _resolve_model(message, len(matches), has_connectors)
    provider = _provider_for(model)
    system_prompt = build_system_prompt(profile, connectors, rag_context, user.timezone)

    # Conversation history (last ~10) as a shared message list.
    history = queries.recent_messages(conversation_id, limit=12)
    messages = _history_to_messages(history)
    if not messages or messages[-1]["content"] != message:
        messages.append({"role": "user", "content": message})

    # Shared accumulators filled by the provider loop.
    out: dict[str, Any] = {"content_parts": [], "tokens_in": 0, "tokens_out": 0}
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

    if provider == "openai":
        loop = _openai_loop(model, system_prompt, messages, connectors, user_id, out, sources)
    else:
        loop = _anthropic_loop(model, system_prompt, messages, connectors, user_id, out, sources)

    async for event in loop:
        yield event

    final_content = "".join(out["content_parts"]).strip() or "(no response)"

    stored = queries.add_message(
        {
            "conversation_id": conversation_id,
            "user_id": user_id,
            "role": "assistant",
            "content": final_content,
            "tokens_in": out["tokens_in"],
            "tokens_out": out["tokens_out"],
            "model": model,
            "sources_used": sources,
        }
    )
    queries.touch_conversation(conversation_id, title=conversation.get("title") or message[:60])

    yield {
        "type": "done",
        "message_id": stored["id"],
        "content": final_content,
        "sources": sources,
        "tokens_in": out["tokens_in"],
        "tokens_out": out["tokens_out"],
    }


# ---------------------------------------------------------------------------
# Anthropic (Claude) provider loop
# ---------------------------------------------------------------------------
async def _anthropic_loop(
    model: str,
    system_prompt: str,
    messages: list[dict[str, Any]],
    connectors: list[dict[str, Any]],
    user_id: str,
    out: dict[str, Any],
    sources: list[dict[str, Any]],
) -> AsyncGenerator[dict[str, Any], None]:
    client = AsyncAnthropic(api_key=settings.anthropic_api_key)
    tool_defs = agent_tools.build_tools(connectors)
    convo = list(messages)

    for _ in range(MAX_TOOL_ITERATIONS):
        assistant_blocks: list[dict[str, Any]] = []
        current_text = ""
        tool_uses: list[dict[str, Any]] = []

        async with client.messages.stream(
            model=model,
            max_tokens=2048,
            system=system_prompt,
            messages=convo,
            tools=tool_defs,
        ) as stream:
            async for event in stream:
                if event.type == "content_block_delta" and event.delta.type == "text_delta":
                    current_text += event.delta.text
                    yield {"type": "text", "text": event.delta.text}
            final = await stream.get_final_message()

        usage = getattr(final, "usage", None)
        if usage:
            out["tokens_in"] += usage.input_tokens or 0
            out["tokens_out"] += usage.output_tokens or 0

        for block in final.content:
            if block.type == "text":
                assistant_blocks.append({"type": "text", "text": block.text})
            elif block.type == "tool_use":
                tool_uses.append({"id": block.id, "name": block.name, "input": block.input})
                assistant_blocks.append(
                    {"type": "tool_use", "id": block.id, "name": block.name, "input": block.input}
                )

        if current_text:
            out["content_parts"].append(current_text)

        if final.stop_reason != "tool_use" or not tool_uses:
            break

        convo.append({"role": "assistant", "content": assistant_blocks})
        tool_results = []
        for tu in tool_uses:
            yield {"type": "tool", "tool": tu["name"], "input": tu["input"]}
            result_text, citation = await agent_tools.execute_tool(user_id, tu["name"], tu["input"])
            sources.append(citation)
            tool_results.append(
                {"type": "tool_result", "tool_use_id": tu["id"], "content": result_text}
            )
        convo.append({"role": "user", "content": tool_results})


# ---------------------------------------------------------------------------
# OpenAI (GPT) provider loop
# ---------------------------------------------------------------------------
async def _openai_loop(
    model: str,
    system_prompt: str,
    messages: list[dict[str, Any]],
    connectors: list[dict[str, Any]],
    user_id: str,
    out: dict[str, Any],
    sources: list[dict[str, Any]],
) -> AsyncGenerator[dict[str, Any], None]:
    client = AsyncOpenAI(api_key=settings.openai_api_key)
    tool_defs = agent_tools.build_openai_tools(connectors)
    convo: list[dict[str, Any]] = [{"role": "system", "content": system_prompt}, *messages]

    for _ in range(MAX_TOOL_ITERATIONS):
        stream = await client.chat.completions.create(
            model=model,
            messages=convo,
            tools=tool_defs or None,
            stream=True,
            stream_options={"include_usage": True},
        )

        text_buf = ""
        # index -> accumulated tool call {id, name, arguments}
        tool_acc: dict[int, dict[str, str]] = {}

        async for chunk in stream:
            if getattr(chunk, "usage", None):
                out["tokens_in"] += chunk.usage.prompt_tokens or 0
                out["tokens_out"] += chunk.usage.completion_tokens or 0
            if not chunk.choices:
                continue
            delta = chunk.choices[0].delta
            if delta and delta.content:
                text_buf += delta.content
                yield {"type": "text", "text": delta.content}
            if delta and delta.tool_calls:
                for tc in delta.tool_calls:
                    acc = tool_acc.setdefault(tc.index, {"id": "", "name": "", "arguments": ""})
                    if tc.id:
                        acc["id"] = tc.id
                    if tc.function and tc.function.name:
                        acc["name"] = tc.function.name
                    if tc.function and tc.function.arguments:
                        acc["arguments"] += tc.function.arguments

        if text_buf:
            out["content_parts"].append(text_buf)

        if not tool_acc:
            break

        calls = list(tool_acc.values())
        convo.append(
            {
                "role": "assistant",
                "content": text_buf or None,
                "tool_calls": [
                    {
                        "id": c["id"],
                        "type": "function",
                        "function": {"name": c["name"], "arguments": c["arguments"] or "{}"},
                    }
                    for c in calls
                ],
            }
        )
        for c in calls:
            try:
                args = json.loads(c["arguments"] or "{}")
            except json.JSONDecodeError:
                args = {}
            yield {"type": "tool", "tool": c["name"], "input": args}
            result_text, citation = await agent_tools.execute_tool(user_id, c["name"], args)
            sources.append(citation)
            convo.append(
                {"role": "tool", "tool_call_id": c["id"], "content": result_text}
            )


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
