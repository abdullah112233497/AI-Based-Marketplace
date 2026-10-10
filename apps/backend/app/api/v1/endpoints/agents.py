from datetime import datetime, timezone
from typing import Any, List, Optional
import uuid
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_user, require_approved_agent
from app.core.exceptions import AppException, ForbiddenException, NotFoundException
from app.core.logging import get_logger
from app.db.models.agent import Agent, AgentStatus
from app.db.models.brand import Brand
from app.db.models.category import Category
from app.db.models.order import Order, OrderItem, OrderStatus, PaymentStatus
from app.db.models.product import Product, ProductStatus
from app.db.models.user import User
from app.db.session import get_db
from app.schemas.agent import AgentProfileResponse
from app.schemas.order import OrderSummaryResponse, UpdateOrderStatusRequest, serialize_order_summary
from app.schemas.product import ProductCreateUpdateRequest, ProductSummary, ProductUpdatePartialRequest
from app.schemas.response import StandardApiResponse
from app.services.commission_service import cancel_order_commissions, settle_order_commissions
from app.services.inventory_service import restore_order_inventory
from app.services.spec_validator import validate_category_specs
from app.services.wallet_service import credit_order_cashback, refund_wallet_for_cancelled_order
from app.utils.slug import generate_unique_product_slug, slugify

logger = get_logger(__name__)

router = APIRouter()


# ==============================================================================
# Public Agent Endpoints
# ==============================================================================

@router.get(
    "/directory",
    response_model=StandardApiResponse[List[AgentProfileResponse]],
    summary="Public Agent Directory",
    description="Returns verified and approved vendor shops with city and keyword search filters.",
)
async def get_agent_directory(
    search: Optional[str] = Query(default=None, description="Search shop name or city"),
    city: Optional[str] = Query(default=None, description="Filter by city"),
    db: AsyncSession = Depends(get_db),
) -> StandardApiResponse[List[AgentProfileResponse]]:
    stmt = (
        select(Agent)
        .where(Agent.status == AgentStatus.APPROVED)
        .order_by(Agent.rating.desc(), Agent.created_at.desc())
    )

    if search and search.strip():
        term = f"%{search.strip().lower()}%"
        stmt = stmt.where(Agent.shop_name.ilike(term) | Agent.city.ilike(term))

    if city and city.strip():
        stmt = stmt.where(Agent.city.ilike(city.strip()))

    result = await db.execute(stmt)
    agents = result.scalars().all()

    agent_data = [AgentProfileResponse.from_orm_model(a) for a in agents]
    return StandardApiResponse(
        success=True,
        data=agent_data,
        message=f"Retrieved {len(agent_data)} approved agents",
    )


@router.get(
    "/public/{slug_or_id}",
    response_model=StandardApiResponse[dict],
    summary="Public Agent Shop",
    description="Returns public shop profile and active published listings for a vendor.",
)
async def get_public_agent_shop(
    slug_or_id: str,
    db: AsyncSession = Depends(get_db),
) -> StandardApiResponse[dict]:
    clean_val = slug_or_id.strip()

    stmt = select(Agent).where(
        (Agent.shop_slug == clean_val.lower()) | (Agent.shop_name.ilike(clean_val))
    )
    try:
        ag_uuid = uuid.UUID(clean_val)
        stmt = select(Agent).where(Agent.id == ag_uuid)
    except ValueError:
        pass

    result = await db.execute(stmt)
    agent = result.scalar_one_or_none()

    if not agent or agent.status != AgentStatus.APPROVED:
        raise NotFoundException(message="Agent shop not found", code="AGENT_NOT_FOUND")

    # Fetch agent's published products
    prod_stmt = (
        select(Product)
        .where(
            Product.agent_id == agent.id,
            Product.status == ProductStatus.PUBLISHED,
        )
        .order_by(Product.created_at.desc())
        .options(
            selectinload(Product.agent),
            selectinload(Product.category),
        )
    )
    products = (await db.execute(prod_stmt)).scalars().all()
    product_summaries = [ProductSummary.from_orm_model(p).model_dump(by_alias=True) for p in products]

    profile_dict = AgentProfileResponse.from_orm_model(agent).model_dump(by_alias=True)
    profile_dict["products"] = product_summaries

    return StandardApiResponse(
        success=True,
        data=profile_dict,
        message="Agent shop retrieved",
    )


