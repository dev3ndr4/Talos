import asyncio
from unittest.mock import patch

import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from mongomock_motor import AsyncMongoMockClient

from app.main import app

# Mock DB before importing app to avoid early reference capture
mock_client = AsyncMongoMockClient()
mock_db_instance = mock_client.talos_test_db

# Aggressive patching
patchers = [
    patch("app.core.database.client", mock_client),
    patch("app.core.database.db", mock_db_instance),
    patch("app.domains.auth.service.db", mock_db_instance),
    patch("app.domains.chat.service.db", mock_db_instance),
]

for p in patchers:
    p.start()


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
        await mock_db_instance[col].delete_many({})
    yield
