from datetime import datetime
import enum
from typing import TYPE_CHECKING, Any, Dict, List, Optional
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
    Text,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.db.models.agent import Agent
    from app.db.models.product import Product
    from app.db.models.user import User


class OrderStatus(str, enum.Enum):
    PENDING = "PENDING"
    CONFIRMED = "CONFIRMED"
    SHIPPED = "SHIPPED"
    DELIVERED = "DELIVERED"
    CANCELLED = "CANCELLED"


class PaymentMethod(str, enum.Enum):
    COD = "COD"
    WALLET = "WALLET"
    CARD_DEMO = "CARD_DEMO"


class PaymentStatus(str, enum.Enum):
    PENDING = "PENDING"
    PAID = "PAID"
    FAILED = "FAILED"
    REFUNDED = "REFUNDED"


class Order(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """
    Transactional order record created by a customer checkout.
    Maintains financial snapshots, delivery address, fulfillment state, and lifecycle audit flags.
    """

    __tablename__ = "orders"

    order_number: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        index=True,
        nullable=False,
    )
    customer_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="RESTRICT"),
        index=True,
        nullable=False,
    )
    customer_name: Mapped[str] = mapped_column(String(255), nullable=False)
    customer_phone: Mapped[str] = mapped_column(String(50), nullable=False)

    status: Mapped[OrderStatus] = mapped_column(
        SAEnum(OrderStatus, native_enum=False, length=20),
        default=OrderStatus.PENDING,
        nullable=False,
        index=True,
    )
    payment_method: Mapped[PaymentMethod] = mapped_column(
        SAEnum(PaymentMethod, native_enum=False, length=20),
        default=PaymentMethod.COD,
        nullable=False,
    )
    payment_status: Mapped[PaymentStatus] = mapped_column(
        SAEnum(PaymentStatus, native_enum=False, length=20),
        default=PaymentStatus.PENDING,
        nullable=False,
        index=True,
    )

    # Shipping and recipient details snapshot
    shipping_address: Mapped[Dict[str, Any]] = mapped_column(
        JSONB,
        default=dict,
        nullable=False,
    )

    # Financial breakdown in integer PKR
    subtotal: Mapped[int] = mapped_column(Integer, nullable=False)
    shipping_fee: Mapped[int] = mapped_column(Integer, default=500, nullable=False)
    wallet_discount: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    total_amount: Mapped[int] = mapped_column(Integer, nullable=False)

    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    tracking_number: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    courier_name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    cancellation_reason: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    delivered_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    cancelled_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Idempotency flags
    reward_credited: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    commission_settled: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    stock_restored: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Relationships
    customer: Mapped["User"] = relationship("User", lazy="selectin")
    items: Mapped[List["OrderItem"]] = relationship(
        "OrderItem",
        back_populates="order",
        cascade="all, delete-orphan",
        lazy="selectin",
        order_by="OrderItem.created_at",
    )

    __table_args__ = (
        Index("ix_orders_customer_created", "customer_id", "created_at"),
        Index("ix_orders_status_created", "status", "created_at"),
    )

    def __repr__(self) -> str:
        return f"<Order id={self.id} number={self.order_number} status={self.status} total={self.total_amount}>"


class OrderItem(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """
    Individual purchased item snapshot containing frozen pricing, product title,
    agent attribution, and commission accounting rate.
    """

    __tablename__ = "order_items"

    order_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("orders.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    product_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("products.id", ondelete="SET NULL"),
        index=True,
        nullable=True,
    )
    agent_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("agents.id", ondelete="RESTRICT"),
        index=True,
        nullable=False,
    )

    # Historical product snapshots
    agent_shop_name: Mapped[str] = mapped_column(String(255), nullable=False)
    product_title: Mapped[str] = mapped_column(String(255), nullable=False)
    product_slug: Mapped[str] = mapped_column(String(280), nullable=False)
    product_image: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    variant_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    # Financial snapshots (PKR integers)
    unit_price: Mapped[int] = mapped_column(Integer, nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    total_price: Mapped[int] = mapped_column(Integer, nullable=False)

    # Commission attribution snapshot
    commission_rate: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    commission_amount: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    specs_snapshot: Mapped[Dict[str, Any]] = mapped_column(JSONB, default=dict, nullable=False)

    # Relationships
    order: Mapped["Order"] = relationship("Order", back_populates="items")
    agent: Mapped["Agent"] = relationship("Agent", lazy="selectin")
    product: Mapped[Optional["Product"]] = relationship("Product", lazy="selectin")

    __table_args__ = (
        Index("ix_order_items_agent_order", "agent_id", "order_id"),
    )

    def __repr__(self) -> str:
        return f"<OrderItem id={self.id} product={self.product_title} qty={self.quantity} total={self.total_price}>"
