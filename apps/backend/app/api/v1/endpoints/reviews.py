from typing import Optional
import uuid
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_user
from app.core.exceptions import AppException, ForbiddenException, NotFoundException
from app.db.models.notification import NotificationType
from app.db.models.product import Product
from app.db.models.review import Review, ReviewStatus
from app.db.models.user import User
from app.db.session import get_db
from app.schemas.response import StandardApiResponse
from app.schemas.review import (
    PaginatedReviewsResponse,
    ReviewCreateRequest,
    ReviewEligibilityResponse,
    ReviewResponse,
    ReviewUpdateRequest,
)
from app.services.event_service import emit_domain_event
from app.services.notification_service import create_notification
from app.services.review_service import (
    check_user_review_eligibility,
    recalculate_product_and_agent_ratings,
)

router = APIRouter()


@router.get(
    "/products/{product_id}/reviews",
    response_model=StandardApiResponse[PaginatedReviewsResponse],
    summary="Get Product Reviews",
    description="Returns public verified customer reviews and overall rating metrics for a product.",
)
async def get_product_reviews(
    product_id: str,
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=10, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
) -> StandardApiResponse[PaginatedReviewsResponse]:
    try:
        p_uuid = uuid.UUID(product_id.strip())
    except (ValueError, TypeError):
        # Support slug lookup as well
        prod_slug_stmt = select(Product.id).where(Product.slug == product_id.strip().lower())
        p_uuid = (await db.execute(prod_slug_stmt)).scalar_one_or_none()
        if not p_uuid:
            raise NotFoundException(message="Product not found", code="PRODUCT_NOT_FOUND")

    offset = (page - 1) * limit

    # Count published reviews
    count_stmt = select(func.count(Review.id)).where(
        Review.product_id == p_uuid,
        Review.status == ReviewStatus.PUBLISHED,
    )
    total = (await db.execute(count_stmt)).scalar_one() or 0

    # Calculate live average
    avg_stmt = select(func.avg(Review.rating)).where(
        Review.product_id == p_uuid,
        Review.status == ReviewStatus.PUBLISHED,
    )
    raw_avg = (await db.execute(avg_stmt)).scalar_one()
    avg_rating = round(float(raw_avg), 1) if raw_avg is not None else 5.0

    # Fetch rows
    stmt = (
        select(Review)
        .where(
            Review.product_id == p_uuid,
            Review.status == ReviewStatus.PUBLISHED,
        )
        .order_by(Review.created_at.desc())
        .offset(offset)
        .limit(limit)
        .options(
            selectinload(Review.user),
            selectinload(Review.product),
        )
    )
    reviews = (await db.execute(stmt)).scalars().all()

    items = []
    for r in reviews:
        items.append(
            ReviewResponse(
                id=r.id,
                userId=r.user_id,
                userName=r.user.name if r.user else "Verified Customer",
                productId=r.product_id,
                productTitle=r.product.title if r.product else None,
                orderItemId=r.order_item_id,
                rating=r.rating,
                comment=r.comment,
                verifiedPurchase=r.verified_purchase,
                status=r.status,
                createdAt=r.created_at,
                updatedAt=r.updated_at,
            )
        )

    data = PaginatedReviewsResponse(
        items=items,
        total=total,
        page=page,
        limit=limit,
        averageRating=avg_rating,
        reviewCount=total,
    )
    return StandardApiResponse(
        success=True,
        data=data,
        message=f"Retrieved {len(items)} product reviews",
    )


