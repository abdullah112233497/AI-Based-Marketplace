import enum
from typing import TYPE_CHECKING, Optional
import uuid
from sqlalchemy import (
    Enum as SAEnum,
    ForeignKey,
    Index,
    Integer,
    String,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.db.models.order import Order
    from app.db.models.user import User


class WalletTransactionType(str, enum.Enum):
    EARNED = "EARNED"
    SPENT = "SPENT"
    REFUND = "REFUND"
    ADMIN_ADJUSTMENT = "ADMIN_ADJUSTMENT"


class WalletLedger(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """
    Append-only immutable wallet ledger.
    Every balance change (cashback earned, checkout redemption, admin refund)
    is recorded with an auditable amount and resulting balance_after snapshot.
    """

    __tablename__ = "wallet_ledgers"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    order_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("orders.id", ondelete="SET NULL"),
        index=True,
        nullable=True,
    )
    type: Mapped[WalletTransactionType] = mapped_column(
        SAEnum(WalletTransactionType, native_enum=False, length=30),
        nullable=False,
        index=True,
    )
    # Integer PKR (positive for credits, negative for debits)
    amount: Mapped[int] = mapped_column(Integer, nullable=False)
    balance_after: Mapped[int] = mapped_column(Integer, nullable=False)
    description: Mapped[str] = mapped_column(String(255), nullable=False)
    reference_order_id: Mapped[Optional[str]] = mapped_column(String(100), index=True, nullable=True)

    # Relationships
    user: Mapped["User"] = relationship("User", lazy="selectin")
    order: Mapped[Optional["Order"]] = relationship("Order", lazy="selectin")

    __table_args__ = (
        Index("ix_wallet_user_created", "user_id", "created_at"),
    )

    def __repr__(self) -> str:
        return f"<WalletLedger user_id={self.user_id} type={self.type} amount={self.amount} bal={self.balance_after}>"
