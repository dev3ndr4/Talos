from unittest.mock import AsyncMock, patch

import pytest
import pytest_asyncio


@pytest_asyncio.fixture
async def authenticated_client(client):
    email = "chat_user@example.com"
    await client.post("/api/auth/register", json={"email": email, "password": "testpassword"})
    login_response = await client.post("/api/auth/login", json={"email": email, "password": "testpassword"})
    token = login_response.json()["access_token"]
    client.headers.update({"Authorization": f"Bearer {token}"})
    return client


@pytest.mark.asyncio
async def test_create_session(authenticated_client):
    response = await authenticated_client.post("/api/chat/sessions", json={"title": "Test Session"})
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Test Session"
    assert "id" in data
    assert "user_id" in data


@pytest.mark.asyncio
async def test_list_sessions(authenticated_client):
    # Create two sessions
    await authenticated_client.post("/api/chat/sessions", json={"title": "Session 1"})
    await authenticated_client.post("/api/chat/sessions", json={"title": "Session 2"})

    response = await authenticated_client.get("/api/chat/sessions")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    assert data[0]["title"] in ["Session 1", "Session 2"]


@pytest.mark.asyncio
async def test_send_message(authenticated_client):
    # Create session first
    session_response = await authenticated_client.post("/api/chat/sessions", json={"title": "Chat Session"})
    session_id = session_response.json()["id"]

    # Mock ChatAgent.process_message
    mock_llm_response = {
        "assistant_message": "Hello! I am Talos.",
        "reasoning_trace": "Testing the message flow.",
        "chat_summary_update": "The user said hello.",
        "user_profile_update": "User is friendly.",
    }

    with patch("app.domains.chat.service.chat_agent.process_message", new_callable=AsyncMock) as mock_process:
        mock_process.return_value = mock_llm_response

        response = await authenticated_client.post(f"/api/chat/sessions/{session_id}/messages", json={"content": "Hi", "agent_type": "coding"})

        assert response.status_code == 200
        data = response.json()
        assert data["message"]["content"] == "Hello! I am Talos."
        assert data["message"]["role"] == "assistant"
        assert data["session"]["chat_summary"] == "The user said hello."


@pytest.mark.asyncio
async def test_list_messages(authenticated_client):
    # Create session
    session_response = await authenticated_client.post("/api/chat/sessions", json={"title": "Message List Session"})
    session_id = session_response.json()["id"]

    # Send a message (mocked)
    with patch("app.domains.chat.service.chat_agent.process_message", new_callable=AsyncMock) as mock_process:
        mock_process.return_value = {"assistant_message": "Response", "reasoning_trace": "Trace", "chat_summary_update": "Summary", "user_profile_update": "Profile"}
        await authenticated_client.post(f"/api/chat/sessions/{session_id}/messages", json={"content": "Hello", "agent_type": "coding"})

    response = await authenticated_client.get(f"/api/chat/sessions/{session_id}/messages")
    assert response.status_code == 200
    data = response.json()
    # Should have 2 messages: 1 user, 1 assistant
    assert len(data) == 2
    assert data[0]["role"] == "user"
    assert data[1]["role"] == "assistant"