@router.get(
    "/products/{product_id}/review-eligibility",
    response_model=StandardApiResponse[ReviewEligibilityResponse],
    summary="Check Review Eligibility",
    description="Determines if the authenticated customer can submit a verified review for this product.",
)
async def check_review_eligibility(
    product_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> StandardApiResponse[ReviewEligibilityResponse]:
    try:
        p_uuid = uuid.UUID(product_id.strip())
    except (ValueError, TypeError):
        prod_slug_stmt = select(Product.id).where(Product.slug == product_id.strip().lower())
        p_uuid = (await db.execute(prod_slug_stmt)).scalar_one_or_none()
        if not p_uuid:
            raise NotFoundException(message="Product not found", code="PRODUCT_NOT_FOUND")

    is_eligible, order_item_id, reason = await check_user_review_eligibility(
        db, current_user.id, p_uuid
    )

    return StandardApiResponse(
        success=True,
        data=ReviewEligibilityResponse(
            eligible=is_eligible,
            orderItemId=str(order_item_id) if order_item_id else None,
            reason=reason,
        ),
        message="Review eligibility evaluated",
    )


@router.post(
    "/products/{product_id}/reviews",
    response_model=StandardApiResponse[ReviewResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Submit Verified Review",
    description="Allows authenticated customers with verified delivered purchases to submit ratings and feedback.",
)
async def create_product_review(
    product_id: str,
    payload: ReviewCreateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> StandardApiResponse[ReviewResponse]:
    try:
        p_uuid = uuid.UUID(product_id.strip())
    except (ValueError, TypeError):
        prod_slug_stmt = select(Product.id).where(Product.slug == product_id.strip().lower())
        p_uuid = (await db.execute(prod_slug_stmt)).scalar_one_or_none()
        if not p_uuid:
            raise NotFoundException(message="Product not found", code="PRODUCT_NOT_FOUND")

    # Product existence
    prod_stmt = select(Product).where(Product.id == p_uuid).options(selectinload(Product.agent))
    product = (await db.execute(prod_stmt)).scalar_one_or_none()
    if not product:
        raise NotFoundException(message="Product not found", code="PRODUCT_NOT_FOUND")

    # Eligibility validation
    is_eligible, eligible_item_id, reason = await check_user_review_eligibility(
        db, current_user.id, p_uuid
    )
    if not is_eligible:
        raise ForbiddenException(
            message=reason or "You are not eligible to review this product",
            code="NOT_ELIGIBLE_TO_REVIEW",
        )

    chosen_order_item_id = eligible_item_id
    if payload.order_item_id:
        try:
            chosen_order_item_id = uuid.UUID(payload.order_item_id.strip())
        except (ValueError, TypeError):
            pass

    # Create review
    review = Review(
        user_id=current_user.id,
        product_id=p_uuid,
        order_item_id=chosen_order_item_id,
        rating=payload.rating,
        comment=payload.comment.strip(),
        verified_purchase=True,
        status=ReviewStatus.PUBLISHED,
    )
    db.add(review)
    await db.flush()

    # Recalculate product and agent ratings
    await recalculate_product_and_agent_ratings(db, p_uuid)

    # Emit domain event for future processing
    await emit_domain_event(
        db,
        event_type="review.created",
        entity_type="review",
        entity_id=str(review.id),
        payload={
            "reviewId": str(review.id),
            "productId": str(p_uuid),
            "rating": review.rating,
            "userId": str(current_user.id),
        },
    )

    # Notify selling Agent of customer feedback
    if product.agent and product.agent.user_id:
        await create_notification(
            db,
            user_id=product.agent.user_id,
            type=NotificationType.SYSTEM,
            title="New Product Review",
            message=f"A customer left a {review.rating}-star review on '{product.title}'.",
            related_entity_type="product",
            related_entity_id=str(product.id),
        )

    await db.refresh(review)

    return StandardApiResponse(
        success=True,
        data=ReviewResponse(
            id=review.id,
            userId=review.user_id,
            userName=current_user.name,
            productId=review.product_id,
            productTitle=product.title,
            orderItemId=review.order_item_id,
            rating=review.rating,
            comment=review.comment,
            verifiedPurchase=review.verified_purchase,
            status=review.status,
            createdAt=review.created_at,
            updatedAt=review.updated_at,
        ),
        message="Review submitted successfully",
    )


@router.patch(
    "/reviews/{review_id}",
    response_model=StandardApiResponse[ReviewResponse],
    summary="Update Own Review",
    description="Allows review authors to update their rating or commentary.",
)
async def update_my_review(
    review_id: str,
    payload: ReviewUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> StandardApiResponse[ReviewResponse]:
    try:
        r_uuid = uuid.UUID(review_id.strip())
    except (ValueError, TypeError):
        raise AppException(message="Invalid review ID", code="INVALID_REVIEW_ID", status_code=400)

    stmt = select(Review).where(Review.id == r_uuid).options(
        selectinload(Review.product),
        selectinload(Review.user),
    )
    review = (await db.execute(stmt)).scalar_one_or_none()
    if not review:
        raise NotFoundException(message="Review not found", code="REVIEW_NOT_FOUND")

    if review.user_id != current_user.id:
        raise ForbiddenException(message="Access denied: You do not own this review", code="FORBIDDEN")

    if payload.rating is not None:
        review.rating = payload.rating
    if payload.comment is not None:
        review.comment = payload.comment.strip()

    await db.flush()
    await recalculate_product_and_agent_ratings(db, review.product_id)
    await db.refresh(review)

    return StandardApiResponse(
        success=True,
        data=ReviewResponse(
            id=review.id,
            userId=review.user_id,
            userName=review.user.name if review.user else current_user.name,
            productId=review.product_id,
            productTitle=review.product.title if review.product else None,
            orderItemId=review.order_item_id,
            rating=review.rating,
            comment=review.comment,
            verifiedPurchase=review.verified_purchase,
            status=review.status,
            createdAt=review.created_at,
            updatedAt=review.updated_at,
        ),
        message="Review updated successfully",
    )


@router.delete(
    "/reviews/{review_id}",
    response_model=StandardApiResponse[dict],
    summary="Delete Own Review",
    description="Allows review authors to remove their feedback with dynamic rating recalculation.",
)
async def delete_my_review(
    review_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> StandardApiResponse[dict]:
    try:
        r_uuid = uuid.UUID(review_id.strip())
    except (ValueError, TypeError):
        raise AppException(message="Invalid review ID", code="INVALID_REVIEW_ID", status_code=400)

    stmt = select(Review).where(Review.id == r_uuid)
    review = (await db.execute(stmt)).scalar_one_or_none()
    if not review:
        raise NotFoundException(message="Review not found", code="REVIEW_NOT_FOUND")

    if review.user_id != current_user.id:
        raise ForbiddenException(message="Access denied: You do not own this review", code="FORBIDDEN")

    prod_id = review.product_id
    await db.delete(review)
    await db.flush()
    await recalculate_product_and_agent_ratings(db, prod_id)

    return StandardApiResponse(
        success=True,
        data={"deleted": True, "id": str(r_uuid)},
        message="Review deleted successfully",
    )