# ==============================================================================
# Protected Agent Listing Management (Seller Portal)
# ==============================================================================

@router.get(
    "/overview",
    response_model=StandardApiResponse[dict],
    summary="Agent Dashboard Overview",
    description="Returns merchant overview metrics, stock warnings, and shop profile.",
)
async def get_agent_overview(
    current_user: User = Depends(require_approved_agent),
    db: AsyncSession = Depends(get_db),
) -> StandardApiResponse[dict]:
    agent = current_user.agent
    assert agent is not None

    # Total products and low stock products
    stmt_products = (
        select(Product)
        .where(Product.agent_id == agent.id, Product.status != ProductStatus.ARCHIVED)
    )
    my_products = (await db.execute(stmt_products)).scalars().all()

    low_stock = [
        ProductSummary.from_orm_model(p).model_dump(by_alias=True)
        for p in my_products
        if p.stock < 5
    ]

    # Orders containing this agent's products
    orders_stmt = (
        select(Order)
        .join(Order.items)
        .where(OrderItem.agent_id == agent.id)
        .distinct()
        .order_by(Order.created_at.desc())
        .options(selectinload(Order.items))
    )
    my_orders = (await db.execute(orders_stmt)).scalars().all()

    total_sales = sum(
        sum(item.total_price for item in ord.items if item.agent_id == agent.id)
        for ord in my_orders
        if ord.status == OrderStatus.DELIVERED
    )
    pending_orders_count = sum(1 for ord in my_orders if ord.status == OrderStatus.PENDING)

    return StandardApiResponse(
        success=True,
        data={
            "agent": AgentProfileResponse.from_orm_model(agent).model_dump(by_alias=True),
            "stats": {
                "totalProducts": len(my_products),
                "totalOrders": len(my_orders),
                "pendingOrders": pending_orders_count,
                "totalSales": total_sales,
                "rating": agent.rating,
            },
            "lowStockProducts": low_stock,
            "recentOrders": [serialize_order_summary(o).model_dump(by_alias=True) for o in my_orders[:5]],
        },
        message="Agent overview retrieved",
    )


@router.get(
    "/products",
    response_model=StandardApiResponse[List[ProductSummary]],
    summary="List Agent's Own Products",
    description="Returns all active listings belonging to the authenticated approved agent.",
)
async def list_agent_products(
    current_user: User = Depends(require_approved_agent),
    db: AsyncSession = Depends(get_db),
) -> StandardApiResponse[List[ProductSummary]]:
    agent = current_user.agent
    assert agent is not None

    stmt = (
        select(Product)
        .where(
            Product.agent_id == agent.id,
            Product.status != ProductStatus.ARCHIVED,
        )
        .order_by(Product.created_at.desc())
        .options(
            selectinload(Product.agent),
            selectinload(Product.category),
        )
    )
    result = await db.execute(stmt)
    products = result.scalars().all()

    items = [ProductSummary.from_orm_model(p) for p in products]
    return StandardApiResponse(
        success=True,
        data=items,
        message=f"Retrieved {len(items)} agent listings",
    )


