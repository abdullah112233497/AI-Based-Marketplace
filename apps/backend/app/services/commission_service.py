from datetime import datetime, timezone
from typing import List, Optional
import uuid
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logging import get_logger
from app.db.models.commission import (
    CommissionRecord,
    CommissionRule,
    CommissionRuleType,
    CommissionStatus,
)
from app.db.models.order import Order

logger = get_logger(__name__)

# Default category commission fallback rates (if not overridden in database)
DEFAULT_CATEGORY_RATES = {
    "mobiles": 0.045,      # 4.5%
    "laptops": 0.040,      # 4.0%
    "accessories": 0.080,  # 8.0%
}
DEFAULT_FALLBACK_RATE = 0.050  # 5.0% general marketplace default


async def get_category_commission_rate(
    db: AsyncSession,
    category_id: Optional[uuid.UUID] = None,
    category_slug: Optional[str] = None,
) -> float:
    """
    Returns the applicable commission percentage for an item based on category rules.
    """
    if category_slug:
        clean_slug = category_slug.strip().lower()
        rule_stmt = select(CommissionRule).where(
            CommissionRule.category_slug == clean_slug,
            CommissionRule.is_active == True,
        )
        rule = (await db.execute(rule_stmt)).scalar_one_or_none()
        if rule:
            return rule.rate

    if category_id:
        rule_stmt = select(CommissionRule).where(
            CommissionRule.category_id == category_id,
            CommissionRule.is_active == True,
        )
        rule = (await db.execute(rule_stmt)).scalar_one_or_none()
        if rule:
            return rule.rate

    # Fallback to configured standard rates
    if category_slug and category_slug.strip().lower() in DEFAULT_CATEGORY_RATES:
        return DEFAULT_CATEGORY_RATES[category_slug.strip().lower()]

    return DEFAULT_FALLBACK_RATE


async def record_order_commissions(
    db: AsyncSession,
    order: Order,
    items: Optional[List[Any]] = None,
) -> List[CommissionRecord]:
    """
    Creates auditable CommissionRecord entries for each order item with PENDING status.
    """
    records: List[CommissionRecord] = []
    items_to_process = items if items is not None else getattr(order, "items", [])
    for item in items_to_process:
        record = CommissionRecord(
            order_id=order.id,
            order_item_id=item.id,
            agent_id=item.agent_id,
            basis_amount=item.total_price,
            rate=item.commission_rate,
            commission_amount=item.commission_amount,
            status=CommissionStatus.PENDING,
        )
        db.add(record)
        records.append(record)

    await db.flush()
    return records


async def settle_order_commissions(db: AsyncSession, order: Order) -> None:
    """
    Transitions commission records to EARNED upon verified order delivery.
    Idempotent operation: does nothing if already settled.
    """
    if order.commission_settled:
        return

    stmt = select(CommissionRecord).where(
        CommissionRecord.order_id == order.id,
        CommissionRecord.status == CommissionStatus.PENDING,
    )
    records = (await db.execute(stmt)).scalars().all()
    now_utc = datetime.now(timezone.utc)

    for rec in records:
        rec.status = CommissionStatus.EARNED
        rec.settled_at = now_utc

    order.commission_settled = True
    await db.flush()
    logger.info("Settled %d commission records for order %s", len(records), order.order_number)


async def cancel_order_commissions(db: AsyncSession, order: Order) -> None:
    """
    Marks commission records as CANCELLED upon order cancellation.
    """
    stmt = select(CommissionRecord).where(CommissionRecord.order_id == order.id)
    records = (await db.execute(stmt)).scalars().all()

    for rec in records:
        rec.status = CommissionStatus.CANCELLED

    await db.flush()
    logger.info("Cancelled %d commission records for order %s", len(records), order.order_number)


async def ensure_default_commission_rules(db: AsyncSession) -> List[CommissionRule]:
    """
    Ensures default category commission rules exist in the database.
    """
    from app.db.models.category import Category

    stmt = select(CommissionRule)
    existing = (await db.execute(stmt)).scalars().all()
    if existing:
        return list(existing)

    cat_stmt = select(Category)
    categories = (await db.execute(cat_stmt)).scalars().all()
    cat_by_slug = {c.slug: c for c in categories}

    rules: List[CommissionRule] = []
    for slug, rate in DEFAULT_CATEGORY_RATES.items():
        cat = cat_by_slug.get(slug)
        rule = CommissionRule(
            category_id=cat.id if cat else None,
            category_slug=slug,
            rule_type=CommissionRuleType.PERCENTAGE,
            rate=rate,
            is_active=True,
            description=f"Default commission rate for {slug}",
        )
        db.add(rule)
        rules.append(rule)

    await db.commit()
    for r in rules:
        await db.refresh(r)
    return rules
