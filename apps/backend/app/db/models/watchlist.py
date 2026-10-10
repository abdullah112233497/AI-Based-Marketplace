from typing import TYPE_CHECKING, Optional
import uuid
from sqlalchemy import Boolean, ForeignKey, Index, Integer, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.db.models.product import Product
    from app.db.models.user import User


class ProductWatch(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """
    Customer product alert subscription for price drop and back-in-stock events.
    """

    __tablename__ = "product_watches"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    product_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("products.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    watch_price_drop: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    watch_back_in_stock: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Optional customer-defined target price threshold (Integer PKR)
    target_price: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    # Historical baseline snapshots
    last_seen_price: Mapped[int] = mapped_column(Integer, nullable=False)
    last_seen_stock: Mapped[int] = mapped_column(Integer, nullable=False)

    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False, index=True)

    # Relationships
    user: Mapped["User"] = relationship("User", lazy="selectin")
    product: Mapped["Product"] = relationship("Product", lazy="selectin")

    __table_args__ = (
        UniqueConstraint("user_id", "product_id", name="uq_product_watch_user_product"),
        Index("ix_product_watches_product_active", "product_id", "is_active"),
        Index("ix_product_watches_user_active", "user_id", "is_active"),
    )

    def __repr__(self) -> str:
        return (
            f"<ProductWatch id={self.id} user_id={self.user_id} product_id={self.product_id} "
            f"price_drop={self.watch_price_drop} back_in_stock={self.watch_back_in_stock}>"
        )
