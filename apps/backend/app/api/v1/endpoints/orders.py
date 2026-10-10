from datetime import datetime, timezone
import random
from typing import List, Optional
import uuid
from fastapi import APIRouter, Depends, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_user
from app.core.exceptions import AppException, ForbiddenException, NotFoundException
from app.core.logging import get_logger
from app.db.models.cart import Cart, CartItem
from app.db.models.order import Order, OrderItem, OrderStatus, PaymentMethod, PaymentStatus
from app.db.models.product import Product, ProductStatus
from app.db.models.user import User, UserRole
from app.db.session import get_db
from app.schemas.order import (
    CheckoutItemInput,
    OrderItemResponse,
    OrderCreateRequest,
    OrderPreviewItemResponse,
    OrderPreviewRequest,
    OrderPreviewResponse,
    OrderSummaryResponse,
    serialize_order_summary,
)
from app.schemas.response import StandardApiResponse
from app.services.commission_service import (
    get_category_commission_rate,
    record_order_commissions,
)
from app.services.inventory_service import lock_and_verify_inventory
from app.services.pricing_service import (
    calculate_cashback_reward,
    calculate_shipping_fee,
    calculate_wallet_discount,
)
from app.services.wallet_service import (
    deduct_wallet_for_order,
    get_user_wallet_balance,
)

logger = get_logger(__name__)

router = APIRouter()


def generate_unique_order_number() -> str:
    """Generates user-friendly unique order numbers like TM-2026-837194."""
    year = datetime.now(timezone.utc).year
    rnd = random.randint(100000, 999999)
    return f"TM-{year}-{rnd}"


