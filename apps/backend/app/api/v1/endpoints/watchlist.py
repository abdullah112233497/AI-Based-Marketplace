from typing import List, Optional
import uuid
from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_user
from app.core.exceptions import AppException, ForbiddenException, NotFoundException
from app.db.models.product import Product
from app.db.models.user import User
from app.db.models.watchlist import ProductWatch
from app.db.session import get_db
from app.schemas.product import ProductSummary
from app.schemas.response import StandardApiResponse
from app.schemas.watchlist import (
    ProductWatchCreateRequest,
    ProductWatchResponse,
    ProductWatchUpdateRequest,
)

router = APIRouter()


@router.get(
    "",
    response_model=StandardApiResponse[List[ProductWatchResponse]],
    summary="Get Customer Watchlist",
    description="Returns all active product alert subscriptions (price drops, back-in-stock) for the authenticated user.",
)
async def get_my_watchlist(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> StandardApiResponse[List[ProductWatchResponse]]:
    stmt = (
        select(ProductWatch)
        .where(ProductWatch.user_id == current_user.id)
        .order_by(ProductWatch.created_at.desc())
        .options(
            selectinload(ProductWatch.product).selectinload(Product.agent),
            selectinload(ProductWatch.product).selectinload(Product.category),
        )
    )
    watches = (await db.execute(stmt)).scalars().all()

    items = []
    for w in watches:
        prod_summary = ProductSummary.from_orm_model(w.product) if w.product else None
        items.append(
            ProductWatchResponse(
                id=w.id,
                userId=w.user_id,
                productId=w.product_id,
                watchPriceDrop=w.watch_price_drop,
                watchBackInStock=w.watch_back_in_stock,
                targetPrice=w.target_price,
                lastSeenPrice=w.last_seen_price,
                lastSeenStock=w.last_seen_stock,
                isActive=w.is_active,
                createdAt=w.created_at,
                updatedAt=w.updated_at,
                product=prod_summary,
            )
        )

    return StandardApiResponse(
        success=True,
        data=items,
        message=f"Retrieved {len(items)} product watch subscriptions",
    )


@router.post(
    "",
    response_model=StandardApiResponse[ProductWatchResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Subscribe to Product Alerts",
    description="Creates or activates a product alert subscription for price drop or back-in-stock notifications.",
)
async def create_or_update_watch(
    payload: ProductWatchCreateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> StandardApiResponse[ProductWatchResponse]:
    try:
        p_uuid = uuid.UUID(payload.product_id.strip())
    except (ValueError, TypeError):
        raise AppException(message="Invalid product ID", code="INVALID_PRODUCT_ID", status_code=400)

    prod_stmt = select(Product).where(Product.id == p_uuid).options(
        selectinload(Product.agent),
        selectinload(Product.category),
    )
    product = (await db.execute(prod_stmt)).scalar_one_or_none()
    if not product:
        raise NotFoundException(message="Product not found", code="PRODUCT_NOT_FOUND")

    # Check for existing subscription (upsert)
    stmt = select(ProductWatch).where(
        ProductWatch.user_id == current_user.id,
        ProductWatch.product_id == p_uuid,
    )
    watch = (await db.execute(stmt)).scalar_one_or_none()

    if not watch:
        watch = ProductWatch(
            user_id=current_user.id,
            product_id=p_uuid,
            watch_price_drop=payload.watch_price_drop,
            watch_back_in_stock=payload.watch_back_in_stock,
            target_price=payload.target_price,
            last_seen_price=product.base_price,
            last_seen_stock=product.stock,
            is_active=True,
        )
        db.add(watch)
    else:
        watch.watch_price_drop = payload.watch_price_drop
        watch.watch_back_in_stock = payload.watch_back_in_stock
        watch.target_price = payload.target_price
        watch.last_seen_price = product.base_price
        watch.last_seen_stock = product.stock
        watch.is_active = True

    await db.flush()
    await db.refresh(watch)

    return StandardApiResponse(
        success=True,
        data=ProductWatchResponse(
            id=watch.id,
            userId=watch.user_id,
            productId=watch.product_id,
            watchPriceDrop=watch.watch_price_drop,
            watchBackInStock=watch.watch_back_in_stock,
            targetPrice=watch.target_price,
            lastSeenPrice=watch.last_seen_price,
            lastSeenStock=watch.last_seen_stock,
            isActive=watch.is_active,
            createdAt=watch.created_at,
            updatedAt=watch.updated_at,
            product=ProductSummary.from_orm_model(product),
        ),
        message=f"Alert subscription active for '{product.title}'",
    )


@router.patch(
    "/{watch_id}",
    response_model=StandardApiResponse[ProductWatchResponse],
    summary="Update Watch Subscription",
    description="Modifies alert preferences or toggles active status with ownership verification.",
)
async def update_watch_subscription(
    watch_id: str,
    payload: ProductWatchUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> StandardApiResponse[ProductWatchResponse]:
    try:
        w_uuid = uuid.UUID(watch_id.strip())
    except (ValueError, TypeError):
        raise AppException(message="Invalid watch ID", code="INVALID_WATCH_ID", status_code=400)

    stmt = (
        select(ProductWatch)
        .where(ProductWatch.id == w_uuid)
        .options(
            selectinload(ProductWatch.product).selectinload(Product.agent),
            selectinload(ProductWatch.product).selectinload(Product.category),
        )
    )
    watch = (await db.execute(stmt)).scalar_one_or_none()
    if not watch:
        raise NotFoundException(message="Watch subscription not found", code="WATCH_NOT_FOUND")

    if watch.user_id != current_user.id:
        raise ForbiddenException(message="Access denied: You do not own this watch subscription", code="FORBIDDEN")

    if payload.watch_price_drop is not None:
        watch.watch_price_drop = payload.watch_price_drop
    if payload.watch_back_in_stock is not None:
        watch.watch_back_in_stock = payload.watch_back_in_stock
    if payload.target_price is not None:
        watch.target_price = payload.target_price
    if payload.is_active is not None:
        watch.is_active = payload.is_active

    await db.flush()
    await db.refresh(watch)

    prod_summary = ProductSummary.from_orm_model(watch.product) if watch.product else None

    return StandardApiResponse(
        success=True,
        data=ProductWatchResponse(
            id=watch.id,
            userId=watch.user_id,
            productId=watch.product_id,
            watchPriceDrop=watch.watch_price_drop,
            watchBackInStock=watch.watch_back_in_stock,
            targetPrice=watch.target_price,
            lastSeenPrice=watch.last_seen_price,
            lastSeenStock=watch.last_seen_stock,
            isActive=watch.is_active,
            createdAt=watch.created_at,
            updatedAt=watch.updated_at,
            product=prod_summary,
        ),
        message="Alert preferences updated",
    )


@router.delete(
    "/{watch_id}",
    response_model=StandardApiResponse[dict],
    summary="Delete Watch Subscription",
    description="Deletes an alert subscription with ownership validation.",
)
async def delete_watch_subscription(
    watch_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> StandardApiResponse[dict]:
    try:
        w_uuid = uuid.UUID(watch_id.strip())
    except (ValueError, TypeError):
        raise AppException(message="Invalid watch ID", code="INVALID_WATCH_ID", status_code=400)

    stmt = select(ProductWatch).where(ProductWatch.id == w_uuid)
    watch = (await db.execute(stmt)).scalar_one_or_none()
    if not watch:
        raise NotFoundException(message="Watch subscription not found", code="WATCH_NOT_FOUND")

    if watch.user_id != current_user.id:
        raise ForbiddenException(message="Access denied: You do not own this watch subscription", code="FORBIDDEN")

    await db.delete(watch)
    await db.flush()

    return StandardApiResponse(
        success=True,
        data={"deleted": True, "id": str(w_uuid)},
        message="Watch subscription deleted",
    )
