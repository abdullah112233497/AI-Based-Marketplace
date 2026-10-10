from typing import List, Optional
from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_admin
from app.db.models.category import Category
from app.db.models.commission import CommissionRecord, CommissionRule, CommissionRuleType
from app.db.models.user import User
from app.db.session import get_db
from app.schemas.commission import (
    CommissionRecordResponse,
    CommissionRuleResponse,
    CommissionRuleUpdateRequest,
)
from app.schemas.response import StandardApiResponse

router = APIRouter()


@router.get(
    "/commission",
    response_model=StandardApiResponse[List[CommissionRuleResponse]],
    summary="List Commission Rules",
    description="Returns all category-specific and platform commission percentage rules.",
)
async def list_commission_rules(
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> StandardApiResponse[List[CommissionRuleResponse]]:
    stmt = select(CommissionRule).order_by(CommissionRule.category_slug)
    rules = (await db.execute(stmt)).scalars().all()
    if not rules:
        from app.services.commission_service import ensure_default_commission_rules
        rules = await ensure_default_commission_rules(db)
    items = [CommissionRuleResponse.model_validate(r) for r in rules]

    return StandardApiResponse(
        success=True,
        data=items,
        message=f"Retrieved {len(items)} commission rules",
    )


@router.put(
    "/commission",
    response_model=StandardApiResponse[CommissionRuleResponse],
    summary="Update or Create Commission Rule",
    description="Sets commission percentage for a specific category or updates global defaults.",
)
async def update_commission_rule(
    payload: CommissionRuleUpdateRequest,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> StandardApiResponse[CommissionRuleResponse]:
    clean_slug = payload.category_slug.strip().lower() if payload.category_slug else None

    # Lookup existing rule
    stmt = select(CommissionRule).where(CommissionRule.category_slug == clean_slug)
    rule = (await db.execute(stmt)).scalar_one_or_none()

    # Lookup category if slug provided
    cat_id = None
    if clean_slug:
        cat_stmt = select(Category).where(Category.slug == clean_slug)
        cat = (await db.execute(cat_stmt)).scalar_one_or_none()
        if cat:
            cat_id = cat.id

    effective_rate = payload.rate
    if effective_rate is None and payload.percentage is not None:
        effective_rate = payload.percentage / 100.0 if payload.percentage > 1.0 else payload.percentage
    if effective_rate is None:
        effective_rate = 0.05

    if not rule:
        rule = CommissionRule(
            category_id=cat_id,
            category_slug=clean_slug,
            rule_type=CommissionRuleType.CATEGORY_BASED if clean_slug else CommissionRuleType.PERCENTAGE,
            rate=effective_rate,
            description=payload.description or f"Rule for {clean_slug or 'default'}",
            is_active=payload.is_active if payload.is_active is not None else True,
        )
        db.add(rule)
    else:
        rule.rate = effective_rate
        if payload.description is not None:
            rule.description = payload.description
        if payload.is_active is not None:
            rule.is_active = payload.is_active
        if cat_id and not rule.category_id:
            rule.category_id = cat_id

    await db.flush()
    await db.refresh(rule)

    return StandardApiResponse(
        success=True,
        data=CommissionRuleResponse.model_validate(rule),
        message="Commission rule configured successfully",
    )


@router.get(
    "/commission/records",
    response_model=StandardApiResponse[List[CommissionRecordResponse]],
    summary="Audit Commission Records",
    description="Lists auditable commission records generated across marketplace transactions.",
)
async def list_commission_records(
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> StandardApiResponse[List[CommissionRecordResponse]]:
    stmt = (
        select(CommissionRecord)
        .order_by(CommissionRecord.created_at.desc())
        .limit(100)
    )
    records = (await db.execute(stmt)).scalars().all()
    items = [CommissionRecordResponse.model_validate(r) for r in records]

    return StandardApiResponse(
        success=True,
        data=items,
        message=f"Retrieved {len(items)} commission records",
    )
