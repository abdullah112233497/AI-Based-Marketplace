import uuid
from typing import TYPE_CHECKING, List, Optional
from sqlalchemy import ForeignKey, Index, Integer, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.db.models.product import Product
    from app.db.models.user import User


class Cart(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """
    Persistent server-side shopping cart belonging to a Customer.
    A user normally has one active cart.
    """

    __tablename__ = "carts"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        index=True,
        nullable=False,
    )

    # Relationships
    user: Mapped["User"] = relationship("User", lazy="selectin")
    items: Mapped[List["CartItem"]] = relationship(
        "CartItem",
        back_populates="cart",
        cascade="all, delete-orphan",
        lazy="selectin",
        order_by="CartItem.created_at",
    )

    def __repr__(self) -> str:
        return f"<Cart id={self.id} user_id={self.user_id} items_count={len(self.items)}>"


class CartItem(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """
    An individual line item within a user's persistent cart.
    """

    __tablename__ = "cart_items"

    cart_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("carts.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    product_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("products.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    variant_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    quantity: Mapped[int] = mapped_column(Integer, default=1, nullable=False)

    # Relationships
    cart: Mapped["Cart"] = relationship("Cart", back_populates="items")
    product: Mapped["Product"] = relationship("Product", lazy="selectin")

    __table_args__ = (
        Index("ix_cart_items_cart_product", "cart_id", "product_id"),
    )

    def __repr__(self) -> str:
        return f"<CartItem id={self.id} product_id={self.product_id} qty={self.quantity}>"
