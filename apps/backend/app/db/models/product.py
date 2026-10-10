from datetime import datetime
import enum
from typing import TYPE_CHECKING, Any, Dict, List, Optional
import uuid
from sqlalchemy import (
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
    from app.db.models.brand import Brand
    from app.db.models.category import Category


class ProductCondition(str, enum.Enum):
    NEW = "NEW"
    USED = "USED"
    REFURBISHED = "REFURBISHED"


class ProductStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    PUBLISHED = "PUBLISHED"
    UNPUBLISHED = "UNPUBLISHED"
    REJECTED = "REJECTED"
    ARCHIVED = "ARCHIVED"


class Product(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """
    Sellable multi-vendor product listing owned by an approved Agent.
    """

    __tablename__ = "products"

    agent_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("agents.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    category_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("categories.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    brand_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("brands.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    # Denormalized brand name for query efficiency and direct search matching
    brand: Mapped[str] = mapped_column(String(100), nullable=False, index=True)

    title: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    slug: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        index=True,
        nullable=False,
    )
    description: Mapped[str] = mapped_column(Text, nullable=False)

    condition: Mapped[ProductCondition] = mapped_column(
        SAEnum(ProductCondition, native_enum=False, length=20),
        default=ProductCondition.NEW,
        nullable=False,
        index=True,
    )
    condition_description: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    # Money representation: Integer PKR (e.g. 150000 = Rs. 150,000)
    base_price: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    compare_at_price: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    stock: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    status: Mapped[ProductStatus] = mapped_column(
        SAEnum(ProductStatus, native_enum=False, length=20),
        default=ProductStatus.PUBLISHED,
        nullable=False,
        index=True,
    )

    # Dynamic specifications JSONB (e.g. {"ram_gb": "12", "storage_gb": "256", "pta_approved": "Official PTA Approved"})
    specs: Mapped[Dict[str, Any]] = mapped_column(JSONB, default=dict, nullable=False)

    # Media and variants
    images: Mapped[List[str]] = mapped_column(JSONB, default=list, nullable=False)
    variants: Mapped[List[Dict[str, Any]]] = mapped_column(JSONB, default=list, nullable=False)

    rating: Mapped[float] = mapped_column(Float, default=5.0, nullable=False)
    review_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    published_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    agent: Mapped["Agent"] = relationship(
        "Agent",
        back_populates="products",
        lazy="selectin",
    )
    category: Mapped["Category"] = relationship(
        "Category",
        back_populates="products",
        lazy="selectin",
    )
    brand_rel: Mapped[Optional["Brand"]] = relationship(
        "Brand",
        back_populates="products",
        lazy="selectin",
    )

    __table_args__ = (
        Index("ix_products_status_category", "status", "category_id"),
        Index("ix_products_status_base_price", "status", "base_price"),
        Index("ix_products_status_created_at", "status", "created_at"),
        Index("ix_products_specs_gin", "specs", postgresql_using="gin"),
    )

    def __repr__(self) -> str:
        return f"<Product id={self.id} slug={self.slug} price={self.base_price} stock={self.stock}>"
