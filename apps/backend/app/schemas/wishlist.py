from datetime import datetime
from typing import Optional, Union
import uuid
from pydantic import BaseModel, ConfigDict, Field

from app.schemas.product import ProductSummary


class WishlistItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: Union[str, uuid.UUID]
    user_id: Union[str, uuid.UUID] = Field(..., alias="userId")
    product_id: Union[str, uuid.UUID] = Field(..., alias="productId")
    created_at: Optional[datetime] = Field(default=None, alias="createdAt")
    product: Optional[ProductSummary] = None


class WishlistCheckResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    in_wishlist: bool = Field(..., alias="inWishlist")
    is_in_wishlist: bool = Field(default=False, alias="isInWishlist")
    item_id: Optional[str] = Field(default=None, alias="itemId")

    def __init__(self, **data):
        super().__init__(**data)
        self.is_in_wishlist = self.in_wishlist
