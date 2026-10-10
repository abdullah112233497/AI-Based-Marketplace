from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse

from app.api.router import api_router
from app.api.v1.endpoints.health import router as health_router
from app.core.config import get_settings
from app.core.exceptions import register_exception_handlers
from app.core.logging import get_logger, setup_logging
from app.db.session import get_async_engine

# Initialize standard logging
setup_logging()
logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """
    Application lifespan handling for clean startup and shutdown events.
    """
    settings = get_settings()
    logger.info("=" * 60)
    logger.info("Starting %s [Env: %s]", settings.APP_NAME, settings.APP_ENV)
    logger.info("API Docs available at: http://%s:%s/docs", settings.HOST, settings.PORT)
    logger.info("=" * 60)

    # Yield control to the application
    yield

    # Clean shutdown: dispose database connection pool
    logger.info("Disposing database connection pool...")
    engine = get_async_engine()
    await engine.dispose()
    logger.info("Application shutdown complete.")


def create_application() -> FastAPI:
    """
    Application factory building and configuring the FastAPI app.
    """
    settings = get_settings()

    app = FastAPI(
        title=settings.APP_NAME,
        version="0.1.0",
        description="Production FastAPI Backend for AI-Powered Multi-Vendor Tech Marketplace",
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
        lifespan=lifespan,
    )

    # 1. Register Global Exception Handlers
    register_exception_handlers(app)

    # 2. Configure CORS Middleware
    logger.info("Configured CORS origins: %s", settings.CORS_ORIGINS)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["*"],
    )

    # 3. Mount Routers
    # Root health endpoint aliases (e.g. GET /health)
    app.include_router(health_router, prefix="", tags=["System & Health"])

    # API v1 routes (e.g. GET /api/v1/health, GET /api/v1/health/db)
    app.include_router(api_router, prefix="/api")

    @app.get("/", include_in_schema=False)
    async def root_redirect() -> RedirectResponse:
        return RedirectResponse(url="/docs")

    return app


app = create_application()
