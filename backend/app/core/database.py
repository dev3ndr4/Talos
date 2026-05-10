import os

from beanie import init_beanie
from motor.motor_asyncio import AsyncIOMotorClient

MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
client = AsyncIOMotorClient(MONGODB_URL)
db = client.talos_db


async def init_beanie_db(models: list):
    """Initialize Beanie with the given models."""
    await init_beanie(database=db, document_models=models)
