import re
from typing import Optional
import uuid
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.models.agent import Agent
from app.db.models.product import Product


def slugify(text: str) -> str:
    """
    Transforms arbitrary text into a clean URL-friendly slug.
    """
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_-]+", "-", text)
    text = re.sub(r"^-+|-+$", "", text)
    return text or "item"


async def generate_unique_shop_slug(db: AsyncSession, shop_name: str) -> str:
    """
    Generates a unique shop slug, appending numeric suffixes (-2, -3, etc.) on collision.
    """
    base_slug = slugify(shop_name)
    slug = base_slug
    counter = 1

    while True:
        stmt = select(Agent.id).where(Agent.shop_slug == slug)
        result = await db.execute(stmt)
        if result.scalar_one_or_none() is None:
            return slug
        counter += 1
        slug = f"{base_slug}-{counter}"


async def generate_unique_product_slug(
    db: AsyncSession,
    title: str,
    exclude_product_id: Optional[uuid.UUID] = None,
) -> str:
    """
    Generates a unique readable product slug, resolving multi-vendor collisions with suffixes.
    """
    base_slug = slugify(title)
    slug = base_slug
    counter = 1

    while True:
        stmt = select(Product.id).where(Product.slug == slug)
        if exclude_product_id:
            stmt = stmt.where(Product.id != exclude_product_id)

        result = await db.execute(stmt)
        if result.scalar_one_or_none() is None:
            return slug
        counter += 1
        slug = f"{base_slug}-{counter}"
