from typing import TYPE_CHECKING, List, Optional
from sqlalchemy import Boolean, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.db.models.product import Product


class Brand(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """
    Standardized manufacturer/brand entity (e.g. Apple, Samsung, Dell).
    """

    __tablename__ = "brands"

    name: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    slug: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    logo_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    products: Mapped[List["Product"]] = relationship(
        "Product",
        back_populates="brand_rel",
    )

    def __repr__(self) -> str:
        return f"<Brand id={self.id} slug={self.slug} name={self.name}>"
