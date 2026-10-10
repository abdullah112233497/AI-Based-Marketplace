from typing import List, Optional
import uuid
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_role
from app.core.config import get_settings
from app.core.exceptions import AppException, NotFoundException
from app.core.logging import get_logger
from app.db.models.agent import Agent, AgentStatus
from app.db.models.commission import CommissionRecord
from app.db.models.order import Order
from app.db.models.product import Product, ProductStatus
from app.db.models.review import Review, ReviewStatus
from app.db.models.user import User, UserRole
from app.db.session import get_db
from app.schemas.agent import AdminReviewAgentRequest, AgentProfileResponse
from app.schemas.product import ProductSummary
from app.schemas.response import StandardApiResponse
from app.schemas.review import ReviewModerationRequest, ReviewResponse

logger = get_logger(__name__)

router = APIRouter()

# Valid lifecycle state transitions map
VALID_AGENT_STATUS_TRANSITIONS = {
    AgentStatus.PENDING: {AgentStatus.APPROVED, AgentStatus.REJECTED},
    AgentStatus.APPROVED: {AgentStatus.SUSPENDED},
    AgentStatus.SUSPENDED: {AgentStatus.APPROVED},
    AgentStatus.REJECTED: {AgentStatus.PENDING, AgentStatus.APPROVED},
}


@router.get(
    "/agents",
    response_model=StandardApiResponse[List[AgentProfileResponse]],
    summary="List All Agents",
    description="Admin-only endpoint retrieving all registered vendor/agent applications.",
)
async def list_agents(
    current_admin: User = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
) -> StandardApiResponse[List[AgentProfileResponse]]:
    stmt = select(Agent).order_by(Agent.created_at.desc())
    result = await db.execute(stmt)
    agents = result.scalars().all()

    agent_responses = [AgentProfileResponse.from_orm_model(a) for a in agents]
    return StandardApiResponse(
        success=True,
        data=agent_responses,
        message=f"Retrieved {len(agent_responses)} agent profiles",
    )


@router.patch(
    "/agents/{agent_id}/status",
    response_model=StandardApiResponse[AgentProfileResponse],
    summary="Update Agent Status",
    description="Admin-only endpoint approving, rejecting, or suspending an agent application.",
)
async def update_agent_status(
    agent_id: str,
    payload: AdminReviewAgentRequest,
    current_admin: User = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
) -> StandardApiResponse[AgentProfileResponse]:
    try:
        agent_uuid = uuid.UUID(agent_id)
    except (ValueError, TypeError):
        raise NotFoundException(message="Invalid agent identifier format", code="INVALID_AGENT_ID")

    stmt = select(Agent).where(Agent.id == agent_uuid)
    result = await db.execute(stmt)
    agent = result.scalar_one_or_none()

    if not agent:
        raise NotFoundException(message="Agent profile not found", code="AGENT_NOT_FOUND")

    # Validate lifecycle transition if status is being changed
    if payload.status is not None and payload.status != agent.status:
        allowed = VALID_AGENT_STATUS_TRANSITIONS.get(agent.status, set())
        if payload.status not in allowed:
            raise AppException(
                message=f"Cannot transition agent status from {agent.status.value} to {payload.status.value}",
                code="INVALID_AGENT_STATUS_TRANSITION",
                status_code=status.HTTP_400_BAD_REQUEST,
                details={
                    "currentStatus": agent.status.value,
                    "targetStatus": payload.status.value,
                    "allowedTransitions": [s.value for s in allowed],
                },
            )

        old_status = agent.status
        agent.status = payload.status

        # If approved, automatically set verified flag to True unless explicitly overridden
        if agent.status == AgentStatus.APPROVED and payload.is_verified is None:
            agent.is_verified = True

        logger.info(
            "Admin %s transitioned Agent %s (%s) from %s to %s",
            current_admin.email,
            agent.id,
            agent.shop_name,
            old_status.value,
            agent.status.value,
        )

    if payload.is_verified is not None:
        agent.is_verified = payload.is_verified

    await db.flush()
    await db.refresh(agent)

    return StandardApiResponse(
        success=True,
        data=AgentProfileResponse.from_orm_model(agent),
        message=f"Agent status updated to {agent.status.value}",
    )


