import uuid
import pytest
from httpx import AsyncClient

ADMIN_CREDENTIALS = {
    "email": "admin@techmarketplace.pk",
    "password": "Admin123!",
}


async def get_admin_token(client: AsyncClient) -> str:
    res = await client.post("/api/v1/auth/login", json=ADMIN_CREDENTIALS)
    assert res.status_code == 200, f"Admin login failed: {res.text}"
    return res.json()["data"]["token"]


@pytest.mark.asyncio
async def test_customer_cannot_access_admin_endpoint(client: AsyncClient) -> None:
    # 1. Register customer
    cust_email = f"cust_rbac_{uuid.uuid4().hex[:8]}@test.com"
    reg = await client.post("/api/v1/auth/register", json={
        "name": "RBAC Cust",
        "email": cust_email,
        "phone": "03001234567",
        "password": "Password123!",
    })
    token = reg.json()["data"]["token"]

    # 2. Try accessing admin endpoint
    res = await client.get(
        "/api/v1/admin/agents",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 403
    body = res.json()
    assert body["success"] is False
    assert body["error"]["code"] == "FORBIDDEN"


@pytest.mark.asyncio
async def test_customer_cannot_access_agent_endpoint(client: AsyncClient) -> None:
    cust_email = f"cust_agent_rbac_{uuid.uuid4().hex[:8]}@test.com"
    reg = await client.post("/api/v1/auth/register", json={
        "name": "Cust Tester",
        "email": cust_email,
        "phone": "03001234567",
        "password": "Password123!",
    })
    token = reg.json()["data"]["token"]

    res = await client.get(
        "/api/v1/auth/test/agent-only",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 403
    assert res.json()["error"]["code"] == "FORBIDDEN"


@pytest.mark.asyncio
async def test_agent_cannot_access_admin_endpoint(client: AsyncClient) -> None:
    agent_email = f"agent_rbac_{uuid.uuid4().hex[:8]}@test.com"
    reg = await client.post("/api/v1/auth/register-agent", json={
        "name": "Vendor Tester",
        "email": agent_email,
        "phone": "03007654321",
        "password": "Password123!",
        "shopName": f"Shop {uuid.uuid4().hex[:6]}",
        "city": "Lahore",
        "address": "Hafeez Centre Shop 10",
    })
    token = reg.json()["data"]["token"]

    res = await client.get(
        "/api/v1/admin/agents",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 403
    assert res.json()["error"]["code"] == "FORBIDDEN"


@pytest.mark.asyncio
async def test_admin_can_access_admin_endpoint(client: AsyncClient) -> None:
    admin_token = await get_admin_token(client)
    res = await client.get(
        "/api/v1/admin/agents",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res.status_code == 200
    body = res.json()
    assert body["success"] is True
    assert isinstance(body["data"], list)


@pytest.mark.asyncio
async def test_agent_lifecycle_and_approval_flow(client: AsyncClient) -> None:
    # 1. Register new Agent
    agent_email = f"flow_agent_{uuid.uuid4().hex[:8]}@test.com"
    reg = await client.post("/api/v1/auth/register-agent", json={
        "name": "Lifecycle Vendor",
        "email": agent_email,
        "phone": "03112233445",
        "password": "Password123!",
        "shopName": f"Test Shop {uuid.uuid4().hex[:6]}",
        "city": "Islamabad",
        "address": "Blue Area Islamabad",
        "cnicOrTaxId": "12345-6789012-3",
    })
    assert reg.status_code == 201
    agent_data = reg.json()["data"]
    agent_token = agent_data["token"]
    agent_profile = agent_data["user"]["agentProfile"]

    assert agent_profile["status"] == "PENDING"
    agent_id = agent_profile["id"]

    # 2. Pending Agent attempts action requiring approved status -> MUST BE DENIED
    denied_res = await client.get(
        "/api/v1/auth/test/approved-agent-only",
        headers={"Authorization": f"Bearer {agent_token}"},
    )
    assert denied_res.status_code == 403
    assert denied_res.json()["error"]["code"] == "AGENT_NOT_APPROVED"

    # 3. Customer attempts to approve Agent -> MUST BE FORBIDDEN
    cust_res = await client.post("/api/v1/auth/register", json={
        "name": "Sneaky Customer",
        "email": f"hacker_{uuid.uuid4().hex[:8]}@test.com",
        "phone": "03001234567",
        "password": "Password123!",
    })
    cust_token = cust_res.json()["data"]["token"]
    unauth_approval = await client.patch(
        f"/api/v1/admin/agents/{agent_id}/status",
        json={"status": "APPROVED"},
        headers={"Authorization": f"Bearer {cust_token}"},
    )
    assert unauth_approval.status_code == 403

    # 4. Super Admin approves the Agent application
    admin_token = await get_admin_token(client)
    approve_res = await client.patch(
        f"/api/v1/admin/agents/{agent_id}/status",
        json={"status": "APPROVED", "isVerified": True},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert approve_res.status_code == 200
    updated_profile = approve_res.json()["data"]
    assert updated_profile["status"] == "APPROVED"
    assert updated_profile["isVerified"] is True

    # 5. Now approved Agent attempts action requiring approved status -> MUST SUCCEED
    allowed_res = await client.get(
        "/api/v1/auth/test/approved-agent-only",
        headers={"Authorization": f"Bearer {agent_token}"},
    )
    assert allowed_res.status_code == 200
    assert allowed_res.json()["success"] is True
    assert allowed_res.json()["data"]["status"] == "APPROVED"


@pytest.mark.asyncio
async def test_invalid_agent_status_transition_rejected(client: AsyncClient) -> None:
    admin_token = await get_admin_token(client)

    # Register an agent (starts PENDING)
    reg = await client.post("/api/v1/auth/register-agent", json={
        "name": "Transition Tester",
        "email": f"transition_{uuid.uuid4().hex[:8]}@test.com",
        "phone": "03112233445",
        "password": "Password123!",
        "shopName": f"Shop {uuid.uuid4().hex[:6]}",
        "city": "Multan",
        "address": "Mall of Multan",
    })
    agent_id = reg.json()["data"]["user"]["agentProfile"]["id"]

    # Attempt illegal transition: PENDING -> SUSPENDED (Cannot suspend an unapproved agent)
    illegal_res = await client.patch(
        f"/api/v1/admin/agents/{agent_id}/status",
        json={"status": "SUSPENDED"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert illegal_res.status_code == 400
    body = illegal_res.json()
    assert body["error"]["code"] == "INVALID_AGENT_STATUS_TRANSITION"
