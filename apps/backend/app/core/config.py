import json
from functools import lru_cache
from typing import Any, List, Union
from urllib.parse import parse_qsl, urlencode, urlparse, urlunparse

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Central application configuration loaded from environment variables.
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # Application Basics
    APP_NAME: str = "AI Tech Marketplace API"
    APP_ENV: str = Field(default="development", description="development | staging | production")
    DEBUG: bool = False
    PORT: int = 8000
    HOST: str = "0.0.0.0"
    API_V1_PREFIX: str = "/api/v1"
    LOG_LEVEL: str = "INFO"

    # Database Settings
    DATABASE_URL: str = Field(
        default="postgresql+asyncpg://postgres:postgres@localhost:5432/tech_marketplace",
        description="Async PostgreSQL connection string",
    )
    DB_POOL_SIZE: int = 10
    DB_MAX_OVERFLOW: int = 20
    DB_ECHO: bool = False

    # CORS Allowed Origins
    CORS_ORIGINS: Union[List[str], str] = Field(
        default=["http://localhost:3000", "http://127.0.0.1:3000"]
    )

    # JWT & Authentication Settings
    JWT_SECRET_KEY: str = Field(
        default="marketplace-dev-secret-key-change-me-in-production-abcdef123456",
        description="Cryptographic secret for signing JWT tokens",
    )
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080  # 7 days
    AUTH_COOKIE_NAME: str = "auth_token"
    AUTH_COOKIE_SECURE: bool = False
    AUTH_COOKIE_SAMESITE: str = "lax"

    # Platform Owner Commission Settings
    PLATFORM_COMMISSION_PERCENTAGE: float = Field(
        default=5.0,
        description="Platform owner default commission in percentage (e.g. 5.0 for 5%)",
    )

    @property
    def platform_commission_rate(self) -> float:
        """Converts percentage to decimal rate (e.g. 5.0 -> 0.05)."""
        val = self.PLATFORM_COMMISSION_PERCENTAGE
        return (val / 100.0) if val > 1.0 else val

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, value: Any) -> List[str]:
        if isinstance(value, list):
            return value
        if isinstance(value, str):
            value = value.strip()
            if value.startswith("[") and value.endswith("]"):
                try:
                    parsed = json.loads(value)
                    if isinstance(parsed, list):
                        return [str(origin).strip() for origin in parsed]
                except json.JSONDecodeError:
                    pass
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return ["http://localhost:3000", "http://127.0.0.1:3000"]

    @property
    def is_production(self) -> bool:
        return self.APP_ENV.lower() == "production"

    @property
    def is_ssl_required(self) -> bool:
        url_lower = self.DATABASE_URL.lower()
        return (
            "sslmode=require" in url_lower
            or "ssl=require" in url_lower
            or "neon.tech" in url_lower
            or "aws" in url_lower
        )

    @property
    def clean_async_database_url(self) -> str:
        """
        Normalizes the database URL for SQLAlchemy 2.x + asyncpg:
        1. Ensures the scheme is 'postgresql+asyncpg://'.
        2. Strips query parameters incompatible with asyncpg (e.g. sslmode, channel_binding).
        """
        raw_url = self.DATABASE_URL.strip()

        # Normalize driver scheme
        if raw_url.startswith("postgres://"):
            raw_url = "postgresql+asyncpg://" + raw_url[len("postgres://") :]
        elif raw_url.startswith("postgresql://") and not raw_url.startswith("postgresql+"):
            raw_url = "postgresql+asyncpg://" + raw_url[len("postgresql://") :]

        parsed = urlparse(raw_url)
        query_params = dict(parse_qsl(parsed.query))

        # Filter out parameters that asyncpg handles via connect_args or doesn't support as query strings
        filtered_params = {
            k: v
            for k, v in query_params.items()
            if k.lower() not in {"sslmode", "channel_binding"}
        }

        new_query = urlencode(filtered_params)
        clean_url = urlunparse(parsed._replace(query=new_query))
        return clean_url


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """
    Returns a cached singleton instance of application settings.
    """
    return Settings()
