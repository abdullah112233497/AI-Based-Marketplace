import math
from typing import Any, List, Optional
import uuid
from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.exceptions import NotFoundException
from app.db.models.agent import Agent, AgentStatus
from app.db.models.category import Category
from app.db.models.product import Product, ProductCondition, ProductStatus
from app.db.models.user import User
from app.db.session import get_db
from app.schemas.agent import AgentProfileResponse
from app.schemas.category import CategoryResponse
from app.schemas.product import (
    PaginatedProductsResponse,
    PaginationMeta,
    ProductDetailResponse,
    ProductSummary,
)
from app.schemas.response import StandardApiResponse

router = APIRouter()

STANDARD_QUERY_KEYS = {
    "search",
    "category",
    "brand",
    "condition",
    "agentid",
    "agent_id",
    "minprice",
    "min_price",
    "maxprice",
    "max_price",
    "sort",
    "page",
    "limit",
}


@router.get(
    "",
    response_model=PaginatedProductsResponse,
    summary="Public Product Catalog",
    description="Lists published marketplace products with multi-faceted filtering, dynamic JSONB specs, keyword search, sorting, and pagination.",
)
async def list_products(
    request: Request,
    search: Optional[str] = Query(default=None, description="Keyword search in title, brand, description, and shop name"),
    category: Optional[str] = Query(default=None, description="Category slug or ID"),
    brand: Optional[str] = Query(default=None, description="Brand name filter"),
    condition: Optional[ProductCondition] = Query(default=None, description="Condition: NEW, USED, REFURBISHED"),
    agent_id: Optional[str] = Query(default=None, alias="agentId", description="Filter by Agent ID"),
    min_price: Optional[int] = Query(default=None, alias="minPrice", ge=0, description="Minimum price in PKR"),
    max_price: Optional[int] = Query(default=None, alias="maxPrice", ge=0, description="Maximum price in PKR"),
    sort: str = Query(default="newest", description="Sorting: newest, price_asc, price_desc, rating, popular"),
    page: int = Query(default=1, ge=1, description="Page number"),
    limit: int = Query(default=20, ge=1, le=50, description="Items per page"),
    db: AsyncSession = Depends(get_db),
) -> PaginatedProductsResponse:
    # Base query: join Agent and Category, enforce published status & approved agent
    stmt = (
        select(Product)
        .join(Agent, Product.agent_id == Agent.id)
        .join(Category, Product.category_id == Category.id)
        .where(
            Product.status == ProductStatus.PUBLISHED,
            Agent.status == AgentStatus.APPROVED,
        )
    )

    # 1. Category filter (by slug or UUID)
    if category and category.strip():
        cat_term = category.strip().lower()
        try:
            cat_uuid = uuid.UUID(cat_term)
            stmt = stmt.where(Category.id == cat_uuid)
        except ValueError:
            stmt = stmt.where((Category.slug == cat_term) | (Category.name.ilike(cat_term)))

    # 2. Brand filter
    if brand and brand.strip():
        stmt = stmt.where(Product.brand.ilike(brand.strip()))

    # 3. Condition filter
    if condition:
        stmt = stmt.where(Product.condition == condition)

    # 4. Agent ID filter
    if agent_id and agent_id.strip():
        try:
            ag_uuid = uuid.UUID(agent_id.strip())
            stmt = stmt.where(Product.agent_id == ag_uuid)
        except ValueError:
            pass

    # 5. Price range
    if min_price is not None:
        stmt = stmt.where(Product.base_price >= min_price)
    if max_price is not None:
        stmt = stmt.where(Product.base_price <= max_price)

    # 6. Keyword Search
    if search and search.strip():
        term = f"%{search.strip().lower()}%"
        stmt = stmt.where(
            Product.title.ilike(term)
            | Product.brand.ilike(term)
            | Product.description.ilike(term)
            | Agent.shop_name.ilike(term)
        )

    # 7. Dynamic JSONB Spec Filters (e.g. ram_gb=12, storage_gb=256, pta_approved=Official PTA Approved)
    for q_key, q_val in request.query_params.items():
        if q_key.lower() not in STANDARD_QUERY_KEYS and q_val and q_val.strip():
            # Use jsonb_extract_path_text for clean string comparison
            stmt = stmt.where(
                func.jsonb_extract_path_text(Product.specs, q_key).ilike(q_val.strip())
            )

    # Count total matching rows
    count_stmt = select(func.count()).select_from(stmt.subquery())
    total_count = (await db.execute(count_stmt)).scalar_one() or 0

    # 8. Sorting
    if sort == "price_asc":
        stmt = stmt.order_by(Product.base_price.asc(), Product.created_at.desc())
    elif sort == "price_desc":
        stmt = stmt.order_by(Product.base_price.desc(), Product.created_at.desc())
    elif sort == "rating":
        stmt = stmt.order_by(Product.rating.desc(), Product.created_at.desc())
    else:  # newest / default
        stmt = stmt.order_by(Product.created_at.desc())

    # 9. Pagination
    offset = (page - 1) * limit
    stmt = (
        stmt.offset(offset)
        .limit(limit)
        .options(
            selectinload(Product.agent),
            selectinload(Product.category),
        )
    )

    result = await db.execute(stmt)
    products = result.scalars().all()

    items = [ProductSummary.from_orm_model(p) for p in products]
    total_pages = math.ceil(total_count / limit) if total_count > 0 else 1

    return PaginatedProductsResponse(
        success=True,
        data=items,
        meta=PaginationMeta(
            page=page,
            limit=limit,
            total=total_count,
            totalPages=total_pages,
        ),
    )


