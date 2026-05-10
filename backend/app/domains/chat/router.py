from fastapi import APIRouter, Depends, HTTPException
from app.domains.auth.router import get_current_user
from app.domains.chat.schemas import ChatSessionCreate, ChatSessionResponse, MessageCreate, MessageResponse, ConsolidatedMessageResponse
from app.domains.chat import service
from app.core.database import db
from typing import List, Annotated
from bson import ObjectId

router = APIRouter()

@router.post("/sessions", response_model=ChatSessionResponse)
async def create_session(
    session_in: ChatSessionCreate,
    current_user: Annotated[dict, Depends(get_current_user)]
):
    return await service.create_chat_session(current_user["id"], session_in)

@router.get("/sessions", response_model=List[ChatSessionResponse])
async def list_sessions(
    current_user: Annotated[dict, Depends(get_current_user)]
):
    return await service.get_chat_sessions(current_user["id"])

@router.post("/sessions/{session_id}/messages", response_model=ConsolidatedMessageResponse)
async def send_message(
    session_id: str,
    message_in: MessageCreate,
    current_user: Annotated[dict, Depends(get_current_user)]
):
    result = await service.process_message_consolidated(current_user["id"], session_id, message_in.content)
    if not result:
        raise HTTPException(status_code=404, detail="Session or user not found")
    
    return result
