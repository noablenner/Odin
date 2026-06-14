"""Chat API — SSE streaming + conversation history."""

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse

from app.agent.streaming import chat_event_stream
from app.api.deps import get_current_user
from app.db import queries
from app.models.schemas import AuthUser, ChatRequest, ConversationOut, MessageOut
from app.utils.rate_limiter import limiter

router = APIRouter(prefix="/api/chat", tags=["chat"])


@router.post("")
@limiter.limit("60/minute")
async def chat(
    request: Request,
    body: ChatRequest,
    user: AuthUser = Depends(get_current_user),
):
    """Stream the agent's response over SSE."""
    if body.conversation_id:
        conversation = queries.get_conversation(user.id, body.conversation_id)
        if not conversation:
            raise HTTPException(404, "Conversation not found")
    else:
        conversation = queries.get_or_create_conversation(user.id, channel="web")

    return StreamingResponse(
        chat_event_stream(user, body.message, conversation),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
            "X-Conversation-Id": conversation["id"],
        },
    )


@router.get("/conversations", response_model=list[ConversationOut])
async def list_conversations(user: AuthUser = Depends(get_current_user)):
    return queries.list_conversations(user.id)


@router.get("/conversations/{conversation_id}/messages", response_model=list[MessageOut])
async def conversation_messages(
    conversation_id: str, user: AuthUser = Depends(get_current_user)
):
    conv = queries.get_conversation(user.id, conversation_id)
    if not conv:
        raise HTTPException(404, "Conversation not found")
    return queries.list_messages(conversation_id)


@router.post("/conversations", response_model=ConversationOut)
async def new_conversation(user: AuthUser = Depends(get_current_user)):
    return queries.get_or_create_conversation(user.id, channel="web", external_id=None)