@router.get(
    "/overview",
    response_model=StandardApiResponse[dict],
    summary="Admin Platform Overview",
    description="Admin overview metrics for platform control center dashboard.",
)
async def get_admin_overview(
    current_admin: User = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
) -> StandardApiResponse[dict]:
    settings = get_settings()

    # 1. Platform Totals
    total_users = (await db.execute(select(func.count(User.id)))).scalar_one() or 0
    total_agents = (await db.execute(select(func.count(Agent.id)))).scalar_one() or 0
    pending_agents = (
        await db.execute(
            select(func.count(Agent.id)).where(Agent.status == AgentStatus.PENDING)
        )
    ).scalar_one() or 0
    total_products = (await db.execute(select(func.count(Product.id)))).scalar_one() or 0
    total_orders = (await db.execute(select(func.count(Order.id)))).scalar_one() or 0

    # 2. Financial Metrics (GMV & Earned/Pending Commission)
    total_gmv = (await db.execute(select(func.coalesce(func.sum(Order.total_amount), 0)))).scalar_one() or 0
    total_commissions = (
        await db.execute(select(func.coalesce(func.sum(CommissionRecord.commission_amount), 0)))
    ).scalar_one() or 0

    # 3. Recent Activity Samples
    recent_orders_stmt = select(Order).order_by(Order.created_at.desc()).limit(5)
    recent_orders = (await db.execute(recent_orders_stmt)).scalars().all()
    recent_orders_data = [
        {
            "id": str(o.id),
            "orderNumber": o.order_number,
            "customerName": o.customer_name,
            "totalAmount": o.total_amount,
            "status": o.status.value,
            "createdAt": o.created_at.isoformat() if o.created_at else None,
        }
        for o in recent_orders
    ]

    recent_agents_stmt = select(Agent).order_by(Agent.created_at.desc()).limit(5)
    recent_agents = (await db.execute(recent_agents_stmt)).scalars().all()
    recent_agents_data = [
        {
            "id": str(a.id),
            "shopName": a.shop_name,
            "city": a.city,
            "status": a.status.value,
            "rating": a.rating,
        }
        for a in recent_agents
    ]

    return StandardApiResponse(
        success=True,
        data={
            "stats": {
                "totalUsers": total_users,
                "totalAgents": total_agents,
                "pendingAgents": pending_agents,
                "totalProducts": total_products,
                "totalOrders": total_orders,
                "totalGMV": total_gmv,
                "totalCommissions": total_commissions,
                "platformCommissionPercentage": settings.PLATFORM_COMMISSION_PERCENTAGE,
            },
            "recentOrders": recent_orders_data,
            "recentAgents": recent_agents_data,
        },
        message="Admin overview metrics retrieved",
    )


