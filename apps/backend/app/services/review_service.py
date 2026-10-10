import logging
from typing import Optional, Tuple
import uuid
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.agent import Agent
from app.db.models.order import Order, OrderItem, OrderStatus
from app.db.models.product import Product
from app.db.models.review import Review, ReviewStatus

logger = logging.getLogger(__name__)


async def check_user_review_eligibility(
    db: AsyncSession,
    user_id: uuid.UUID,
    product_id: uuid.UUID,
) -> Tuple[bool, Optional[uuid.UUID], Optional[str]]:
    """
    Validates whether a customer is eligible to submit a verified purchase review.
    Rule:
    1. Must have an order with DELIVERED status containing the specified product.
    2. Must not have already reviewed this product.
    Returns: (is_eligible, order_item_id, reason_if_not)
    """
    # 1. Check if already reviewed
    existing_stmt = select(Review).where(
        Review.user_id == user_id,
        Review.product_id == product_id,
        Review.status != ReviewStatus.REMOVED,
    )
    existing_review = (await db.execute(existing_stmt)).scalar_one_or_none()
    if existing_review:
        return False, None, "You have already submitted a review for this product."

    # 2. Check for delivered purchase
    order_stmt = (
        select(OrderItem)
        .join(Order, OrderItem.order_id == Order.id)
        .where(
            Order.customer_id == user_id,
            Order.status == OrderStatus.DELIVERED,
            OrderItem.product_id == product_id,
        )
        .limit(1)
    )
    delivered_item = (await db.execute(order_stmt)).scalar_one_or_none()
    if not delivered_item:
        return False, None, "Only verified purchasers with delivered orders may review this product."

    return True, delivered_item.id, None


async def recalculate_product_and_agent_ratings(
    db: AsyncSession,
    product_id: uuid.UUID,
) -> Tuple[float, int]:
    """
    Aggregates published reviews for a product and updates Product.rating, Product.review_count,
    as well as the owning Agent shop's overall rating and rating_count.
    """
    prod_stmt = select(Product).where(Product.id == product_id)
    product = (await db.execute(prod_stmt)).scalar_one_or_none()
    if not product:
        return 5.0, 0

    # 1. Product review aggregates
    rev_stmt = select(
        func.count(Review.id).label("cnt"),
        func.avg(Review.rating).label("avg_rating"),
    ).where(
        Review.product_id == product_id,
        Review.status == ReviewStatus.PUBLISHED,
    )
    row = (await db.execute(rev_stmt)).one()
    count = row.cnt or 0
    avg_rating = round(float(row.avg_rating), 1) if row.avg_rating is not None else 5.0

    product.review_count = count
    product.rating = avg_rating

    # 2. Agent review aggregates
    if product.agent_id:
        agent_stmt = select(Agent).where(Agent.id == product.agent_id)
        agent = (await db.execute(agent_stmt)).scalar_one_or_none()
        if agent:
            agent_rev_stmt = (
                select(
                    func.count(Review.id).label("cnt"),
                    func.avg(Review.rating).label("avg_rating"),
                )
                .join(Product, Review.product_id == Product.id)
                .where(
                    Product.agent_id == product.agent_id,
                    Review.status == ReviewStatus.PUBLISHED,
                )
            )
            agent_row = (await db.execute(agent_rev_stmt)).one()
            agent_count = agent_row.cnt or 0
            agent_avg = round(float(agent_row.avg_rating), 1) if agent_row.avg_rating is not None else 5.0
            agent.rating_count = agent_count
            agent.rating = agent_avg

    await db.flush()
    logger.info("Updated product %s rating: %.1f (%d reviews)", product.title, avg_rating, count)
    return avg_rating, count
