from datetime import datetime
import enum
from typing import TYPE_CHECKING, Optional
import uuid
from sqlalchemy import (
    Boolean,
    DateTime,
    Enum as SAEnum,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.db.models.agent import Agent
    from app.db.models.category import Category
    from app.db.models.order import Order, OrderItem


class CommissionRuleType(str, enum.Enum):
    CATEGORY_BASED = "CATEGORY_BASED"
    PERCENTAGE = "PERCENTAGE"
    FIXED = "FIXED"


class CommissionStatus(str, enum.Enum):
    PENDING = "PENDING"
    EARNED = "EARNED"
    CANCELLED = "CANCELLED"


class CommissionRule(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """
    Configurable commission policy rule per product category or default marketplace level.
    """

    __tablename__ = "commission_rules"

    category_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("categories.id", ondelete="SET NULL"),
        unique=True,
        index=True,
        nullable=True,
    )
    category_slug: Mapped[Optional[str]] = mapped_column(String(100), index=True, nullable=True)
    rule_type: Mapped[CommissionRuleType] = mapped_column(
        SAEnum(CommissionRuleType, native_enum=False, length=30),
        default=CommissionRuleType.CATEGORY_BASED,
        nullable=False,
    )
    rate: Mapped[float] = mapped_column(Float, nullable=False, default=0.05)  # e.g. 0.045 for 4.5%
    description: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationships
    category: Mapped[Optional["Category"]] = relationship("Category", lazy="selectin")

    def __repr__(self) -> str:
        return f"<CommissionRule category={self.category_slug} rate={self.rate}>"


class CommissionRecord(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """
    Persistent auditable commission ledger entry generated from fulfilled order items.
    """

    __tablename__ = "commission_records"

    order_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("orders.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    order_item_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("order_items.id", ondelete="CASCADE"),
        unique=True,
        index=True,
        nullable=False,
    )
    agent_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("agents.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )

    basis_amount: Mapped[int] = mapped_column(Integer, nullable=False)  # Eligible item subtotal
    rate: Mapped[float] = mapped_column(Float, nullable=False)          # Applied rate snapshot
    commission_amount: Mapped[int] = mapped_column(Integer, nullable=False)  # Calculated commission in PKR
    status: Mapped[CommissionStatus] = mapped_column(
        SAEnum(CommissionStatus, native_enum=False, length=20),
        default=CommissionStatus.PENDING,
        nullable=False,
        index=True,
    )
    settled_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    order: Mapped["Order"] = relationship("Order", lazy="selectin")
    order_item: Mapped["OrderItem"] = relationship("OrderItem", lazy="selectin")
    agent: Mapped["Agent"] = relationship("Agent", lazy="selectin")

    __table_args__ = (
        Index("ix_commissions_agent_status", "agent_id", "status"),
    )

    def __repr__(self) -> str:
        return f"<CommissionRecord agent_id={self.agent_id} amount={self.commission_amount} status={self.status}>"