@router.post(
    "/products",
    response_model=StandardApiResponse[ProductSummary],
    status_code=status.HTTP_201_CREATED,
    summary="Create Product Listing",
    description="Creates a new sellable listing for the authenticated approved agent with dynamic spec validation.",
)
async def create_product_listing(
    payload: ProductCreateUpdateRequest,
    current_user: User = Depends(require_approved_agent),
    db: AsyncSession = Depends(get_db),
) -> StandardApiResponse[ProductSummary]:
    agent = current_user.agent
    assert agent is not None

    # 1. Resolve Category
    clean_cat = payload.category_id.strip().lower()
    cat_stmt = select(Category).where(
        (Category.slug == clean_cat) | (Category.name.ilike(clean_cat))
    )
    try:
        cat_uuid = uuid.UUID(clean_cat)
        cat_stmt = select(Category).where(Category.id == cat_uuid)
    except ValueError:
        pass

    category = (await db.execute(cat_stmt)).scalar_one_or_none()
    if not category:
        raise NotFoundException(
            message=f"Category '{payload.category_id}' does not exist",
            code="CATEGORY_NOT_FOUND",
        )

    # 2. Validate dynamic specs against category schema
    validated_specs = validate_category_specs(category.spec_schema, payload.specs)

    # 3. Resolve or register Brand
    brand_name = payload.brand.strip()
    brand_slug = slugify(brand_name)
    brand_stmt = select(Brand).where((Brand.slug == brand_slug) | (Brand.name.ilike(brand_name)))
    brand = (await db.execute(brand_stmt)).scalar_one_or_none()
    if not brand:
        brand = Brand(name=brand_name, slug=brand_slug, is_active=True)
        db.add(brand)
        await db.flush()

    # 4. Generate unique readable slug
    product_slug = await generate_unique_product_slug(db, payload.title)

    # 5. Create product record
    new_product = Product(
        agent_id=agent.id,
        category_id=category.id,
        brand_id=brand.id,
        brand=brand.name,
        title=payload.title.strip(),
        slug=product_slug,
        description=payload.description.strip(),
        condition=payload.condition,
        condition_description=payload.condition_description.strip() if payload.condition_description else None,
        base_price=payload.base_price,
        compare_at_price=payload.compare_at_price,
        stock=payload.stock,
        status=payload.status,
        specs=validated_specs,
        images=payload.images,
        variants=[v.model_dump(by_alias=True) for v in payload.variants],
        rating=5.0,
        review_count=0,
    )
    db.add(new_product)
    agent.product_count += 1

    await db.flush()

    # Reload with relationships
    stmt_reload = (
        select(Product)
        .where(Product.id == new_product.id)
        .options(
            selectinload(Product.agent),
            selectinload(Product.category),
        )
    )
    loaded_product = (await db.execute(stmt_reload)).scalar_one()

    logger.info(
        "Agent %s published listing '%s' (ID: %s, Price: PKR %d)",
        agent.shop_name,
        loaded_product.title,
        str(loaded_product.id),
        loaded_product.base_price,
    )

    return StandardApiResponse(
        success=True,
        data=ProductSummary.from_orm_model(loaded_product),
        message="Product listing created successfully",
    )


@router.put(
    "/products/{product_id}",
    response_model=StandardApiResponse[ProductSummary],
    summary="Update Product Listing",
    description="Updates an existing product listing strictly owned by the authenticated approved agent.",
)
@router.patch(
    "/products/{product_id}",
    response_model=StandardApiResponse[ProductSummary],
    include_in_schema=False,
)
async def update_product_listing(
    product_id: str,
    payload: ProductUpdatePartialRequest,
    current_user: User = Depends(require_approved_agent),
    db: AsyncSession = Depends(get_db),
) -> StandardApiResponse[ProductSummary]:
    agent = current_user.agent
    assert agent is not None

    try:
        p_uuid = uuid.UUID(product_id.strip())
    except (ValueError, TypeError):
        raise NotFoundException(message="Invalid product ID", code="PRODUCT_NOT_FOUND")

    stmt = (
        select(Product)
        .where(Product.id == p_uuid)
        .options(
            selectinload(Product.agent),
            selectinload(Product.category),
        )
    )
    product = (await db.execute(stmt)).scalar_one_or_none()

    if not product:
        raise NotFoundException(message="Product not found", code="PRODUCT_NOT_FOUND")

    # Strict server-side ownership security check
    if product.agent_id != agent.id:
        raise ForbiddenException(
            message="Access denied: You do not own this product listing",
            code="FORBIDDEN",
        )

    # 1. Update Category if changing
    if payload.category_id is not None:
        clean_cat = payload.category_id.strip().lower()
        cat_stmt = select(Category).where(
            (Category.slug == clean_cat) | (Category.name.ilike(clean_cat))
        )
        try:
            cat_uuid = uuid.UUID(clean_cat)
            cat_stmt = select(Category).where(Category.id == cat_uuid)
        except ValueError:
            pass
        category = (await db.execute(cat_stmt)).scalar_one_or_none()
        if not category:
            raise NotFoundException(message="Category not found", code="CATEGORY_NOT_FOUND")
        product.category_id = category.id
        target_schema = category.spec_schema
    else:
        target_schema = product.category.spec_schema if product.category else None

    # 2. Dynamic Specs update
    if payload.specs is not None:
        validated_specs = validate_category_specs(target_schema, payload.specs)
        product.specs = validated_specs

    # 3. Brand update if provided
    if payload.brand is not None and payload.brand.strip():
        brand_name = payload.brand.strip()
        brand_slug = slugify(brand_name)
        brand_stmt = select(Brand).where((Brand.slug == brand_slug) | (Brand.name.ilike(brand_name)))
        brand = (await db.execute(brand_stmt)).scalar_one_or_none()
        if not brand:
            brand = Brand(name=brand_name, slug=brand_slug, is_active=True)
            db.add(brand)
            await db.flush()
        product.brand_id = brand.id
        product.brand = brand.name

    # 4. Title & Slug
    if payload.title is not None and payload.title.strip() and payload.title.strip() != product.title:
        product.slug = await generate_unique_product_slug(db, payload.title.strip(), exclude_product_id=product.id)
        product.title = payload.title.strip()

    old_price = product.base_price
    old_stock = product.stock

    if payload.description is not None:
        product.description = payload.description.strip()
    if payload.condition is not None:
        product.condition = payload.condition
    if payload.condition_description is not None:
        product.condition_description = payload.condition_description.strip()
    if payload.base_price is not None:
        product.base_price = payload.base_price
    if payload.compare_at_price is not None:
        product.compare_at_price = payload.compare_at_price
    if payload.stock is not None:
        product.stock = payload.stock
    if payload.status is not None:
        product.status = payload.status
    if payload.images is not None:
        product.images = payload.images
    if payload.variants is not None:
        product.variants = [v.model_dump(by_alias=True) for v in payload.variants]

    await db.flush()

    # Phase 5: Trigger Watchlist notifications & domain events on price drops or restocking
    from app.services.event_service import check_and_emit_price_change, check_and_emit_stock_change
    if product.base_price != old_price:
        await check_and_emit_price_change(db, product, old_price, product.base_price)
    if product.stock != old_stock:
        await check_and_emit_stock_change(db, product, old_stock, product.stock)

    await db.refresh(product)

    logger.info("Agent %s updated product %s (%s)", agent.shop_name, product.id, product.title)

    return StandardApiResponse(
        success=True,
        data=ProductSummary.from_orm_model(product),
        message="Product listing updated successfully",
    )


