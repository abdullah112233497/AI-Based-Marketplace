from datetime import datetime
from typing import List, Optional, Union
import uuid
from pydantic import BaseModel, ConfigDict, Field

from app.db.models.notification import NotificationType


class NotificationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: Union[str, uuid.UUID]
    user_id: Union[str, uuid.UUID] = Field(..., alias="userId")
    type: NotificationType
    title: str
    message: str
    related_entity_type: Optional[str] = Field(default=None, alias="relatedEntityType")
    related_entity_id: Optional[str] = Field(default=None, alias="relatedEntityId")
    is_read: bool = Field(..., alias="isRead")
    created_at: Optional[datetime] = Field(default=None, alias="createdAt")
    read_at: Optional[datetime] = Field(default=None, alias="readAt")


class PaginatedNotificationsResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    items: List[NotificationResponse]
    total: int
    page: int
    limit: int
    unread_count: int = Field(..., alias="unreadCount")


class UnreadNotificationCountResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    unread_count: int = Field(..., alias="unreadCount")
