from datetime import datetime

from beanie import Document, Indexed
from pydantic import Field


class User(Document):
    email: Indexed(str, unique=True)
    hashed_password: str
    user_summary: str = "User is a new visitor to Talos."
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "users"
