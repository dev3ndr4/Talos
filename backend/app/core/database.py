import os

from beanie import init_beanie
from pymongo import AsyncMongoClient

MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
client = AsyncMongoClient(MONGODB_URL)
db = client.talos_db


async def init_beanie_db(models: list):
    """Initialize Beanie with the given models."""
    await init_beanie(database=db, document_models=models)
