from typing import Dict, List
import uuid
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.exceptions import AppException
from app.core.logging import get_logger
from app.db.models.agent import AgentStatus
from app.db.models.order import Order
from app.db.models.product import Product, ProductStatus

logger = get_logger(__name__)


async def lock_and_verify_inventory(
    db: AsyncSession,
    items: List[dict],
) -> Dict[uuid.UUID, Product]:
    """
    Acquires row-level pessimistic locks (SELECT ... FOR UPDATE) on all requested products,
    validates active publishing status, approved agent state, and verifies stock availability.
    Deducts stock atomically within the calling transaction.
    """
    if not items:
        raise AppException(message="Checkout item list is empty", code="EMPTY_CART", status_code=400)

    # Map requested quantities by product UUID
    requested_map: Dict[uuid.UUID, int] = {}
    for it in items:
        raw_id = it.get("productId") or it.get("product_id")
        try:
            p_uuid = uuid.UUID(str(raw_id).strip())
        except (ValueError, TypeError):
            raise AppException(
                message=f"Invalid product ID: {raw_id}",
                code="INVALID_PRODUCT_ID",
                status_code=400,
            )
        qty = int(it.get("quantity", 1))
        if qty <= 0:
            raise AppException(
                message=f"Invalid quantity {qty} for product {raw_id}",
                code="INVALID_QUANTITY",
                status_code=400,
            )
        requested_map[p_uuid] = requested_map.get(p_uuid, 0) + qty

    p_uuids = list(requested_map.keys())

    # Execute row-level locking with SELECT ... FOR UPDATE
    stmt = (
        select(Product)
        .where(Product.id.in_(p_uuids))
        .with_for_update()
        .options(
            selectinload(Product.agent),
            selectinload(Product.category),
        )
    )
    result = await db.execute(stmt)
    products = result.scalars().all()
    product_dict: Dict[uuid.UUID, Product] = {p.id: p for p in products}

    # Verify each requested product
    for p_id, requested_qty in requested_map.items():
        product = product_dict.get(p_id)
        if not product:
            raise AppException(
                message=f"Product '{p_id}' not found in catalog",
                code="PRODUCT_NOT_FOUND",
                status_code=400,
            )

        if product.status != ProductStatus.PUBLISHED:
            raise AppException(
                message=f"Product '{product.title}' is currently unavailable ({product.status})",
                code="PRODUCT_UNAVAILABLE",
                status_code=400,
            )

        if not product.agent or product.agent.status != AgentStatus.APPROVED:
            raise AppException(
                message=f"Merchant for '{product.title}' is not active",
                code="AGENT_UNAVAILABLE",
                status_code=400,
            )

        if product.stock < requested_qty:
            raise AppException(
                message=f"Insufficient inventory for '{product.title}'. Requested: {requested_qty}, In stock: {product.stock}",
                code="OUT_OF_STOCK",
                status_code=400,
                details={
                    "productId": str(product.id),
                    "productTitle": product.title,
                    "availableStock": product.stock,
                    "requestedQuantity": requested_qty,
                },
            )

        # Atomically deduct locked stock
        product.stock -= requested_qty
        logger.info(
            "Deducted %d units for '%s' (ID: %s, remaining stock: %d)",
            requested_qty,
            product.title,
            product.id,
            product.stock,
        )

    await db.flush()
    return product_dict


async def restore_order_inventory(db: AsyncSession, order: Order) -> None:
    """
    Restores deducted product inventory upon order cancellation.
    Strictly idempotent: does nothing if order.stock_restored is already True.
    """
    if order.stock_restored:
        logger.info("Order %s stock already restored, skipping", order.order_number)
        return

    for item in order.items:
        if not item.product_id:
            continue

        stmt = select(Product).where(Product.id == item.product_id).with_for_update()
        product = (await db.execute(stmt)).scalar_one_or_none()
        if product:
            product.stock += item.quantity
            logger.info(
                "Restored %d units to '%s' (new stock: %d) from cancelled order %s",
                item.quantity,
                product.title,
                product.stock,
                order.order_number,
            )

    order.stock_restored = True
    await db.flush()
