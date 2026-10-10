import pytest
from typing import AsyncGenerator
from httpx import ASGITransport, AsyncClient

from app.db import session as db_session
from app.main import app


@pytest.fixture(autouse=True)
async def cleanup_database_engine():
    """
    Ensures that asyncpg connection pool is disposed at the end of every test
    so connections aren't leaked across pytest event loops.
    """
    yield
    if db_session._engine is not None:
        await db_session._engine.dispose()
        db_session._engine = None
        db_session._session_factory = None


@pytest.fixture
async def client() -> AsyncGenerator[AsyncClient, None]:
    """
    Asynchronous test client fixture configured with the FastAPI ASGI transport.
    """
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as async_client:
        yield async_client
