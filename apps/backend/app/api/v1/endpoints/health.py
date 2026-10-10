import time
from fastapi import APIRouter, Depends, status
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.logging import get_logger
from app.db.session import get_db
from app.schemas.response import (
    DatabaseHealthResponse,
    HealthResponse,
    StandardApiResponse,
)

logger = get_logger(__name__)
router = APIRouter(tags=["System & Health"])


@router.get(
    "/health",
    response_model=StandardApiResponse[HealthResponse],
    summary="Application Health Check",
    description="Returns the operational status, environment, and version of the API service.",
)
async def check_health() -> StandardApiResponse[HealthResponse]:
    settings = get_settings()
    health_data = HealthResponse(
        status="ok",
        service=settings.APP_NAME,
        version="0.1.0",
        environment=settings.APP_ENV,
    )
    return StandardApiResponse(
        success=True,
        data=health_data,
        message="Service is operational",
    )


@router.get(
    "/health/db",
    response_model=StandardApiResponse[DatabaseHealthResponse],
    summary="Database Connectivity Check",
    description="Tests live database connectivity by executing a lightweight verification query.",
)
async def check_database_health(
    db: AsyncSession = Depends(get_db),
) -> StandardApiResponse[DatabaseHealthResponse]:
    start_time = time.perf_counter()
    try:
        result = await db.execute(text("SELECT 1 AS ping"))
        scalar_val = result.scalar()
        latency_ms = round((time.perf_counter() - start_time) * 1000, 2)

        if scalar_val != 1:
            raise ValueError("Unexpected scalar returned from database ping query")

        return StandardApiResponse(
            success=True,
            data=DatabaseHealthResponse(
                status="connected",
                database="postgresql",
                latency_ms=latency_ms,
            ),
            message="Database connectivity verified",
        )
    except Exception as exc:
        logger.error("Database health check failed: %s", str(exc))
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "success": False,
                "message": "Database is unreachable",
                "error": {
                    "code": "DATABASE_UNAVAILABLE",
                    "message": "Failed to connect to PostgreSQL database",
                },
            },
        )
