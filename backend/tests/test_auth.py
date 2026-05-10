import pytest


@pytest.mark.asyncio
async def test_register_success(client):
    response = await client.post("/api/auth/register", json={"email": "test@example.com", "password": "testpassword"})
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "test@example.com"
    assert "id" in data
    assert "created_at" in data


@pytest.mark.asyncio
async def test_register_duplicate_email(client):
    # First registration
    await client.post("/api/auth/register", json={"email": "test@example.com", "password": "testpassword"})
    # Duplicate registration
    response = await client.post("/api/auth/register", json={"email": "test@example.com", "password": "anotherpassword"})
    assert response.status_code == 400
    assert response.json()["detail"] == "User with this email already exists."


@pytest.mark.asyncio
async def test_login_success_auto_register(client):
    response = await client.post("/api/auth/login", json={"email": "newuser@example.com", "password": "newpassword"})
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


@pytest.mark.asyncio
async def test_login_wrong_password(client):
    # Register first
    await client.post("/api/auth/register", json={"email": "test@example.com", "password": "testpassword"})
    # Login with wrong password
    response = await client.post("/api/auth/login", json={"email": "test@example.com", "password": "wrongpassword"})
    assert response.status_code == 401
    assert response.json()["detail"] == "Incorrect email or password"


@pytest.mark.asyncio
async def test_get_me(client):
    # Register and login
    email = "me@example.com"
    await client.post("/api/auth/register", json={"email": email, "password": "testpassword"})
    login_response = await client.post("/api/auth/login", json={"email": email, "password": "testpassword"})
    token = login_response.json()["access_token"]

    # Get /me
    response = await client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    assert response.json()["email"] == email
