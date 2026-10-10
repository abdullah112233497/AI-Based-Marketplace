from typing import List, Optional
import uuid
from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_user
from app.core.exceptions import AppException, NotFoundException
from app.db.models.product import Product
from app.db.models.user import User
from app.db.models.wishlist import WishlistItem
from app.db.session import get_db
from app.schemas.product import ProductSummary
from app.schemas.response import StandardApiResponse
from app.schemas.wishlist import WishlistCheckResponse, WishlistItemResponse

router = APIRouter()


@router.get(
    "",
    response_model=StandardApiResponse[List[WishlistItemResponse]],
    summary="Get Customer Wishlist",
    description="Returns all products saved by the authenticated user with live pricing and availability status.",
)
async def get_my_wishlist(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> StandardApiResponse[List[WishlistItemResponse]]:
    stmt = (
        select(WishlistItem)
        .where(WishlistItem.user_id == current_user.id)
        .order_by(WishlistItem.created_at.desc())
        .options(
            selectinload(WishlistItem.product).selectinload(Product.agent),
            selectinload(WishlistItem.product).selectinload(Product.category),
        )
    )
    items = (await db.execute(stmt)).scalars().all()

    response_items = []
    for it in items:
        prod_summary = ProductSummary.from_orm_model(it.product) if it.product else None
        response_items.append(
            WishlistItemResponse(
                id=it.id,
                userId=it.user_id,
                productId=it.product_id,
                createdAt=it.created_at,
                product=prod_summary,
            )
        )

    return StandardApiResponse(
        success=True,
        data=response_items,
        message=f"Retrieved {len(response_items)} wishlist items",
    )


@router.post(
    "/{product_id}",
    response_model=StandardApiResponse[WishlistItemResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Add Product to Wishlist",
    description="Adds a product to the authenticated user's wishlist idempotently.",
)
async def add_to_wishlist(
    product_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> StandardApiResponse[WishlistItemResponse]:
    try:
        p_uuid = uuid.UUID(product_id.strip())
    except (ValueError, TypeError):
        raise AppException(message="Invalid product ID", code="INVALID_PRODUCT_ID", status_code=400)

    # Validate product exists
    prod_stmt = select(Product).where(Product.id == p_uuid).options(
        selectinload(Product.agent),
        selectinload(Product.category),
    )
    product = (await db.execute(prod_stmt)).scalar_one_or_none()
    if not product:
        raise NotFoundException(message="Product not found", code="PRODUCT_NOT_FOUND")

    # Check if already in wishlist (Idempotency)
    existing_stmt = select(WishlistItem).where(
        WishlistItem.user_id == current_user.id,
        WishlistItem.product_id == p_uuid,
    )
    existing = (await db.execute(existing_stmt)).scalar_one_or_none()
    if existing:
        return StandardApiResponse(
            success=True,
            data=WishlistItemResponse(
                id=existing.id,
                userId=existing.user_id,
                productId=existing.product_id,
                createdAt=existing.created_at,
                product=ProductSummary.from_orm_model(product),
            ),
            message="Product already in wishlist",
        )

    item = WishlistItem(
        user_id=current_user.id,
        product_id=p_uuid,
    )
    db.add(item)
    await db.flush()
    await db.refresh(item)

    return StandardApiResponse(
        success=True,
        data=WishlistItemResponse(
            id=item.id,
            userId=item.user_id,
            productId=item.product_id,
            createdAt=item.created_at,
            product=ProductSummary.from_orm_model(product),
        ),
        message=f"Added '{product.title}' to wishlist",
    )


@router.delete(
    "/{product_id}",
    response_model=StandardApiResponse[dict],
    summary="Remove from Wishlist",
    description="Removes a product from the user's wishlist idempotently.",
)
async def remove_from_wishlist(
    product_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> StandardApiResponse[dict]:
    try:
        p_uuid = uuid.UUID(product_id.strip())
    except (ValueError, TypeError):
        raise AppException(message="Invalid product ID", code="INVALID_PRODUCT_ID", status_code=400)

    stmt = select(WishlistItem).where(
        WishlistItem.user_id == current_user.id,
        WishlistItem.product_id == p_uuid,
    )
    item = (await db.execute(stmt)).scalar_one_or_none()
    if item:
        await db.delete(item)
        await db.flush()

    return StandardApiResponse(
        success=True,
        data={"removed": True, "productId": str(p_uuid)},
        message="Removed from wishlist",
    )


@router.get(
    "/check/{product_id}",
    response_model=StandardApiResponse[WishlistCheckResponse],
    summary="Check Wishlist Status",
    description="Returns whether a specific product is saved in the user's wishlist.",
)
async def check_wishlist_status(
    product_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> StandardApiResponse[WishlistCheckResponse]:
    try:
        p_uuid = uuid.UUID(product_id.strip())
    except (ValueError, TypeError):
        return StandardApiResponse(
            success=True,
            data=WishlistCheckResponse(inWishlist=False, itemId=None),
            message="Check completed",
        )

    stmt = select(WishlistItem).where(
        WishlistItem.user_id == current_user.id,
        WishlistItem.product_id == p_uuid,
    )
    item = (await db.execute(stmt)).scalar_one_or_none()

    return StandardApiResponse(
        success=True,
        data=WishlistCheckResponse(
            inWishlist=item is not None,
            itemId=str(item.id) if item else None,
        ),
        message="Check completed",
    )
