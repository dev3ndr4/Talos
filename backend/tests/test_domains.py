import pytest


@pytest.mark.asyncio
async def test_coding_status(client):
    response = await client.get("/api/coding/")
    assert response.status_code == 200
    assert response.json()["status"] == "Coding Agent is active"


@pytest.mark.asyncio
async def test_comms_status(client):
    response = await client.get("/api/comms/")
    assert response.status_code == 200
    assert response.json()["status"] == "Comms Agent is active"


@pytest.mark.asyncio
async def test_knowledge_status(client):
    response = await client.get("/api/knowledge/")
    assert response.status_code == 200
    assert response.json()["status"] == "Knowledge Brain is active"
