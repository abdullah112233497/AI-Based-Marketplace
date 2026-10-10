from typing import TYPE_CHECKING, Optional
import uuid
from sqlalchemy import Boolean, ForeignKey, Index, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.db.models.user import User


class Address(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """
    Saved customer delivery addresses for fast checkout.
    """

    __tablename__ = "addresses"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    label: Mapped[str] = mapped_column(String(50), default="Home", nullable=False)
    recipient_name: Mapped[str] = mapped_column(String(150), nullable=False)
    phone: Mapped[str] = mapped_column(String(50), nullable=False)
    street_address: Mapped[str] = mapped_column(String(255), nullable=False)
    city: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    province: Mapped[str] = mapped_column(String(100), default="Punjab", nullable=False)
    postal_code: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    is_default: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, index=True)

    # Relationship to User
    user: Mapped["User"] = relationship("User", lazy="selectin")

    __table_args__ = (
        Index("ix_addresses_user_default", "user_id", "is_default"),
    )

    def __repr__(self) -> str:
        return f"<Address id={self.id} user_id={self.user_id} label={self.label} is_default={self.is_default}>"
