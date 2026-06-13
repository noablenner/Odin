"""Retrieval: embed a query and pull the most similar memory chunks."""
from __future__ import annotations

from typing import Any

from app.db import queries
from app.ingestion.embedder import embed_text
from app.utils.logger import get_logger

log = get_logger(__name__)


async def retrieve(
    user_id: str, query: str, top_k: int = 6, threshold: float = 0.15
) -> list[dict[str, Any]]:
    """Return the top-k memory chunks for a query, each with a similarity score."""
    if not query.strip():
        return []
    try:
        embedding = await embed_text(query)
    except Exception:
        log.exception("Embedding query failed; returning no RAG context")
        return []

    matches = queries.match_chunks(user_id, embedding, match_count=top_k, threshold=threshold)
    return matches


def format_context(matches: list[dict[str, Any]]) -> str:
    """Render retrieved chunks as a context block for the system prompt."""
    if not matches:
        return ""
    blocks = []
    for i, m in enumerate(matches, start=1):
        meta = m.get("metadata") or {}
        title = meta.get("title") or "memory"
        blocks.append(f"[{i}] (source: {title})\n{m['content']}")
    return "\n\n".join(blocks)
