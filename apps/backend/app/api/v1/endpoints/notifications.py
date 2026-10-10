from datetime import datetime, timezone
from typing import List, Optional
import uuid
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.exceptions import AppException, ForbiddenException, NotFoundException
from app.db.models.notification import Notification
from app.db.models.user import User
from app.db.session import get_db
from app.schemas.notification import (
    NotificationResponse,
    PaginatedNotificationsResponse,
    UnreadNotificationCountResponse,
)
from app.schemas.response import StandardApiResponse
from app.services.notification_service import (
    get_unread_notification_count,
    mark_all_notifications_as_read,
)

router = APIRouter()


@router.get(
    "",
    response_model=StandardApiResponse[PaginatedNotificationsResponse],
    summary="Get User Notifications",
    description="Returns paginated in-app notifications for the authenticated user.",
)
async def list_notifications(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=50),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> StandardApiResponse[PaginatedNotificationsResponse]:
    offset = (page - 1) * limit

    # Count total
    count_stmt = select(func.count(Notification.id)).where(Notification.user_id == current_user.id)
    total = (await db.execute(count_stmt)).scalar_one() or 0

    # Fetch paginated
    stmt = (
        select(Notification)
        .where(Notification.user_id == current_user.id)
        .order_by(Notification.created_at.desc())
        .offset(offset)
        .limit(limit)
    )
    rows = (await db.execute(stmt)).scalars().all()

    unread_count = await get_unread_notification_count(db, current_user.id)
    items = [NotificationResponse.model_validate(n) for n in rows]

    data = PaginatedNotificationsResponse(
        items=items,
        total=total,
        page=page,
        limit=limit,
        unreadCount=unread_count,
    )
    return StandardApiResponse(
        success=True,
        data=data,
        message=f"Retrieved {len(items)} notifications",
    )


@router.get(
    "/unread-count",
    response_model=StandardApiResponse[UnreadNotificationCountResponse],
    summary="Get Unread Notification Count",
    description="Returns the number of unread in-app alerts for the notification bell badge.",
)
async def get_unread_count(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> StandardApiResponse[UnreadNotificationCountResponse]:
    count = await get_unread_notification_count(db, current_user.id)
    return StandardApiResponse(
        success=True,
        data=UnreadNotificationCountResponse(unreadCount=count),
        message="Unread count retrieved",
    )


@router.patch(
    "/{notification_id}/read",
    response_model=StandardApiResponse[NotificationResponse],
    summary="Mark Notification as Read",
    description="Marks a specific notification as read with ownership validation.",
)
async def mark_notification_read(
    notification_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> StandardApiResponse[NotificationResponse]:
    try:
        n_uuid = uuid.UUID(notification_id.strip())
    except (ValueError, TypeError):
        raise AppException(message="Invalid notification ID", code="INVALID_NOTIFICATION_ID", status_code=400)

    stmt = select(Notification).where(Notification.id == n_uuid)
    notification = (await db.execute(stmt)).scalar_one_or_none()
    if not notification:
        raise NotFoundException(message="Notification not found", code="NOTIFICATION_NOT_FOUND")

    if notification.user_id != current_user.id:
        raise ForbiddenException(message="Access denied: You do not own this notification", code="FORBIDDEN")

    if not notification.is_read:
        notification.is_read = True
        notification.read_at = datetime.now(timezone.utc)
        await db.flush()

    return StandardApiResponse(
        success=True,
        data=NotificationResponse.model_validate(notification),
        message="Notification marked as read",
    )


@router.post(
    "/read-all",
    response_model=StandardApiResponse[dict],
    summary="Mark All Notifications as Read",
    description="Batch marks all unread notifications for the current user as read.",
)
async def mark_all_read(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> StandardApiResponse[dict]:
    updated_count = await mark_all_notifications_as_read(db, current_user.id)
    return StandardApiResponse(
        success=True,
        data={"markedReadCount": updated_count},
        message=f"Marked {updated_count} notifications as read",
    )
