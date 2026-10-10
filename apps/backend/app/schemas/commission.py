from datetime import datetime
from typing import List, Optional, Union
import uuid
from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.db.models.commission import CommissionRuleType, CommissionStatus


class CommissionRuleResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: Union[str, uuid.UUID]
    category_id: Optional[Union[str, uuid.UUID]] = Field(default=None, alias="categoryId")
    category_slug: Optional[str] = Field(default=None, alias="categorySlug")
    rule_type: CommissionRuleType = Field(alias="ruleType")
    rate: float
    percentage: float = Field(default=0.0)
    description: Optional[str] = None
    is_active: bool = Field(alias="isActive")

    @model_validator(mode="after")
    def compute_percentage(self) -> "CommissionRuleResponse":
        if self.rate is not None and self.percentage == 0.0:
            self.percentage = round(self.rate * 100.0, 2)
        return self


class CommissionRuleUpdateRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    category_slug: Optional[str] = Field(default=None, alias="categorySlug")
    rate: Optional[float] = Field(default=None, description="Commission percentage decimal (e.g. 0.05 for 5%)")
    percentage: Optional[float] = Field(default=None, description="Commission percentage human value (e.g. 5.0 for 5%)")
    description: Optional[str] = None
    is_active: Optional[bool] = Field(default=True, alias="isActive")


class CommissionRecordResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: Union[str, uuid.UUID]
    order_id: Union[str, uuid.UUID] = Field(..., alias="orderId")
    order_item_id: Union[str, uuid.UUID] = Field(..., alias="orderItemId")
    agent_id: Union[str, uuid.UUID] = Field(..., alias="agentId")
    basis_amount: int = Field(..., alias="basisAmount")
    rate: float
    commission_amount: int = Field(..., alias="commissionAmount")
    status: CommissionStatus
    created_at: Optional[datetime] = Field(default=None, alias="createdAt")
    settled_at: Optional[datetime] = Field(default=None, alias="settledAt")
