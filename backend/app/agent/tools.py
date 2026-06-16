"""Claude tool (function-calling) definitions + dispatch to connectors/RAG.

`build_tools(connectors)` returns only the tools whose backing connector is
connected (query_memory is always available). `execute_tool` runs a tool call
and returns a JSON-serialisable result plus a citation descriptor.
"""
from __future__ import annotations

import json
from typing import Any

import httpx

from app.agent import rag
from app.connectors import airtable, generic, google_drive, outlook, qonto, sheets
from app.connectors.base import ConnectorError, load_credentials, save_credentials
from app.utils.logger import get_logger

log = get_logger(__name__)

# ---------------------------------------------------------------------------
# Tool schemas (Anthropic tool-use format)
# ---------------------------------------------------------------------------
ALL_TOOLS: dict[str, dict[str, Any]] = {
    "query_memory": {
        "name": "query_memory",
        "description": "Semantic search over the company's stored memory "
        "(documents, URLs, notes). Use this whenever the answer might be in "
        "uploaded knowledge.",
        "input_schema": {
            "type": "object",
            "properties": {
                "semantic_query": {
                    "type": "string",
                    "description": "Natural-language query to search memory.",
                }
            },
            "required": ["semantic_query"],
        },
    },
    "list_airtable_bases": {
        "name": "list_airtable_bases",
        "description": "List the user's Airtable bases and the tables inside each, with their IDs and names. ALWAYS call this first to find the correct base ID and exact table name before reading or writing Airtable records.",
        "input_schema": {"type": "object", "properties": {}},
    },
    "get_airtable_records": {
        "name": "get_airtable_records",
        "description": "Read records from an Airtable table. If you do not already know the base ID and exact table name, call list_airtable_bases first.",
        "input_schema": {
            "type": "object",
            "properties": {
                "base": {"type": "string", "description": "Airtable base ID."},
                "table": {"type": "string", "description": "Table name or ID."},
                "filter": {
                    "type": "string",
                    "description": "Optional Airtable filterByFormula expression.",
                },
            },
            "required": ["base", "table"],
        },
    },
    "write_airtable_record": {
        "name": "write_airtable_record",
        "description": "Create a new record in an Airtable table.",
        "input_schema": {
            "type": "object",
            "properties": {
                "base": {"type": "string"},
                "table": {"type": "string"},
                "fields": {
                    "type": "object",
                    "description": "Field name → value map for the new record.",
                },
            },
            "required": ["base", "table", "fields"],
        },
    },
    "get_qonto_transactions": {
        "name": "get_qonto_transactions",
        "description": "List Qonto bank transactions in a date range (ISO 8601).",
        "input_schema": {
            "type": "object",
            "properties": {
                "date_from": {"type": "string"},
                "date_to": {"type": "string"},
            },
        },
    },
    "get_qonto_balance": {
        "name": "get_qonto_balance",
        "description": "Get current balances across Qonto bank accounts.",
        "input_schema": {"type": "object", "properties": {}},
    },
    "search_emails": {
        "name": "search_emails",
        "description": "Search the user's Outlook mailbox.",
        "input_schema": {
            "type": "object",
            "properties": {
                "query": {"type": "string"},
                "date_range": {
                    "type": "string",
                    "description": "Optional human description of the date range.",
                },
            },
        },
    },
    "get_calendar_events": {
        "name": "get_calendar_events",
        "description": "List Outlook calendar events between two ISO datetimes.",
        "input_schema": {
            "type": "object",
            "properties": {
                "date_from": {"type": "string"},
                "date_to": {"type": "string"},
            },
            "required": ["date_from", "date_to"],
        },
    },
    "get_drive_file": {
        "name": "get_drive_file",
        "description": "Search Google Drive and return the best-matching file's text.",
        "input_schema": {
            "type": "object",
            "properties": {"query": {"type": "string"}},
            "required": ["query"],
        },
    },
    "read_sheet": {
        "name": "read_sheet",
        "description": "Read a range from a Google Sheet.",
        "input_schema": {
            "type": "object",
            "properties": {
                "sheet_id": {"type": "string"},
                "range": {"type": "string", "description": "e.g. 'Sheet1!A1:D20'"},
            },
            "required": ["sheet_id", "range"],
        },
    },
    "write_sheet": {
        "name": "write_sheet",
        "description": "Write a 2D array of values to a Google Sheet range.",
        "input_schema": {
            "type": "object",
            "properties": {
                "sheet_id": {"type": "string"},
                "range": {"type": "string"},
                "data": {
                    "type": "array",
                    "items": {"type": "array", "items": {}},
                    "description": "2D array of cell values.",
                },
            },
            "required": ["sheet_id", "range", "data"],
        },
    },
}

# Which connector type backs each tool (query_memory has none — always on).
TOOL_CONNECTOR = {
    "list_airtable_bases": "airtable",
    "get_airtable_records": "airtable",
    "write_airtable_record": "airtable",
    "get_qonto_transactions": "qonto",
    "get_qonto_balance": "qonto",
    "search_emails": "outlook",
    "get_calendar_events": "outlook",
    "get_drive_file": "google_drive",
    "read_sheet": "google_sheets",
    "write_sheet": "google_sheets",
}


