from datetime import datetime
from typing import Optional, Union
import uuid
from pydantic import BaseModel, ConfigDict, Field

from app.schemas.product import ProductSummary


class ProductWatchCreateRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    product_id: str = Field(..., alias="productId", description="Product ID to watch")
    watch_price_drop: bool = Field(default=True, alias="watchPriceDrop", description="Alert on price reductions")
    watch_back_in_stock: bool = Field(default=True, alias="watchBackInStock", description="Alert when out of stock item returns")
    target_price: Optional[int] = Field(default=None, alias="targetPrice", gt=0, description="Optional target price threshold (PKR)")


class ProductWatchUpdateRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    watch_price_drop: Optional[bool] = Field(default=None, alias="watchPriceDrop")
    watch_back_in_stock: Optional[bool] = Field(default=None, alias="watchBackInStock")
    target_price: Optional[int] = Field(default=None, alias="targetPrice", gt=0)
    is_active: Optional[bool] = Field(default=None, alias="isActive")


class ProductWatchResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: Union[str, uuid.UUID]
    user_id: Union[str, uuid.UUID] = Field(..., alias="userId")
    product_id: Union[str, uuid.UUID] = Field(..., alias="productId")
    watch_price_drop: bool = Field(..., alias="watchPriceDrop")
    watch_back_in_stock: bool = Field(..., alias="watchBackInStock")
    target_price: Optional[int] = Field(default=None, alias="targetPrice")
    last_seen_price: int = Field(..., alias="lastSeenPrice")
    last_seen_stock: int = Field(..., alias="lastSeenStock")
    is_active: bool = Field(..., alias="isActive")
    created_at: Optional[datetime] = Field(default=None, alias="createdAt")
    updated_at: Optional[datetime] = Field(default=None, alias="updatedAt")
    product: Optional[ProductSummary] = None
