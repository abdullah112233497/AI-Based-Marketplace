import logging
from typing import Any, Dict, Optional
import uuid
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.event import DomainEvent
from app.db.models.notification import Notification, NotificationType
from app.db.models.watchlist import ProductWatch

logger = logging.getLogger(__name__)


async def emit_domain_event(
    db: AsyncSession,
    event_type: str,
    entity_type: str,
    entity_id: str,
    payload: Dict[str, Any],
) -> DomainEvent:
    """
    Appends a transactional domain event to the outbox table within the current DB transaction.
    Ready for future decoupled ingestion by n8n or background event processors.
    """
    event = DomainEvent(
        event_type=event_type,
        entity_type=entity_type,
        entity_id=str(entity_id),
        payload=payload,
        status="PENDING",
    )
    db.add(event)
    await db.flush()
    logger.info("Emitted DomainEvent '%s' for %s:%s", event_type, entity_type, entity_id)
    return event


async def check_and_emit_price_change(
    db: AsyncSession,
    product: Any,
    old_price: int,
    new_price: int,
) -> Optional[DomainEvent]:
    """
    Detects if product price decreased and emits 'product.price_dropped'.
    Also generates in-app notifications for active watchlist subscribers.
    """
    if new_price >= old_price:
        return None

    drop_amount = old_price - new_price
    payload = {
        "productId": str(product.id),
        "productTitle": product.title,
        "oldPrice": old_price,
        "newPrice": new_price,
        "dropAmount": drop_amount,
    }

    event = await emit_domain_event(
        db,
        event_type="product.price_dropped",
        entity_type="product",
        entity_id=str(product.id),
        payload=payload,
    )

    # In-app alert for active watchers
    watch_stmt = select(ProductWatch).where(
        ProductWatch.product_id == product.id,
        ProductWatch.is_active == True,
        ProductWatch.watch_price_drop == True,
    )
    watchers = (await db.execute(watch_stmt)).scalars().all()
    for w in watchers:
        # Check target price threshold if configured
        if w.target_price is not None and new_price > w.target_price:
            continue

        notification = Notification(
            user_id=w.user_id,
            type=NotificationType.PRICE_DROP,
            title="Price Drop Alert!",
            message=f"'{product.title}' dropped from PKR {old_price:,} to PKR {new_price:,}!",
            related_entity_type="product",
            related_entity_id=str(product.id),
        )
        db.add(notification)
        # Update last seen snapshot
        w.last_seen_price = new_price

    await db.flush()
    return event


async def check_and_emit_stock_change(
    db: AsyncSession,
    product: Any,
    old_stock: int,
    new_stock: int,
) -> Optional[DomainEvent]:
    """
    Detects if out-of-stock product was replenished (0 -> >0) and emits 'product.back_in_stock'.
    Also alerts active watchlist subscribers.
    """
    if not (old_stock == 0 and new_stock > 0):
        return None

    payload = {
        "productId": str(product.id),
        "productTitle": product.title,
        "oldStock": old_stock,
        "newStock": new_stock,
    }

    event = await emit_domain_event(
        db,
        event_type="product.back_in_stock",
        entity_type="product",
        entity_id=str(product.id),
        payload=payload,
    )

    # In-app alert for active watchers
    watch_stmt = select(ProductWatch).where(
        ProductWatch.product_id == product.id,
        ProductWatch.is_active == True,
        ProductWatch.watch_back_in_stock == True,
    )
    watchers = (await db.execute(watch_stmt)).scalars().all()
    for w in watchers:
        notification = Notification(
            user_id=w.user_id,
            type=NotificationType.BACK_IN_STOCK,
            title="Back in Stock!",
            message=f"'{product.title}' is now back in stock with {new_stock} units available!",
            related_entity_type="product",
            related_entity_id=str(product.id),
        )
        db.add(notification)
        w.last_seen_stock = new_stock

    await db.flush()
    return event
