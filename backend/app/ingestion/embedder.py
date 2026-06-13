"""Embedding provider abstraction (OpenAI / Voyage)."""
from __future__ import annotations

from typing import Sequence

import httpx
from tenacity import retry, stop_after_attempt, wait_exponential

from app.config import settings
from app.utils.logger import get_logger

log = get_logger(__name__)


@retry(stop=stop_after_attempt(3), wait=wait_exponential(min=1, max=8))
async def _openai_embed(texts: Sequence[str]) -> list[list[float]]:
    async with httpx.AsyncClient(timeout=60) as client:
        resp = await client.post(
            "https://api.openai.com/v1/embeddings",
            headers={"Authorization": f"Bearer {settings.openai_api_key}"},
            json={"model": settings.embedding_model, "input": list(texts)},
        )
        resp.raise_for_status()
        data = resp.json()["data"]
        return [d["embedding"] for d in sorted(data, key=lambda x: x["index"])]


@retry(stop=stop_after_attempt(3), wait=wait_exponential(min=1, max=8))
async def _voyage_embed(texts: Sequence[str]) -> list[list[float]]:
    async with httpx.AsyncClient(timeout=60) as client:
        resp = await client.post(
            "https://api.voyageai.com/v1/embeddings",
            headers={"Authorization": f"Bearer {settings.voyage_api_key}"},
            json={"model": settings.embedding_model, "input": list(texts)},
        )
        resp.raise_for_status()
        data = resp.json()["data"]
        return [d["embedding"] for d in sorted(data, key=lambda x: x["index"])]


async def embed_texts(texts: Sequence[str]) -> list[list[float]]:
    """Embed a batch of texts. Returns one vector per input."""
    if not texts:
        return []
    if settings.embedding_provider == "voyage":
        return await _voyage_embed(texts)
    return await _openai_embed(texts)


async def embed_text(text: str) -> list[float]:
    vecs = await embed_texts([text])
    return vecs[0]
