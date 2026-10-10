from datetime import datetime, timezone
from typing import Any, Dict, Optional
from sqlalchemy import DateTime, Index, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, UUIDPrimaryKeyMixin


class DomainEvent(Base, UUIDPrimaryKeyMixin):
    """
    Transactional Domain Event Outbox table.
    Enables future asynchronous consumers (n8n workflows, notification dispatchers,
    audit pipelines) to process system events without polluting synchronous core domain logic.
    """

    __tablename__ = "domain_events"

    event_type: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    entity_type: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    entity_id: Mapped[str] = mapped_column(String(100), nullable=False)

    payload: Mapped[Dict[str, Any]] = mapped_column(JSONB, default=dict, nullable=False)

    status: Mapped[str] = mapped_column(String(20), default="PENDING", nullable=False, index=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    processed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    __table_args__ = (
        Index("ix_domain_events_status_created", "status", "created_at"),
    )

    def __repr__(self) -> str:
        return f"<DomainEvent id={self.id} type={self.event_type} entity={self.entity_type}:{self.entity_id} status={self.status}>"