@router.delete(
    "/products/{product_id}",
    response_model=StandardApiResponse[dict],
    summary="Delete / Archive Product Listing",
    description="Soft-deletes/archives an agent's listing, removing it from public marketplace discovery.",
)
async def delete_product_listing(
    product_id: str,
    current_user: User = Depends(require_approved_agent),
    db: AsyncSession = Depends(get_db),
) -> StandardApiResponse[dict]:
    agent = current_user.agent
    assert agent is not None

    try:
        p_uuid = uuid.UUID(product_id.strip())
    except (ValueError, TypeError):
        raise NotFoundException(message="Invalid product ID", code="PRODUCT_NOT_FOUND")

    stmt = select(Product).where(Product.id == p_uuid)
    product = (await db.execute(stmt)).scalar_one_or_none()

    if not product:
        raise NotFoundException(message="Product not found", code="PRODUCT_NOT_FOUND")

    # Strict server-side ownership security check
    if product.agent_id != agent.id:
        raise ForbiddenException(
            message="Access denied: You do not own this product listing",
            code="FORBIDDEN",
        )

    # Soft delete via status = ARCHIVED
    product.status = ProductStatus.ARCHIVED
    if agent.product_count > 0:
        agent.product_count -= 1

    await db.flush()

    logger.info("Agent %s archived product %s (%s)", agent.shop_name, product.id, product.title)

    return StandardApiResponse(
        success=True,
        data={"id": str(product.id), "status": "ARCHIVED"},
        message="Product listing archived successfully",
    )


@router.get(
    "/orders",
    response_model=StandardApiResponse[List[OrderSummaryResponse]],
    summary="List Agent Orders",
    description="Returns all orders containing products fulfilled by the authenticated agent.",
)
async def list_agent_orders(
    current_user: User = Depends(require_approved_agent),
    db: AsyncSession = Depends(get_db),
) -> StandardApiResponse[List[OrderSummaryResponse]]:
    agent = current_user.agent
    assert agent is not None

    stmt = (
        select(Order)
        .join(Order.items)
        .where(OrderItem.agent_id == agent.id)
        .distinct()
        .order_by(Order.created_at.desc())
        .options(selectinload(Order.items))
    )
    orders = (await db.execute(stmt)).scalars().all()
    return StandardApiResponse(
        success=True,
        data=[serialize_order_summary(o) for o in orders],
        message=f"Retrieved {len(orders)} orders",
    )