def build_tools(connectors: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Anthropic tool-use format (name / description / input_schema)."""
    connected = {c["type"] for c in connectors if c.get("status") == "connected"}
    # google_sheets tools work off the google_drive (Google) connection too.
    if "google_drive" in connected:
        connected.add("google_sheets")
    tools = [ALL_TOOLS["query_memory"]]
    for name, schema in ALL_TOOLS.items():
        if name == "query_memory":
            continue
        if TOOL_CONNECTOR.get(name) in connected:
            tools.append(schema)
    return tools


def build_openai_tools(connectors: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Same tool set, converted to OpenAI function-calling format."""
    return [
        {
            "type": "function",
            "function": {
                "name": t["name"],
                "description": t["description"],
                "parameters": t["input_schema"],
            },
        }
        for t in build_tools(connectors)
    ]


async def execute_tool(
    user_id: str, name: str, tool_input: dict[str, Any]
) -> tuple[str, dict[str, Any]]:
    """Run a tool. Returns (result_text_for_model, citation_descriptor)."""
    try:
        result, citation = await _dispatch(user_id, name, tool_input)
    except ConnectorError as exc:
        return f"Connector error: {exc}", {"tool": name, "error": str(exc)}
    except Exception as exc:  # pragma: no cover - defensive
        log.exception("Tool %s failed", name)
        return f"Tool '{name}' failed: {exc}", {"tool": name, "error": str(exc)}

    text = result if isinstance(result, str) else json.dumps(result, default=str)[:8000]
    return text, citation


async def _dispatch(
    user_id: str, name: str, ti: dict[str, Any]
) -> tuple[Any, dict[str, Any]]:
    if name == "query_memory":
        matches = await rag.retrieve(user_id, ti["semantic_query"])
        return (
            [{"content": m["content"], "source": (m.get("metadata") or {}).get("title")} for m in matches],
            {"tool": "query_memory", "matches": len(matches),
             "sources": list({(m.get("metadata") or {}).get("title") for m in matches if m.get("metadata")})},
        )

    conn_type = TOOL_CONNECTOR[name]
    creds = load_credentials(user_id, conn_type)

    if conn_type == "airtable":
        async def _run(c: dict[str, Any]):
            if name == "list_airtable_bases":
                bases = await airtable.list_bases(c)
                out = [
                    {
                        "base_id": b["id"],
                        "base_name": b.get("name"),
                        "tables": [t.get("name") for t in await airtable.list_tables(c, b["id"])],
                    }
                    for b in bases[:10]
                ]
                return out, {"tool": name, "count": len(out), "source": "Airtable"}
            if name == "get_airtable_records":
                recs = await airtable.get_records(c, ti["base"], ti["table"], ti.get("filter"))
                return recs, {"tool": name, "count": len(recs), "source": "Airtable"}
            rec = await airtable.create_record(c, ti["base"], ti["table"], ti["fields"])
            return rec, {"tool": name, "source": "Airtable", "wrote": True}

        try:
            return await _run(creds)
        except httpx.HTTPStatusError as exc:
            if exc.response.status_code in (401, 403) and creds.get("refresh_token"):
                creds = await airtable.refresh_access_token(creds)
                save_credentials(
                    user_id,
                    "airtable",
                    {k: v for k, v in creds.items() if k != "__config__"},
                )
                return await _run(creds)
            raise

    if name == "get_qonto_transactions":
        txs = await qonto.get_transactions(creds, ti.get("date_from"), ti.get("date_to"))
        return txs, {"tool": name, "count": len(txs), "source": "Qonto"}

    if name == "get_qonto_balance":
        bal = await qonto.get_balances(creds)
        return bal, {"tool": name, "source": "Qonto"}

    if name == "search_emails":
        emails = await outlook.search_emails(creds, ti.get("query"))
        return emails, {"tool": name, "count": len(emails), "source": "Outlook"}

    if name == "get_calendar_events":
        events = await outlook.get_calendar_events(creds, ti["date_from"], ti["date_to"])
        return events, {"tool": name, "count": len(events), "source": "Outlook"}

    if name == "get_drive_file":
        files = await google_drive.search_files(creds, ti["query"], limit=1)
        if not files:
            return "No matching file found.", {"tool": name, "source": "Google Drive"}
        text = await google_drive.get_file_text(creds, files[0]["id"])
        return (
            {"file": files[0].get("name"), "text": text[:6000]},
            {"tool": name, "source": "Google Drive", "file": files[0].get("name")},
        )

    if name == "read_sheet":
        values = await sheets.read_range(creds, ti["sheet_id"], ti["range"])
        return values, {"tool": name, "source": "Google Sheets"}

    if name == "write_sheet":
        res = await sheets.write_range(creds, ti["sheet_id"], ti["range"], ti["data"])
        return res, {"tool": name, "source": "Google Sheets", "wrote": True}

    raise ConnectorError(f"Unknown tool: {name}")
