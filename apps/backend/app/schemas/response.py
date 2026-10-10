from datetime import datetime, timezone
from typing import Any, Generic, Optional, TypeVar
from pydantic import BaseModel, Field

DataT = TypeVar("DataT")


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class ErrorDetail(BaseModel):
    code: str
    message: str
    details: Optional[Any] = None


class StandardApiResponse(BaseModel, Generic[DataT]):
    """
    Uniform response envelope aligned with @tech-marketplace/shared StandardApiResponse.
    """
    success: bool = True
    data: Optional[DataT] = None
    message: Optional[str] = None
    error: Optional[ErrorDetail] = None


class HealthResponse(BaseModel):
    status: str = Field(default="ok", json_schema_extra={"example": "ok"})
    service: str = Field(default="AI Tech Marketplace API")
    version: str = Field(default="0.1.0")
    environment: str = Field(default="development")
    timestamp: datetime = Field(default_factory=utc_now)


class DatabaseHealthResponse(BaseModel):
    status: str = Field(default="connected", json_schema_extra={"example": "connected"})
    database: str = Field(default="postgresql")
    latency_ms: Optional[float] = None
    timestamp: datetime = Field(default_factory=utc_now)