@router.get(
    "/reviews",
    response_model=StandardApiResponse[List[ReviewResponse]],
    summary="Admin List Reviews",
    description="Admin endpoint to audit all marketplace reviews across all statuses (PUBLISHED, HIDDEN, REMOVED).",
)
async def list_admin_reviews(
    status_filter: Optional[ReviewStatus] = Query(default=None, alias="status"),
    product_id: Optional[str] = Query(default=None, alias="productId"),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    current_admin: User = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
) -> StandardApiResponse[List[ReviewResponse]]:
    from app.db.models.review import Review
    from app.schemas.review import ReviewResponse
    from sqlalchemy.orm import selectinload

    stmt = select(Review).order_by(Review.created_at.desc()).options(
        selectinload(Review.user),
        selectinload(Review.product),
    )

    if status_filter:
        stmt = stmt.where(Review.status == status_filter)

    if product_id:
        try:
            p_uuid = uuid.UUID(product_id.strip())
            stmt = stmt.where(Review.product_id == p_uuid)
        except (ValueError, TypeError):
            pass

    offset = (page - 1) * limit
    stmt = stmt.offset(offset).limit(limit)
    rows = (await db.execute(stmt)).scalars().all()

    items = [
        ReviewResponse(
            id=r.id,
            userId=r.user_id,
            userName=r.user.name if r.user else "Customer",
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
        for r in rows
    ]

    return StandardApiResponse(
        success=True,
        data=items,
        message=f"Retrieved {len(items)} reviews for moderation",
    )


@router.patch(
    "/reviews/{review_id}/status",
    response_model=StandardApiResponse[ReviewResponse],
    summary="Moderate Review Status",
    description="Admin endpoint to publish, hide, or remove customer reviews with automatic rating recalculation.",
)
async def moderate_review_status(
    review_id: str,
    payload: ReviewModerationRequest,
    current_admin: User = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
) -> StandardApiResponse[ReviewResponse]:
    from app.db.models.review import Review
    from app.schemas.review import ReviewResponse
    from app.services.review_service import recalculate_product_and_agent_ratings
    from sqlalchemy.orm import selectinload

    try:
        r_uuid = uuid.UUID(review_id.strip())
    except (ValueError, TypeError):
        raise AppException(message="Invalid review ID", code="INVALID_REVIEW_ID", status_code=400)

    stmt = select(Review).where(Review.id == r_uuid).options(
        selectinload(Review.user),
        selectinload(Review.product),
    )
    review = (await db.execute(stmt)).scalar_one_or_none()
    if not review:
        raise NotFoundException(message="Review not found", code="REVIEW_NOT_FOUND")

    old_status = review.status
    review.status = payload.status
    await db.flush()

    # Recalculate ratings so hidden/removed reviews immediately cease affecting scores
    await recalculate_product_and_agent_ratings(db, review.product_id)
    await db.refresh(review)

    logger.info("Admin %s updated review %s status from %s to %s", current_admin.email, r_uuid, old_status, payload.status)

    return StandardApiResponse(
        success=True,
        data=ReviewResponse(
            id=review.id,
            userId=review.user_id,
            userName=review.user.name if review.user else "Customer",
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
        message=f"Review status updated to {review.status.value}",
    )


@router.get(
    "/products",
    response_model=StandardApiResponse[List[ProductSummary]],
    summary="Admin List Products",
    description="Admin endpoint listing products across all statuses and sellers.",
)
async def list_admin_products(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=50, ge=1, le=100),
    current_admin: User = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
) -> StandardApiResponse[List[ProductSummary]]:
    from app.db.models.product import Product
    from app.schemas.product import ProductSummary
    from sqlalchemy.orm import selectinload

    offset = (page - 1) * limit
    stmt = (
        select(Product)
        .order_by(Product.created_at.desc())
        .offset(offset)
        .limit(limit)
        .options(
            selectinload(Product.agent),
            selectinload(Product.category),
        )
    )
    products = (await db.execute(stmt)).scalars().all()
    items = [ProductSummary.from_orm_model(p) for p in products]

    return StandardApiResponse(
        success=True,
        data=items,
        message=f"Retrieved {len(items)} products for admin review",
    )


@router.patch(
    "/products/{product_id}/status",
    response_model=StandardApiResponse[ProductSummary],
    summary="Moderate Product Status",
    description="Admin endpoint to moderate listing status (PUBLISHED, UNPUBLISHED, REJECTED).",
)
async def moderate_product_status(
    product_id: str,
    payload: dict,
    current_admin: User = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
) -> StandardApiResponse[ProductSummary]:
    from app.db.models.product import Product, ProductStatus
    from app.schemas.product import ProductSummary
    from sqlalchemy.orm import selectinload

    try:
        p_uuid = uuid.UUID(product_id.strip())
    except (ValueError, TypeError):
        raise AppException(message="Invalid product ID", code="INVALID_PRODUCT_ID", status_code=400)

    stmt = select(Product).where(Product.id == p_uuid).options(
        selectinload(Product.agent),
        selectinload(Product.category),
    )
    product = (await db.execute(stmt)).scalar_one_or_none()
    if not product:
        raise NotFoundException(message="Product not found", code="PRODUCT_NOT_FOUND")

    new_status = payload.get("status")
    if new_status:
        try:
            product.status = ProductStatus(new_status)
        except ValueError:
            raise AppException(message=f"Invalid status: {new_status}", code="INVALID_STATUS", status_code=400)

    await db.flush()
    await db.refresh(product)

    return StandardApiResponse(
        success=True,
        data=ProductSummary.from_orm_model(product),
        message=f"Product status updated to {product.status.value}",
    )

