"""Token-aware text chunking with overlap."""
from __future__ import annotations

import re

try:
    import tiktoken

    _ENC = tiktoken.get_encoding("cl100k_base")
except Exception:  # pragma: no cover - tiktoken optional at runtime
    _ENC = None


def _count_tokens(text: str) -> int:
    if _ENC is not None:
        return len(_ENC.encode(text))
    # Rough fallback: ~4 chars per token.
    return max(1, len(text) // 4)


def _split_sentences(text: str) -> list[str]:
    # Split on paragraph and sentence boundaries while keeping content.
    parts = re.split(r"(?<=[.!?])\s+|\n{2,}", text)
    return [p.strip() for p in parts if p and p.strip()]


def chunk_text(
    text: str, max_tokens: int = 500, overlap_tokens: int = 60
) -> list[str]:
    """Greedily pack sentences into chunks up to max_tokens with overlap."""
    text = (text or "").strip()
    if not text:
        return []

    sentences = _split_sentences(text)
    chunks: list[str] = []
    current: list[str] = []
    current_tokens = 0

    for sent in sentences:
        sent_tokens = _count_tokens(sent)
        # A single oversized sentence: hard-split by characters.
        if sent_tokens > max_tokens:
            if current:
                chunks.append(" ".join(current))
                current, current_tokens = [], 0
            chunks.extend(_hard_split(sent, max_tokens))
            continue

        if current_tokens + sent_tokens > max_tokens and current:
            chunks.append(" ".join(current))
            # carry overlap from the tail of the previous chunk
            current, current_tokens = _carry_overlap(current, overlap_tokens)
        current.append(sent)
        current_tokens += sent_tokens

    if current:
        chunks.append(" ".join(current))
    return [c.strip() for c in chunks if c.strip()]


def _carry_overlap(sentences: list[str], overlap_tokens: int) -> tuple[list[str], int]:
    carried: list[str] = []
    total = 0
    for sent in reversed(sentences):
        t = _count_tokens(sent)
        if total + t > overlap_tokens:
            break
        carried.insert(0, sent)
        total += t
    return carried, total


def _hard_split(text: str, max_tokens: int) -> list[str]:
    approx_chars = max_tokens * 4
    return [text[i : i + approx_chars] for i in range(0, len(text), approx_chars)]
