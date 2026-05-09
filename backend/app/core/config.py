from pydantic_settings import BaseSettings
import os

class Settings(BaseSettings):
    PROJECT_NAME: str = "Talos"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-super-secret-key-change-it")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 1 week

    MONGODB_URL: str = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    DATABASE_NAME: str = "talos_db"

    class Config:
        case_sensitive = True

settings = Settings()
