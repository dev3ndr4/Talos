import asyncio
from unittest.mock import patch

import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from mongomock_motor import AsyncMongoMockClient

from app.core.database import init_beanie_db
from app.domains.auth.models import User
from app.domains.chat.models import ChatSession, Message

# Mock DB setup
mock_client = AsyncMongoMockClient()
mock_db_instance = mock_client.talos_test_db

# Patch core database module to use mock
# This ensures raw motor calls in things like health checks use the mock
patchers = [
    patch("app.core.database.client", mock_client),
    patch("app.core.database.db", mock_db_instance),
]

for p in patchers:
    p.start()

from app.main import app  # noqa: E402


@pytest_asyncio.fixture(scope="session", autouse=True)
async def initialize_beanie():
    """Initialize Beanie once for the test session."""
    await init_beanie_db([User, ChatSession, Message])


@pytest_asyncio.fixture(scope="session")
def event_loop():
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture
async def mock_db():
    return mock_db_instance


@pytest_asyncio.fixture
async def client():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac


@pytest_asyncio.fixture(autouse=True)
async def clean_db():
    collections = await mock_db_instance.list_collection_names()
    for col in collections:
        if col != "system.indexes":
            await mock_db_instance[col].delete_many({})
    yield
