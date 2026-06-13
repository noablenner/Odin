"""Assemble the system prompt for each agent request.

Order (per spec):
  1. Company profile
  2. Agent personality + custom instructions
  3. Active connectors summary
  4. RAG retrieval (top-k chunks)
  5. Last 10 messages (handled by core as message history)
  6. Current date/time + user timezone
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

CONNECTOR_LABELS = {
    "airtable": "Airtable (records across bases/tables)",
    "qonto": "Qonto (bank transactions, balances, invoices)",
    "google_drive": "Google Drive (files, documents)",
    "google_sheets": "Google Sheets (spreadsheet data)",
    "outlook": "Microsoft Outlook (emails, calendar)",
    "excel_online": "Excel Online (spreadsheet data)",
    "webhook": "Inbound webhook data",
    "rest": "Generic REST API",
}


def build_system_prompt(
    profile: dict[str, Any] | None,
    connectors: list[dict[str, Any]],
    rag_context: str,
    user_timezone: str = "UTC",
) -> str:
    profile = profile or {}

    # Advanced override: if a custom system prompt is set, it leads.
    custom_system = (profile.get("custom_system_prompt") or "").strip()

    agent_name = profile.get("agent_name") or "Odin"
    parts: list[str] = []

    if custom_system:
        parts.append(custom_system)
    else:
        parts.append(
            f"You are {agent_name}, a persistent AI business assistant. You help "
            "the business owner by answering questions and taking actions across "
            "their connected tools and stored company knowledge. Be precise, "
            "concise, and proactive. When you use stored memory or connector data, "
            "cite what you used. If you are unsure or lack data, say so plainly "
            "rather than guessing."
        )

    # 1. Company profile
    company_bits = []
    if profile.get("company_name"):
        company_bits.append(f"Company: {profile['company_name']}")
    if profile.get("activity_description"):
        company_bits.append(f"Activity: {profile['activity_description']}")
    if company_bits:
        parts.append("## Company profile\n" + "\n".join(company_bits))

    # 2. Personality + custom instructions
    if profile.get("agent_personality"):
        parts.append("## Personality\n" + profile["agent_personality"])
    if profile.get("custom_instructions"):
        parts.append("## Instructions\n" + profile["custom_instructions"])

    # Response language preference
    lang = profile.get("response_language")
    if lang and lang != "auto":
        parts.append(f"Always respond in: {lang}.")

    # 3. Active connectors summary
    connected = [c for c in connectors if c.get("status") == "connected"]
    if connected:
        lines = [
            f"- {CONNECTOR_LABELS.get(c['type'], c['type'])}" for c in connected
        ]
        parts.append(
            "## Connected data sources\n"
            "You can call tools to read from these:\n" + "\n".join(lines)
        )
    else:
        parts.append(
            "## Connected data sources\nNo external connectors are connected yet. "
            "You can still use the company's stored memory via query_memory."
        )

    # 4. RAG context
    if rag_context:
        parts.append(
            "## Relevant company memory (retrieved for this query)\n"
            "Use these excerpts when relevant and cite them by their [number].\n"
            + rag_context
        )

    # 6. Date/time + timezone
    now = datetime.now(timezone.utc)
    parts.append(
        f"## Context\nCurrent UTC time: {now.strftime('%Y-%m-%d %H:%M UTC')}. "
        f"User timezone: {user_timezone}."
    )

    return "\n\n".join(parts)
