from typing import Optional
import uuid
from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_user
from app.core.exceptions import AppException, NotFoundException
from app.core.logging import get_logger
from app.db.models.agent import AgentStatus
from app.db.models.cart import Cart, CartItem
from app.db.models.product import Product, ProductStatus
from app.db.models.user import User
from app.db.session import get_db
from app.schemas.cart import (
    CartItemAddRequest,
    CartItemResponse,
    CartItemUpdateRequest,
    CartResponse,
)
from app.schemas.response import StandardApiResponse

logger = get_logger(__name__)

router = APIRouter()


async def get_or_create_user_cart(db: AsyncSession, user_id: uuid.UUID) -> Cart:
    """
    Retrieves or initializes the persistent database cart for an authenticated user.
    """
    stmt = (
        select(Cart)
        .where(Cart.user_id == user_id)
        .options(
            selectinload(Cart.items).selectinload(CartItem.product).selectinload(Product.agent),
        )
    )
    cart = (await db.execute(stmt)).scalar_one_or_none()
    if not cart:
        cart = Cart(user_id=user_id)
        db.add(cart)
        await db.flush()
        await db.refresh(cart, ["items"])
    return cart


def build_cart_response(cart: Cart) -> CartResponse:
    """
    Builds a CartResponse from Cart ORM model, computing live subtotal and available stock.
    """
    items_response = []
    subtotal = 0
    total_qty = 0

    for item in cart.items:
        prod = item.product
        if not prod or prod.status == ProductStatus.ARCHIVED:
            continue

        item_total = prod.base_price * item.quantity
        subtotal += item_total
        total_qty += item.quantity

        first_image = prod.images[0] if (prod.images and len(prod.images) > 0) else None
        agent_name = prod.agent.shop_name if prod.agent else "Verified Merchant"

        items_response.append(
            CartItemResponse(
                id=str(item.id),
                productId=str(prod.id),
                variantId=item.variant_id,
                title=prod.title,
                image=first_image,
                price=prod.base_price,
                quantity=item.quantity,
                stock=prod.stock,
                agentId=str(prod.agent_id),
                agentShopName=agent_name,
                itemTotal=item_total,
            )
        )

    return CartResponse(
        id=str(cart.id),
        items=items_response,
        totalItems=total_qty,
        subtotal=subtotal,
    )


