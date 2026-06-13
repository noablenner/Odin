"""Memory API — upload docs, add URLs/notes, list/search/delete items."""
from __future__ import annotations

from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, HTTPException, UploadFile

from app.api.deps import get_current_user
from app.db import queries
from app.ingestion import processor
from app.ingestion.scraper import scrape_url
from app.models.schemas import AuthUser, KnowledgeItemOut, NoteIn, OkResponse, UrlIn
from app.utils.logger import get_logger

log = get_logger(__name__)
router = APIRouter(prefix="/api/memory", tags=["memory"])


async def _ingest_background(item: dict, content: str) -> None:
    try:
        await processor.ingest_item(item, content)
    except Exception:
        log.exception("Background ingestion failed for %s", item.get("id"))


@router.get("/stats")
async def stats(user: AuthUser = Depends(get_current_user)):
    return queries.memory_stats(user.id)


@router.get("/items", response_model=list[KnowledgeItemOut])
async def list_items(
    search: str | None = None, user: AuthUser = Depends(get_current_user)
):
    return queries.list_knowledge_items(user.id, search)


@router.post("/upload", response_model=KnowledgeItemOut)
async def upload_document(
    background: BackgroundTasks,
    file: UploadFile = File(...),
    tags: str = Form(default=""),
    user: AuthUser = Depends(get_current_user),
):
    data = await file.read()
    try:
        content = processor.extract_text(file.filename, data, file.content_type)
    except ValueError as exc:
        raise HTTPException(422, str(exc))

    item = queries.create_knowledge_item(
        {
            "user_id": user.id,
            "type": "doc",
            "title": file.filename,
            "mime_type": file.content_type,
            "byte_size": len(data),
            "content_raw": content[:200_000],
            "tags": [t.strip() for t in tags.split(",") if t.strip()],
            "status": "pending",
        }
    )
    background.add_task(_ingest_background, item, content)
    return item


@router.post("/url", response_model=KnowledgeItemOut)
async def add_url(
    body: UrlIn,
    background: BackgroundTasks,
    user: AuthUser = Depends(get_current_user),
):
    try:
        title, content = await scrape_url(body.url)
    except Exception as exc:
        raise HTTPException(422, f"Could not scrape URL: {exc}")

    item = queries.create_knowledge_item(
        {
            "user_id": user.id,
            "type": "url",
            "title": body.title or title,
            "source_url": body.url,
            "byte_size": len(content.encode()),
            "content_raw": content[:200_000],
            "tags": body.tags,
            "status": "pending",
        }
    )
    background.add_task(_ingest_background, item, content)
    return item


@router.post("/note", response_model=KnowledgeItemOut)
async def add_note(
    body: NoteIn,
    background: BackgroundTasks,
    user: AuthUser = Depends(get_current_user),
):
    item = queries.create_knowledge_item(
        {
            "user_id": user.id,
            "type": "note",
            "title": body.title,
            "byte_size": len(body.content.encode()),
            "content_raw": body.content,
            "tags": body.tags,
            "status": "pending",
        }
    )
    background.add_task(_ingest_background, item, body.content)
    return item


@router.delete("/items/{item_id}", response_model=OkResponse)
async def delete_item(item_id: str, user: AuthUser = Depends(get_current_user)):
    item = queries.get_knowledge_item(user.id, item_id)
    if not item:
        raise HTTPException(404, "Item not found")
    queries.delete_knowledge_item(user.id, item_id)  # cascades to chunks
    return OkResponse(detail="deleted")
