"""URL scraping → clean text extraction."""
from __future__ import annotations

import httpx
from bs4 import BeautifulSoup

from app.utils.logger import get_logger

log = get_logger(__name__)

_HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; OdinBot/1.0; +https://odin.app/bot)"
}


async def scrape_url(url: str) -> tuple[str, str]:
    """Fetch a URL and return (title, clean_text)."""
    async with httpx.AsyncClient(
        timeout=30, follow_redirects=True, headers=_HEADERS
    ) as client:
        resp = await client.get(url)
        resp.raise_for_status()
        html = resp.text

    soup = BeautifulSoup(html, "html.parser")

    for tag in soup(["script", "style", "noscript", "header", "footer", "nav", "svg"]):
        tag.decompose()

    title = (soup.title.string.strip() if soup.title and soup.title.string else url)

    # Prefer main/article content if present.
    main = soup.find("main") or soup.find("article") or soup.body or soup
    text = main.get_text(separator="\n")

    lines = [ln.strip() for ln in text.splitlines()]
    clean = "\n".join(ln for ln in lines if ln)
    return title, clean