@router.patch(
    "/orders/{order_id}/status",
    response_model=StandardApiResponse[OrderSummaryResponse],
    summary="Update Order Status",
    description="Transitions order fulfillment state (CONFIRMED, SHIPPED, DELIVERED, CANCELLED) with lifecycle validation.",
)
async def update_order_status(
    order_id: str,
    payload: UpdateOrderStatusRequest,
    current_user: User = Depends(require_approved_agent),
    db: AsyncSession = Depends(get_db),
) -> StandardApiResponse[OrderSummaryResponse]:
    agent = current_user.agent
    assert agent is not None

    clean_id = order_id.strip()
    stmt = (
        select(Order)
        .where((Order.order_number == clean_id) | (Order.order_number == clean_id.upper()))
        .options(selectinload(Order.items))
    )
    try:
        ord_uuid = uuid.UUID(clean_id)
        stmt = select(Order).where(Order.id == ord_uuid).options(selectinload(Order.items))
    except ValueError:
        pass

    order = (await db.execute(stmt)).scalar_one_or_none()
    if not order:
        raise NotFoundException(message="Order not found", code="ORDER_NOT_FOUND")

    # Multi-tenant verification: does agent own items in this order?
    agent_has_items = any(it.agent_id == agent.id for it in order.items)
    if not agent_has_items:
        raise ForbiddenException(message="Access denied: You do not own items in this order", code="FORBIDDEN")

    # Explicit allowed lifecycle transitions:
    # PENDING -> CONFIRMED, CANCELLED
    # CONFIRMED -> SHIPPED, CANCELLED
    # SHIPPED -> DELIVERED (SHIPPED cannot be cancelled directly in MVP)
    # DELIVERED -> terminal
    # CANCELLED -> terminal
    ALLOWED_TRANSITIONS = {
        OrderStatus.PENDING: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
        OrderStatus.CONFIRMED: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
        OrderStatus.SHIPPED: [OrderStatus.DELIVERED],
        OrderStatus.DELIVERED: [],
        OrderStatus.CANCELLED: [],
    }

    # If order is already in the target status, return idempotently
    if order.status == payload.status:
        return StandardApiResponse(
            success=True,
            data=serialize_order_summary(order),
            message=f"Order is already {order.status}",
        )

    allowed_targets = ALLOWED_TRANSITIONS.get(order.status, [])
    if payload.status not in allowed_targets:
        raise AppException(
            message=f"Invalid order status transition from {order.status} to {payload.status}",
            code="INVALID_STATUS_TRANSITION",
            status_code=400,
        )

    # Execute transition effects
    now_utc = datetime.now(timezone.utc)

    if payload.status == OrderStatus.SHIPPED:
        if payload.tracking_number:
            order.tracking_number = payload.tracking_number.strip()
        if payload.courier_name:
            order.courier_name = payload.courier_name.strip()

    elif payload.status == OrderStatus.DELIVERED:
        order.delivered_at = now_utc
        order.payment_status = PaymentStatus.PAID
        # Settle commissions and credit customer cashback rewards
        await settle_order_commissions(db, order)
        await credit_order_cashback(db, order)

    elif payload.status == OrderStatus.CANCELLED:
        order.cancelled_at = now_utc
        if payload.cancellation_reason:
            order.cancellation_reason = payload.cancellation_reason.strip()
        # Restore reserved inventory, cancel commissions, and refund wallet if applicable
        await restore_order_inventory(db, order)
        await cancel_order_commissions(db, order)
        await refund_wallet_for_cancelled_order(db, order)

    order.status = payload.status
    await db.flush()

    # Query fresh order with selectinload to ensure all scalar attributes and items are loaded
    fresh_stmt = (
        select(Order)
        .where(Order.id == order.id)
        .options(selectinload(Order.items))
    )
    fresh_order = (await db.execute(fresh_stmt)).scalar_one()

    logger.info(
        "Agent %s transitioned Order %s to %s",
        agent.shop_name,
        fresh_order.order_number,
        fresh_order.status,
    )

    return StandardApiResponse(
        success=True,
        data=serialize_order_summary(fresh_order),
        message=f"Order status updated to {fresh_order.status}",
    )
