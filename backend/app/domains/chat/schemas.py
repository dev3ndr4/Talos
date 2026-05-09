from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class MessageBase(BaseModel):
    role: str # "user" or "assistant"
    content: str
    reasoning_trace: Optional[str] = None

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
