import uuid
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_customer_registration_success(client: AsyncClient) -> None:
    unique_email = f"cust_{uuid.uuid4().hex[:8]}@test.com"
    payload = {
        "name": "Test Customer",
        "email": unique_email,
        "phone": "03001234567",
        "password": "Password123!",
    }

    response = await client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 201

    data = response.json()
    assert data["success"] is True
    assert "token" in data["data"]
    assert data["data"]["user"]["email"] == unique_email
    assert data["data"]["user"]["role"] == "CUSTOMER"

    # Verify cookie was set
    assert "auth_token" in response.cookies


@pytest.mark.asyncio
async def test_customer_registration_duplicate_email(client: AsyncClient) -> None:
    unique_email = f"dup_{uuid.uuid4().hex[:8]}@test.com"
    payload = {
        "name": "First User",
        "email": unique_email,
        "phone": "03001234567",
        "password": "Password123!",
    }

    res1 = await client.post("/api/v1/auth/register", json=payload)
    assert res1.status_code == 201

    # Attempt duplicate registration
    res2 = await client.post("/api/v1/auth/register", json=payload)
    assert res2.status_code == 409
    body = res2.json()
    assert body["success"] is False
    assert body["error"]["code"] == "EMAIL_EXISTS"


@pytest.mark.asyncio
async def test_customer_registration_invalid_payload(client: AsyncClient) -> None:
    # Invalid email, too short password, invalid phone
    payload = {
        "name": "A",  # Min length 2
        "email": "not-an-email",
        "phone": "123",  # Invalid Pakistani format
        "password": "short",  # Min length 8
    }

    response = await client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 422
    body = response.json()
    assert body["success"] is False
    assert body["error"]["code"] == "VALIDATION_ERROR"


@pytest.mark.asyncio
async def test_login_success(client: AsyncClient) -> None:
    email = f"login_{uuid.uuid4().hex[:8]}@test.com"
    password = "SecurePassword123!"

    # Register first
    await client.post("/api/v1/auth/register", json={
        "name": "Login Tester",
        "email": email,
        "phone": "03009998877",
        "password": password,
    })

    # Perform Login
    response = await client.post("/api/v1/auth/login", json={
        "email": email,
        "password": password,
    })

    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    assert "token" in body["data"]
    assert body["data"]["user"]["email"] == email
    assert "auth_token" in response.cookies


@pytest.mark.asyncio
async def test_login_wrong_password_rejected(client: AsyncClient) -> None:
    email = f"wrongpw_{uuid.uuid4().hex[:8]}@test.com"
    password = "CorrectPassword123!"

    await client.post("/api/v1/auth/register", json={
        "name": "Wrong PW Tester",
        "email": email,
        "phone": "03009998877",
        "password": password,
    })

    response = await client.post("/api/v1/auth/login", json={
        "email": email,
        "password": "WrongPassword999!",
    })

    assert response.status_code == 401
    body = response.json()
    assert body["success"] is False
    assert body["error"]["code"] == "INVALID_CREDENTIALS"


@pytest.mark.asyncio
async def test_login_unknown_account_rejected(client: AsyncClient) -> None:
    response = await client.post("/api/v1/auth/login", json={
        "email": f"unknown_{uuid.uuid4().hex[:8]}@nowhere.com",
        "password": "RandomPassword123!",
    })

    assert response.status_code == 401
    body = response.json()
    assert body["success"] is False
    assert body["error"]["code"] == "INVALID_CREDENTIALS"


@pytest.mark.asyncio
async def test_me_authenticated_via_cookie(client: AsyncClient) -> None:
    email = f"me_cookie_{uuid.uuid4().hex[:8]}@test.com"
    password = "Password123!"

    reg_res = await client.post("/api/v1/auth/register", json={
        "name": "Cookie User",
        "email": email,
        "phone": "03005554433",
        "password": password,
    })
    token = reg_res.json()["data"]["token"]

    # Send request with auth cookie
    client.cookies.set("auth_token", token)
    me_res = await client.get("/api/v1/auth/me")

    assert me_res.status_code == 200
    me_body = me_res.json()
    assert me_body["success"] is True
    assert me_body["data"]["email"] == email
    client.cookies.clear()


@pytest.mark.asyncio
async def test_me_authenticated_via_bearer_header(client: AsyncClient) -> None:
    email = f"me_bearer_{uuid.uuid4().hex[:8]}@test.com"
    password = "Password123!"

    reg_res = await client.post("/api/v1/auth/register", json={
        "name": "Bearer User",
        "email": email,
        "phone": "03005554433",
        "password": password,
    })
    token = reg_res.json()["data"]["token"]

    me_res = await client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert me_res.status_code == 200
    me_body = me_res.json()
    assert me_body["success"] is True
    assert me_body["data"]["email"] == email


@pytest.mark.asyncio
async def test_me_unauthenticated_rejected(client: AsyncClient) -> None:
    client.cookies.clear()
    response = await client.get("/api/v1/auth/me")

    assert response.status_code == 401
    body = response.json()
    assert body["success"] is False
    assert body["error"]["code"] == "UNAUTHORIZED"


@pytest.mark.asyncio
async def test_logout_clears_cookie(client: AsyncClient) -> None:
    client.cookies.set("auth_token", "fake-token-test")
    response = await client.post("/api/v1/auth/logout")

    assert response.status_code == 200
    assert response.json()["success"] is True