@router.post(
    "/preview",
    response_model=StandardApiResponse[OrderPreviewResponse],
    summary="Order Checkout Preview",
    description="Recalculates prices, verifies stock availability, and computes accurate subtotal, shipping, and wallet discounts on the server.",
)
async def preview_order(
    payload: OrderPreviewRequest,
    current_user: Optional[User] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> StandardApiResponse[OrderPreviewResponse]:
    if not payload.items:
        raise AppException(message="Cart is empty", code="EMPTY_CART", status_code=400)

    # Resolve product details and verify stock
    p_uuids = []
    qty_map = {}
    for it in payload.items:
        try:
            p_uuid = uuid.UUID(it.product_id.strip())
            p_uuids.append(p_uuid)
            qty_map[p_uuid] = it.quantity
        except (ValueError, TypeError):
            raise AppException(message=f"Invalid product ID: {it.product_id}", code="INVALID_PRODUCT_ID", status_code=400)

    stmt = (
        select(Product)
        .where(Product.id.in_(p_uuids))
        .options(selectinload(Product.agent))
    )
    products = (await db.execute(stmt)).scalars().all()
    prod_map = {p.id: p for p in products}

    subtotal = 0
    preview_items = []

    for it in payload.items:
        p_uuid = uuid.UUID(it.product_id.strip())
        prod = prod_map.get(p_uuid)
        if not prod:
            raise AppException(message=f"Product {it.product_id} not found", code="PRODUCT_NOT_FOUND", status_code=400)

        if prod.status != ProductStatus.PUBLISHED:
            raise AppException(message=f"'{prod.title}' is not available", code="PRODUCT_UNAVAILABLE", status_code=400)

        item_total = prod.base_price * it.quantity
        subtotal += item_total
        first_img = prod.images[0] if (prod.images and len(prod.images) > 0) else None
        agent_name = prod.agent.shop_name if prod.agent else "Verified Merchant"

        preview_items.append(
            OrderPreviewItemResponse(
                productId=str(prod.id),
                title=prod.title,
                image=first_img,
                price=prod.base_price,
                quantity=it.quantity,
                itemTotal=item_total,
                agentId=str(prod.agent_id),
                agentShopName=agent_name,
                stock=prod.stock,
            )
        )

    shipping_fee = calculate_shipping_fee(preview_items)
    user_wallet_bal = 0
    if current_user:
        user_wallet_bal = await get_user_wallet_balance(db, current_user.id)

    wallet_discount = calculate_wallet_discount(subtotal, user_wallet_bal, payload.apply_wallet_amount)
    grand_total = max(0, subtotal + shipping_fee - wallet_discount)

    data = OrderPreviewResponse(
        items=preview_items,
        subtotal=subtotal,
        shippingFee=shipping_fee,
        walletDiscount=wallet_discount,
        grandTotal=grand_total,
        totalAmount=grand_total,
        estimatedReward=calculate_cashback_reward(subtotal),
    )
    return StandardApiResponse(success=True, data=data, message="Order preview calculated")


@router.post(
    "",
    response_model=StandardApiResponse[OrderSummaryResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Place Order",
    description="Atomically creates an order within a database transaction using row-level inventory locking (SELECT ... FOR UPDATE).",
)
async def create_order(
    payload: OrderCreateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> StandardApiResponse[OrderSummaryResponse]:
    items_to_process = payload.items
    if not items_to_process:
        cart_stmt = (
            select(Cart)
            .where(Cart.user_id == current_user.id)
            .options(selectinload(Cart.items))
        )
        cart = (await db.execute(cart_stmt)).scalar_one_or_none()
        if not cart or not cart.items:
            raise AppException(message="Order must contain at least one item", code="EMPTY_CART", status_code=400)
        items_to_process = [
            CheckoutItemInput(
                productId=str(ci.product_id),
                quantity=ci.quantity,
                variantId=ci.variant_id,
            )
            for ci in cart.items
        ]

    # 1. Acquire row-level pessimistic locks & verify stock atomically
    item_dicts = [it.model_dump(by_alias=True) for it in items_to_process]
    locked_products = await lock_and_verify_inventory(db, item_dicts)

    # 2. Recalculate subtotal on server from authoritative database records
    subtotal = 0
    order_items_to_create = []

    for it in items_to_process:
        p_uuid = uuid.UUID(it.product_id.strip())
        prod = locked_products[p_uuid]
        item_total = prod.base_price * it.quantity
        subtotal += item_total

        # Commission rate snapshot
        cat_slug = prod.category.slug if prod.category else None
        comm_rate = await get_category_commission_rate(db, prod.category_id, cat_slug)
        comm_amount = int(item_total * comm_rate)

        first_img = prod.images[0] if (prod.images and len(prod.images) > 0) else None
        agent_name = prod.agent.shop_name if prod.agent else "Verified Merchant"

        order_items_to_create.append(
            {
                "product_id": prod.id,
                "agent_id": prod.agent_id,
                "agent_shop_name": agent_name,
                "product_title": prod.title,
                "product_slug": prod.slug,
                "product_image": first_img,
                "variant_id": it.variant_id,
                "unit_price": prod.base_price,
                "quantity": it.quantity,
                "total_price": item_total,
                "commission_rate": comm_rate,
                "commission_amount": comm_amount,
                "specs_snapshot": prod.specs or {},
            }
        )

    shipping_fee = calculate_shipping_fee(order_items_to_create)

    # 3. Handle Wallet reward redemption if requested
    available_wallet = await get_user_wallet_balance(db, current_user.id)
    applied_wallet = calculate_wallet_discount(subtotal, available_wallet, payload.apply_wallet_amount)
    grand_total = max(0, subtotal + shipping_fee - applied_wallet)

    order_num = generate_unique_order_number()

    # 4. Create Order record
    new_order = Order(
        order_number=order_num,
        customer_id=current_user.id,
        customer_name=payload.shipping_address.full_name.strip(),
        customer_phone=payload.shipping_address.phone.strip(),
        status=OrderStatus.PENDING,
        payment_method=payload.payment_method,
        payment_status=PaymentStatus.PENDING,
        shipping_address=payload.shipping_address.model_dump(by_alias=True),
        subtotal=subtotal,
        shipping_fee=shipping_fee,
        wallet_discount=applied_wallet,
        total_amount=grand_total,
        notes=payload.notes.strip() if payload.notes else None,
    )
    db.add(new_order)
    await db.flush()

    # 5. Create OrderItem snapshot records
    created_items = []
    for item_data in order_items_to_create:
        item_obj = OrderItem(
            order_id=new_order.id,
            **item_data,
        )
        db.add(item_obj)
        created_items.append(item_obj)

    await db.flush()

    # 6. Record expected commission records (PENDING)
    await record_order_commissions(db, new_order, items=created_items)

    # 7. Deduct wallet rewards if used
    if applied_wallet > 0:
        await deduct_wallet_for_order(
            db,
            user_id=current_user.id,
            order_id=new_order.id,
            order_number=new_order.order_number,
            amount=applied_wallet,
        )

    # 8. Clear purchased products from the user's persistent cart
    cart_stmt = (
        select(Cart)
        .where(Cart.user_id == current_user.id)
        .options(selectinload(Cart.items))
    )
    user_cart = (await db.execute(cart_stmt)).scalar_one_or_none()
    if user_cart:
        purchased_pids = set(locked_products.keys())
        for c_item in list(user_cart.items):
            if c_item.product_id in purchased_pids:
                await db.delete(c_item)

    await db.flush()
    logger.info(
        "Order %s successfully placed by customer %s for PKR %d (items: %d)",
        new_order.order_number,
        current_user.email,
        new_order.total_amount,
        len(created_items),
    )

    return StandardApiResponse(
        success=True,
        data=serialize_order_summary(new_order, items_override=created_items),
        message="Order placed successfully",
    )


@router.get(
    "/me",
    response_model=StandardApiResponse[List[OrderSummaryResponse]],
    summary="Customer Order History",
    description="Returns all orders placed by the authenticated customer.",
)
@router.get(
    "/my-orders",
    response_model=StandardApiResponse[List[OrderSummaryResponse]],
    include_in_schema=False,
)
async def get_my_orders(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> StandardApiResponse[List[OrderSummaryResponse]]:
    stmt = (
        select(Order)
        .where(Order.customer_id == current_user.id)
        .order_by(Order.created_at.desc())
        .options(
            selectinload(Order.items),
        )
    )
    result = await db.execute(stmt)
    orders = result.scalars().all()

    return StandardApiResponse(
        success=True,
        data=[serialize_order_summary(o) for o in orders],
        message=f"Retrieved {len(orders)} orders",
    )


@router.get(
    "/{order_id_or_number}",
    response_model=StandardApiResponse[OrderSummaryResponse],
    summary="Get Order Detail",
    description="Retrieves order information with strict multi-tenant authorization (customer owner, fulfilled agent, or admin).",
)
async def get_order_detail(
    order_id_or_number: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> StandardApiResponse[OrderSummaryResponse]:
    clean_val = order_id_or_number.strip()
    stmt = (
        select(Order)
        .where((Order.order_number == clean_val) | (Order.order_number == clean_val.upper()))
        .options(selectinload(Order.items))
    )

    try:
        ord_uuid = uuid.UUID(clean_val)
        stmt = select(Order).where(Order.id == ord_uuid).options(selectinload(Order.items))
    except ValueError:
        pass

    order = (await db.execute(stmt)).scalar_one_or_none()
    if not order:
        raise NotFoundException(message="Order not found", code="ORDER_NOT_FOUND")

    # Multi-tenant authorization check
    is_customer_owner = order.customer_id == current_user.id
    is_admin = current_user.role == UserRole.ADMIN
    is_agent_owner = False
    if current_user.role == UserRole.AGENT and current_user.agent:
        is_agent_owner = any(item.agent_id == current_user.agent.id for item in order.items)

    if not (is_customer_owner or is_admin or is_agent_owner):
        raise ForbiddenException(message="Access denied: You cannot view this order", code="FORBIDDEN")

    return StandardApiResponse(
        success=True,
        data=serialize_order_summary(order),
        message="Order retrieved",
    )
