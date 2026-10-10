import enum
import uuid
from typing import TYPE_CHECKING, List, Optional
from sqlalchemy import Boolean, Enum as SAEnum, Float, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.db.models.product import Product
    from app.db.models.user import User


class AgentStatus(str, enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    SUSPENDED = "SUSPENDED"


class Agent(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """
    Agent / Shop profile entity linked 1-to-1 to a User with role AGENT.
    Maintains shop metadata, physical verification, and seller approval status.
    """

    __tablename__ = "agents"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        index=True,
        nullable=False,
    )
    shop_name: Mapped[str] = mapped_column(String(255), nullable=False)
    shop_slug: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        index=True,
        nullable=False,
    )
    shop_description: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)
    city: Mapped[str] = mapped_column(String(100), nullable=False)
    address: Mapped[str] = mapped_column(String(500), nullable=False)
    contact_phone: Mapped[str] = mapped_column(String(50), nullable=False)
    cnic_or_tax_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    status: Mapped[AgentStatus] = mapped_column(
        SAEnum(AgentStatus, native_enum=False, length=20),
        default=AgentStatus.PENDING,
        nullable=False,
        index=True,
    )
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    rating: Mapped[float] = mapped_column(Float, default=5.0, nullable=False)
    rating_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    product_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # Reverse relationship to User
    user: Mapped["User"] = relationship("User", back_populates="agent")

    # One-to-many relationship with Products
    products: Mapped[List["Product"]] = relationship(
        "Product",
        back_populates="agent",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<Agent id={self.id} shop_name={self.shop_name} status={self.status}>"
