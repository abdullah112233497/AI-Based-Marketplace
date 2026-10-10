import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_health_root_endpoint(client: AsyncClient) -> None:
    """
    Verify root /health returns 200 OK with success envelope.
    """
    response = await client.get("/health")
    assert response.status_code == 200
    json_data = response.json()
    assert json_data["success"] is True
    assert json_data["data"]["status"] == "ok"
    assert "version" in json_data["data"]


@pytest.mark.asyncio
async def test_health_v1_endpoint(client: AsyncClient) -> None:
    """
    Verify /api/v1/health returns 200 OK with success envelope.
    """
    response = await client.get("/api/v1/health")
    assert response.status_code == 200
    json_data = response.json()
    assert json_data["success"] is True
    assert json_data["data"]["status"] == "ok"
    assert json_data["data"]["environment"] == "development"


@pytest.mark.asyncio
async def test_database_health_endpoint(client: AsyncClient) -> None:
    """
    Verify /api/v1/health/db successfully executes ping query against PostgreSQL.
    """
    response = await client.get("/api/v1/health/db")
    assert response.status_code == 200
    json_data = response.json()
    assert json_data["success"] is True
    assert json_data["data"]["status"] == "connected"
    assert json_data["data"]["database"] == "postgresql"
    assert json_data["data"]["latency_ms"] is not None
    assert json_data["data"]["latency_ms"] >= 0


@pytest.mark.asyncio
async def test_docs_available(client: AsyncClient) -> None:
    """
    Verify /docs endpoint is accessible and serves Swagger UI.
    """
    response = await client.get("/docs")
    assert response.status_code == 200
    assert "swagger-ui" in response.text.lower()


@pytest.mark.asyncio
async def test_not_found_error_envelope(client: AsyncClient) -> None:
    """
    Verify 404 responses conform to standard error envelope.
    """
    response = await client.get("/api/v1/nonexistent-route")
    assert response.status_code == 404
    json_data = response.json()
    assert json_data["success"] is False
    assert json_data["error"]["code"] == "NOT_FOUND"
    assert "message" in json_data
