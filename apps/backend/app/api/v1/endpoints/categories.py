from typing import List
import uuid
from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundException
from app.db.models.category import Category
from app.db.models.product import Product, ProductStatus
from app.db.session import get_db
from app.schemas.category import CategoryResponse, CategorySpecSchemaResponse
from app.schemas.response import StandardApiResponse

router = APIRouter()


@router.get(
    "",
    response_model=StandardApiResponse[List[CategoryResponse]],
    summary="List Product Categories",
    description="Returns all active product categories with live published product counts.",
)
async def list_categories(
    db: AsyncSession = Depends(get_db),
) -> StandardApiResponse[List[CategoryResponse]]:
    # Query categories
    stmt = (
        select(
            Category,
            func.count(Product.id).filter(Product.status == ProductStatus.PUBLISHED).label("published_count"),
        )
        .outerjoin(Product, Product.category_id == Category.id)
        .where(Category.is_active == True)
        .group_by(Category.id)
        .order_by(Category.sort_order.asc(), Category.name.asc())
    )
    result = await db.execute(stmt)
    rows = result.all()

    categories_data = []
    for cat, count in rows:
        categories_data.append(
            CategoryResponse(
                id=str(cat.id),
                name=cat.name,
                slug=cat.slug,
                description=cat.description,
                icon=cat.icon,
                productCount=count or 0,
            )
        )

    return StandardApiResponse(
        success=True,
        data=categories_data,
        message=f"Retrieved {len(categories_data)} categories",
    )


@router.get(
    "/{slug_or_id}/specs",
    response_model=StandardApiResponse[CategorySpecSchemaResponse],
    summary="Get Category Dynamic Spec Schema",
    description="Returns specification field definitions, constraints, and facet options for a category.",
)
async def get_category_spec_schema(
    slug_or_id: str,
    db: AsyncSession = Depends(get_db),
) -> StandardApiResponse[CategorySpecSchemaResponse]:
    clean_id = slug_or_id.strip().lower()

    # Try UUID parse or slug match
    stmt = select(Category).where(
        (Category.slug == clean_id) | (Category.name.ilike(clean_id))
    )
    try:
        cat_uuid = uuid.UUID(clean_id)
        stmt = stmt.where(Category.id == cat_uuid)
    except ValueError:
        pass

    result = await db.execute(stmt)
    category = result.scalar_one_or_none()

    if not category:
        raise NotFoundException(
            message=f"Category '{slug_or_id}' not found",
            code="CATEGORY_NOT_FOUND",
        )

    raw_schema = category.spec_schema or {}
    fields = raw_schema.get("fields", [])

    response_schema = CategorySpecSchemaResponse(
        categoryId=str(category.id),
        categoryName=category.name,
        slug=category.slug,
        fields=fields,
    )

    return StandardApiResponse(
        success=True,
        data=response_schema,
        message="Category specification schema retrieved",
    )
