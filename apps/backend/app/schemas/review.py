from datetime import datetime
from typing import List, Optional, Union
import uuid
from pydantic import BaseModel, ConfigDict, Field

from app.db.models.review import ReviewStatus


class ReviewCreateRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    order_item_id: Optional[str] = Field(default=None, alias="orderItemId", description="Delivered order item ID")
    rating: int = Field(..., ge=1, le=5, description="1 to 5 star rating")
    comment: str = Field(..., min_length=5, max_length=1500, description="Customer review text")


class ReviewUpdateRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    rating: Optional[int] = Field(default=None, ge=1, le=5)
    comment: Optional[str] = Field(default=None, min_length=5, max_length=1500)


class ReviewModerationRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    status: ReviewStatus


class ReviewEligibilityResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    eligible: bool
    order_item_id: Optional[str] = Field(default=None, alias="orderItemId")
    reason: Optional[str] = None


class ReviewResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: Union[str, uuid.UUID]
    user_id: Union[str, uuid.UUID] = Field(..., alias="userId")
    user_name: str = Field(..., alias="userName")
    product_id: Union[str, uuid.UUID] = Field(..., alias="productId")
    product_title: Optional[str] = Field(default=None, alias="productTitle")
    order_item_id: Optional[Union[str, uuid.UUID]] = Field(default=None, alias="orderItemId")
    rating: int
    comment: str
    verified_purchase: bool = Field(..., alias="verifiedPurchase")
    status: ReviewStatus
    created_at: Optional[datetime] = Field(default=None, alias="createdAt")
    updated_at: Optional[datetime] = Field(default=None, alias="updatedAt")


class PaginatedReviewsResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    items: List[ReviewResponse]
    total: int
    page: int
    limit: int
    average_rating: float = Field(..., alias="averageRating")
    review_count: int = Field(..., alias="reviewCount")
