from datetime import datetime, timezone
import logging
from typing import Optional
import uuid
from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.notification import Notification, NotificationType

logger = logging.getLogger(__name__)


async def create_notification(
    db: AsyncSession,
    user_id: uuid.UUID,
    type: NotificationType,
    title: str,
    message: str,
    related_entity_type: Optional[str] = None,
    related_entity_id: Optional[str] = None,
) -> Notification:
    """
    Creates an in-app notification for a user.
    """
    notification = Notification(
        user_id=user_id,
        type=type,
        title=title,
        message=message,
        related_entity_type=related_entity_type,
        related_entity_id=str(related_entity_id) if related_entity_id else None,
        is_read=False,
    )
    db.add(notification)
    await db.flush()
    logger.info("Notification created for user %s: '%s'", user_id, title)
    return notification


async def get_unread_notification_count(
    db: AsyncSession,
    user_id: uuid.UUID,
) -> int:
    """
    Returns count of unread notifications for a user.
    """
    stmt = (
        select(func.count(Notification.id))
        .where(
            Notification.user_id == user_id,
            Notification.is_read == False,
        )
    )
    count = (await db.execute(stmt)).scalar_one()
    return count or 0


async def mark_all_notifications_as_read(
    db: AsyncSession,
    user_id: uuid.UUID,
) -> int:
    """
    Marks all notifications for a user as read.
    """
    now_utc = datetime.now(timezone.utc)
    stmt = (
        update(Notification)
        .where(
            Notification.user_id == user_id,
            Notification.is_read == False,
        )
        .values(
            is_read=True,
            read_at=now_utc,
        )
    )
    result = await db.execute(stmt)
    await db.flush()
    return result.rowcount