@router.get(
    "",
    response_model=StandardApiResponse[CartResponse],
    summary="Get Customer Cart",
    description="Returns the authenticated customer's persistent shopping cart with live stock and pricing.",
)
async def get_cart(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> StandardApiResponse[CartResponse]:
    cart = await get_or_create_user_cart(db, current_user.id)
    return StandardApiResponse(
        success=True,
        data=build_cart_response(cart),
        message="Shopping cart retrieved",
    )


@router.post(
    "/items",
    response_model=StandardApiResponse[CartResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Add Item to Cart",
    description="Adds a product to the user's cart after validating stock and seller approval.",
)
async def add_item_to_cart(
    payload: CartItemAddRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> StandardApiResponse[CartResponse]:
    try:
        p_uuid = uuid.UUID(payload.product_id.strip())
    except (ValueError, TypeError):
        raise AppException(message="Invalid product ID", code="INVALID_PRODUCT_ID", status_code=400)

    prod_stmt = (
        select(Product)
        .where(Product.id == p_uuid)
        .options(selectinload(Product.agent))
    )
    product = (await db.execute(prod_stmt)).scalar_one_or_none()

    if not product or product.status != ProductStatus.PUBLISHED:
        raise AppException(
            message="This product listing is no longer available for purchase",
            code="PRODUCT_UNAVAILABLE",
            status_code=400,
        )

    if not product.agent or product.agent.status != AgentStatus.APPROVED:
        raise AppException(
            message="The merchant for this listing is not active",
            code="AGENT_UNAVAILABLE",
            status_code=400,
        )

    if product.stock <= 0:
        raise AppException(
            message=f"'{product.title}' is currently out of stock",
            code="OUT_OF_STOCK",
            status_code=400,
        )

    cart = await get_or_create_user_cart(db, current_user.id)

    # Check if item already exists in cart
    existing_item = next(
        (it for it in cart.items if it.product_id == product.id and it.variant_id == payload.variant_id),
        None,
    )

    if existing_item:
        new_qty = min(existing_item.quantity + payload.quantity, product.stock)
        existing_item.quantity = new_qty
    else:
        qty_to_add = min(payload.quantity, product.stock)
        new_item = CartItem(
            cart_id=cart.id,
            product_id=product.id,
            variant_id=payload.variant_id,
            quantity=qty_to_add,
        )
        db.add(new_item)
        cart.items.append(new_item)

    await db.flush()
    # Reload cart with full relationships
    cart = await get_or_create_user_cart(db, current_user.id)

    return StandardApiResponse(
        success=True,
        data=build_cart_response(cart),
        message=f"Added '{product.title}' to cart",
    )


@router.patch(
    "/items/{item_id}",
    response_model=StandardApiResponse[CartResponse],
    summary="Update Cart Item Quantity",
    description="Updates the quantity of an existing item in the authenticated user's cart.",
)
async def update_cart_item(
    item_id: str,
    payload: CartItemUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> StandardApiResponse[CartResponse]:
    cart = await get_or_create_user_cart(db, current_user.id)

    try:
        item_uuid = uuid.UUID(item_id.strip())
    except (ValueError, TypeError):
        raise AppException(message="Invalid cart item ID", code="INVALID_ITEM_ID", status_code=400)

    target_item = next((it for it in cart.items if it.id == item_uuid), None)
    if not target_item:
        raise NotFoundException(message="Item not found in your cart", code="CART_ITEM_NOT_FOUND")

    if payload.quantity <= 0:
        if target_item in cart.items:
            cart.items.remove(target_item)
        await db.delete(target_item)
    else:
        stock = target_item.product.stock if target_item.product else 0
        if payload.quantity > stock:
            raise AppException(
                message=f"Requested quantity ({payload.quantity}) exceeds available stock ({stock})",
                code="INSUFFICIENT_STOCK",
                status_code=400,
            )
        target_item.quantity = payload.quantity

    await db.flush()

    return StandardApiResponse(
        success=True,
        data=build_cart_response(cart),
        message="Cart item updated",
    )


@router.delete(
    "/items/{item_id}",
    response_model=StandardApiResponse[CartResponse],
    summary="Remove Item from Cart",
    description="Deletes a specific line item from the user's cart.",
)
async def remove_cart_item(
    item_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> StandardApiResponse[CartResponse]:
    cart = await get_or_create_user_cart(db, current_user.id)

    try:
        item_uuid = uuid.UUID(item_id.strip())
    except (ValueError, TypeError):
        raise AppException(message="Invalid cart item ID", code="INVALID_ITEM_ID", status_code=400)

    target_item = next((it for it in cart.items if it.id == item_uuid), None)
    if not target_item:
        raise NotFoundException(message="Item not found in your cart", code="CART_ITEM_NOT_FOUND")

    if target_item in cart.items:
        cart.items.remove(target_item)
    await db.delete(target_item)
    await db.flush()

    return StandardApiResponse(
        success=True,
        data=build_cart_response(cart),
        message="Item removed from cart",
    )


@router.delete(
    "",
    response_model=StandardApiResponse[CartResponse],
    summary="Clear Shopping Cart",
    description="Empties all line items from the authenticated user's cart.",
)
async def clear_cart(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> StandardApiResponse[CartResponse]:
    cart = await get_or_create_user_cart(db, current_user.id)
    for it in list(cart.items):
        await db.delete(it)
    cart.items.clear()
    await db.flush()

    return StandardApiResponse(
        success=True,
        data=build_cart_response(cart),
        message="Cart emptied",
    )
