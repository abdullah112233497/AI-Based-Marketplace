from datetime import datetime
from typing import Any, Optional
import uuid
from pydantic import BaseModel, ConfigDict, Field

from app.db.models.agent import AgentStatus


class AgentProfileResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: str = Field(..., description="Unique Agent Profile ID")
    user_id: str = Field(..., alias="userId")
    shop_name: str = Field(..., alias="shopName")
    shop_slug: str = Field(..., alias="shopSlug")
    shop_description: Optional[str] = Field(default=None, alias="shopDescription")
    city: str
    address: str
    contact_phone: str = Field(..., alias="contactPhone")
    cnic_or_tax_id: Optional[str] = Field(default=None, alias="cnicOrTaxId")
    status: AgentStatus
    is_verified: bool = Field(default=False, alias="isVerified")
    rating: float = Field(default=5.0)
    rating_count: int = Field(default=0, alias="ratingCount")
    product_count: int = Field(default=0, alias="productCount")
    slug: Optional[str] = None
    created_at: Optional[datetime] = Field(default=None, alias="createdAt")

    @classmethod
    def from_orm_model(cls, agent_model: Any) -> "AgentProfileResponse":
        return cls(
            id=str(agent_model.id),
            userId=str(agent_model.user_id),
            shopName=agent_model.shop_name,
            shopSlug=agent_model.shop_slug,
            slug=agent_model.shop_slug,
            shopDescription=agent_model.shop_description,
            city=agent_model.city,
            address=agent_model.address,
            contactPhone=agent_model.contact_phone,
            cnicOrTaxId=agent_model.cnic_or_tax_id,
            status=agent_model.status,
            isVerified=agent_model.is_verified,
            rating=agent_model.rating,
            ratingCount=agent_model.rating_count,
            productCount=agent_model.product_count,
            createdAt=agent_model.created_at,
        )


from typing import Any


class AdminReviewAgentRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    status: Optional[AgentStatus] = None
    is_verified: Optional[bool] = Field(default=None, alias="isVerified")
    review_notes: Optional[str] = Field(default=None, alias="reviewNotes")
    commission_rate_percent: Optional[float] = Field(default=None, alias="commissionRatePercent")
