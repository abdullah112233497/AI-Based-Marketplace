from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


class CartItemAddRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    product_id: str = Field(..., alias="productId", description="Product UUID to add")
    quantity: int = Field(default=1, ge=1, description="Quantity to add")
    variant_id: Optional[str] = Field(default=None, alias="variantId")


class CartItemUpdateRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    quantity: int = Field(..., ge=0, description="Updated quantity (0 deletes item)")


class CartItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: str
    product_id: str = Field(..., alias="productId")
    variant_id: Optional[str] = Field(default=None, alias="variantId")
    title: str
    image: Optional[str] = None
    price: int
    quantity: int
    stock: int
    agent_id: str = Field(..., alias="agentId")
    agent_shop_name: str = Field(..., alias="agentShopName")
    item_total: int = Field(..., alias="itemTotal")


class CartResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    items: List[CartItemResponse] = Field(default_factory=list)
    total_items: int = Field(default=0, alias="totalItems")
    subtotal: int = 0
