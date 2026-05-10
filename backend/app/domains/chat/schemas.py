from datetime import datetime

from pydantic import BaseModel

from app.domains.auth.schemas import UserResponse


class MessageBase(BaseModel):
    role: str  # "user" or "assistant"
    content: str
    reasoning_trace: str | None = None


class MessageCreate(BaseModel):
    content: str


class MessageResponse(MessageBase):
    id: str
    created_at: datetime


class ChatSessionBase(BaseModel):
    title: str


class ChatSessionCreate(ChatSessionBase):
    pass


class ChatSessionResponse(ChatSessionBase):
    id: str
    user_id: str
    chat_summary: str = ""
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ConsolidatedMessageResponse(BaseModel):
    message: MessageResponse
    session: ChatSessionResponse
    user: UserResponse
    error: str | None = None
