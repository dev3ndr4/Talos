from datetime import datetime

from beanie import Document
from pydantic import Field


class ChatSession(Document):
    user_id: str  # Kept as str for alignment with current usage, but can be PydanticObjectId
    title: str
    chat_summary: str = "This is a new conversation."
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "chat_sessions"
        indexes = [
            "user_id",
            [("updated_at", -1)],
        ]


class Message(Document):
    session_id: str
    role: str  # "user" or "assistant"
    content: str
    reasoning_trace: str | None = None
    email_draft: dict | None = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "messages"
        indexes = [
            "session_id",
            [("created_at", 1)],
        ]
