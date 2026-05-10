from typing import Annotated

from fastapi import APIRouter, Depends

from app.domains.auth.router import get_current_user
from app.domains.chat import service
from app.domains.chat.schemas import ChatSessionCreate, ChatSessionResponse, MessageResponse

router = APIRouter()


@router.post("/sessions", response_model=ChatSessionResponse)
async def create_session(session_in: ChatSessionCreate, current_user: Annotated[dict, Depends(get_current_user)]):
    return await service.create_chat_session(current_user["id"], session_in)


@router.get("/sessions", response_model=list[ChatSessionResponse])
async def list_sessions(current_user: Annotated[dict, Depends(get_current_user)]):
    return await service.get_chat_sessions(current_user["id"])


@router.get("/sessions/{session_id}/messages", response_model=list[MessageResponse])
async def list_messages(session_id: str, current_user: Annotated[dict, Depends(get_current_user)]):
    return await service.get_messages(session_id, limit=100)


@router.post("/sessions/{session_id}/messages")
async def send_message(
    session_id: str,
    payload: dict,
    current_user: Annotated[dict, Depends(get_current_user)],
):
    content = payload.get("content")
    agent_type = payload.get("agent_type", "coding")
    return await service.process_message_consolidated(current_user["id"], session_id, content, agent_type)