@router.get(
    "/compare",
    response_model=StandardApiResponse[List[ProductSummary]],
    summary="Compare Products",
    description="Retrieves a list of products by comma-separated IDs or slugs for side-by-side spec comparison.",
)
async def compare_products(
    ids: str = Query(..., description="Comma-separated list of product IDs or slugs"),
    db: AsyncSession = Depends(get_db),
) -> StandardApiResponse[List[ProductSummary]]:
    raw_ids = [item.strip() for item in ids.split(",") if item.strip()]
    if not raw_ids:
        return StandardApiResponse(success=True, data=[], message="No products specified")

    # Match by ID or Slug
    matched_uuids = []
    slug_list = []
    for item in raw_ids:
        try:
            matched_uuids.append(uuid.UUID(item))
        except ValueError:
            slug_list.append(item.lower())

    conditions = []
    if matched_uuids:
        conditions.append(Product.id.in_(matched_uuids))
    if slug_list:
        conditions.append(Product.slug.in_(slug_list))

    from sqlalchemy import or_

    stmt = (
        select(Product)
        .where(or_(*conditions))
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
        message=f"Retrieved {len(items)} products for comparison",
    )


@router.get(
    "/{slug_or_id}",
    response_model=StandardApiResponse[ProductDetailResponse],
    summary="Get Product Detail",
    description="Returns comprehensive product information including seller profile, dynamic specs, and related category products.",
)
async def get_product_detail(
    slug_or_id: str,
    db: AsyncSession = Depends(get_db),
) -> StandardApiResponse[ProductDetailResponse]:
    clean_val = slug_or_id.strip()

    stmt = (
        select(Product)
        .where((Product.slug == clean_val.lower()) | (Product.slug == clean_val))
        .options(
            selectinload(Product.agent),
            selectinload(Product.category),
        )
    )

    try:
        p_uuid = uuid.UUID(clean_val)
        stmt = select(Product).where(Product.id == p_uuid).options(
            selectinload(Product.agent),
            selectinload(Product.category),
        )
    except ValueError:
        pass

    result = await db.execute(stmt)
    product = result.scalar_one_or_none()

    if not product or product.status != ProductStatus.PUBLISHED:
        raise NotFoundException(
            message="Product not found",
            code="PRODUCT_NOT_FOUND",
        )

    # Fetch 4 related products in the same category
    related_stmt = (
        select(Product)
        .where(
            Product.category_id == product.category_id,
            Product.id != product.id,
            Product.status == ProductStatus.PUBLISHED,
        )
        .limit(4)
        .options(
            selectinload(Product.agent),
            selectinload(Product.category),
        )
    )
    related_rows = (await db.execute(related_stmt)).scalars().all()
    related_items = [ProductSummary.from_orm_model(rp) for rp in related_rows]

    cat_resp = CategoryResponse(
        id=str(product.category.id),
        name=product.category.name,
        slug=product.category.slug,
        description=product.category.description,
        icon=product.category.icon,
    ) if product.category else None

    agent_resp = AgentProfileResponse.from_orm_model(product.agent) if product.agent else None

    # Load recent published reviews
    from app.db.models.review import Review, ReviewStatus
    rev_stmt = (
        select(Review)
        .where(
            Review.product_id == product.id,
            Review.status == ReviewStatus.PUBLISHED,
        )
        .order_by(Review.created_at.desc())
        .limit(10)
        .options(selectinload(Review.user))
    )
    product_reviews = (await db.execute(rev_stmt)).scalars().all()
    review_items = [
        {
            "id": str(r.id),
            "userId": str(r.user_id),
            "userName": r.user.name if r.user else "Verified Customer",
            "rating": r.rating,
            "comment": r.comment,
            "verifiedPurchase": r.verified_purchase,
            "createdAt": r.created_at.isoformat() if r.created_at else None,
        }
        for r in product_reviews
    ]

    base_summary = ProductSummary.from_orm_model(product)
    detail_data = ProductDetailResponse(
        **base_summary.model_dump(),
        category=cat_resp,
        agent=agent_resp,
        related=related_items,
        reviews=review_items,
    )

    return StandardApiResponse(
        success=True,
        data=detail_data,
        message="Product detail retrieved",
    )
