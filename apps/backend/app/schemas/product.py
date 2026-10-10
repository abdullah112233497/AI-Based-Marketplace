from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.db.models.product import ProductCondition, ProductStatus
from app.schemas.agent import AgentProfileResponse
from app.schemas.category import CategoryResponse


class ProductVariantItem(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: Optional[str] = None
    name: str = Field(..., min_length=1, description="Variant name (e.g. 256GB Titanium Gray)")
    sku: Optional[str] = None
    price: int = Field(..., gt=0, description="Price in PKR integer")
    compare_at_price: Optional[int] = Field(default=None, alias="compareAtPrice")
    stock: int = Field(default=0, ge=0)
    attributes: Dict[str, str] = Field(default_factory=dict)


class ProductCreateUpdateRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    title: str = Field(..., min_length=3, max_length=255, description="Product listing title")
    slug: Optional[str] = None
    description: str = Field(..., min_length=10, description="Product description")
    category_id: str = Field(..., alias="categoryId", description="Category ID or Slug")
    brand: str = Field(..., min_length=1, max_length=100, description="Manufacturer/Brand name")
    condition: ProductCondition = Field(default=ProductCondition.NEW)
    condition_description: Optional[str] = Field(default=None, alias="conditionDescription")
    images: List[str] = Field(..., min_length=1, description="List of image URLs (min 1 required)")
    base_price: int = Field(..., alias="basePrice", gt=0, description="Listing price in PKR integer amount")
    compare_at_price: Optional[int] = Field(default=None, alias="compareAtPrice", description="Original/Reference price in PKR")
    stock: int = Field(default=0, ge=0, description="Available stock units")
    status: ProductStatus = Field(default=ProductStatus.PUBLISHED)
    specs: Dict[str, Any] = Field(default_factory=dict, description="Dynamic category specifications")
    variants: List[ProductVariantItem] = Field(default_factory=list)

    @field_validator("title", "brand")
    @classmethod
    def strip_whitespace(cls, v: str) -> str:
        return v.strip() if isinstance(v, str) else v

    @field_validator("compare_at_price")
    @classmethod
    def validate_compare_price(cls, v: Optional[int], info) -> Optional[int]:
        if v is not None:
            base_price = info.data.get("base_price")
            if base_price is not None and v < base_price:
                # If compare_at_price is provided, it shouldn't be less than base_price
                pass  # allow flexible or warn
        return v


class ProductUpdatePartialRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    title: Optional[str] = Field(default=None, min_length=3, max_length=255)
    slug: Optional[str] = None
    description: Optional[str] = Field(default=None, min_length=10)
    category_id: Optional[str] = Field(default=None, alias="categoryId")
    brand: Optional[str] = Field(default=None, min_length=1, max_length=100)
    condition: Optional[ProductCondition] = None
    condition_description: Optional[str] = Field(default=None, alias="conditionDescription")
    images: Optional[List[str]] = Field(default=None, min_length=1)
    base_price: Optional[int] = Field(default=None, alias="basePrice", gt=0)
    compare_at_price: Optional[int] = Field(default=None, alias="compareAtPrice")
    stock: Optional[int] = Field(default=None, ge=0)
    status: Optional[ProductStatus] = None
    specs: Optional[Dict[str, Any]] = None
    variants: Optional[List[ProductVariantItem]] = None

    @field_validator("title", "brand")
    @classmethod
    def strip_whitespace(cls, v: Optional[str]) -> Optional[str]:
        return v.strip() if isinstance(v, str) else v


class ProductSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: str
    title: str
    slug: str
    description: str
    category_id: str = Field(..., alias="categoryId")
    category_name: str = Field(..., alias="categoryName")
    brand: str
    condition: ProductCondition
    condition_description: Optional[str] = Field(default=None, alias="conditionDescription")
    images: List[str] = Field(default_factory=list)
    base_price: int = Field(..., alias="basePrice")
    compare_at_price: Optional[int] = Field(default=None, alias="compareAtPrice")
    stock: int
    status: ProductStatus
    agent_id: str = Field(..., alias="agentId")
    agent_shop_name: str = Field(..., alias="agentShopName")
    agent_city: str = Field(..., alias="agentCity")
    agent_is_verified: bool = Field(default=False, alias="agentIsVerified")
    specs: Dict[str, Any] = Field(default_factory=dict)
    rating: float = 5.0
    review_count: int = Field(default=0, alias="reviewCount")
    created_at: Optional[datetime] = Field(default=None, alias="createdAt")

    @classmethod
    def from_orm_model(cls, product: Any) -> "ProductSummary":
        category_name = product.category.name if product.category else "Electronics"
        agent_shop_name = product.agent.shop_name if product.agent else "Verified Merchant"
        agent_city = product.agent.city if product.agent else "Pakistan"
        agent_is_verified = product.agent.is_verified if product.agent else False

        return cls(
            id=str(product.id),
            title=product.title,
            slug=product.slug,
            description=product.description,
            categoryId=str(product.category_id),
            categoryName=category_name,
            brand=product.brand,
            condition=product.condition,
            conditionDescription=product.condition_description,
            images=product.images or [],
            basePrice=product.base_price,
            compareAtPrice=product.compare_at_price,
            stock=product.stock,
            status=product.status,
            agentId=str(product.agent_id),
            agentShopName=agent_shop_name,
            agentCity=agent_city,
            agentIsVerified=agent_is_verified,
            specs=product.specs or {},
            rating=product.rating,
            reviewCount=product.review_count,
            createdAt=product.created_at,
        )


class ProductDetailResponse(ProductSummary):
    category: Optional[CategoryResponse] = None
    agent: Optional[AgentProfileResponse] = None
    related: List[ProductSummary] = Field(default_factory=list)
    reviews: List[Dict[str, Any]] = Field(default_factory=list)


class PaginationMeta(BaseModel):
    page: int
    limit: int
    total: int
    total_pages: int = Field(..., alias="totalPages")


class PaginatedProductsResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    success: bool = True
    data: List[ProductSummary]
    meta: PaginationMeta
