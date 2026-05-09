from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from app.domains.auth.router import get_current_user
from app.domains.chat.schemas import ChatSessionCreate, ChatSessionResponse, MessageCreate, MessageResponse
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

@router.post("/sessions/{session_id}/messages", response_model=MessageResponse)
async def send_message(
    session_id: str,
    message_in: MessageCreate,
    current_user: Annotated[dict, Depends(get_current_user)],
    background_tasks: BackgroundTasks
):
    # 1. Get the session
    session = await db.chat_sessions.find_one({"_id": ObjectId(session_id), "user_id": current_user["id"]})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # 2. Add user message to history
    await service.add_message(session_id, "user", message_in.content)
    
    # 3. Get history for context
    history = await service.get_messages(session_id, limit=5)
    
    # 4. Call LLM
    content, reasoning_trace = await service.call_llm(
        current_user.get("user_summary", ""),
        session.get("chat_summary", ""),
        history[:-1], # Don't include the message we just added as it's passed separately in service
        message_in.content
    )
    
    # 5. Add assistant message to history
    assistant_msg = await service.add_message(session_id, "assistant", content, reasoning_trace)
    
    # 6. Trigger background summarization
    background_tasks.add_task(service.update_summaries, current_user["id"], session_id)
    
    return assistant_msg
