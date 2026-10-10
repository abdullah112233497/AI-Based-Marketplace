from datetime import datetime
from typing import Any, Optional
from pydantic import BaseModel, ConfigDict, Field

from app.db.models.user import UserRole
from app.schemas.agent import AgentProfileResponse


class UserSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: str
    name: str
    email: str
    phone: Optional[str] = None
    role: UserRole
    is_active: bool = Field(default=True, alias="isActive")
    is_verified: bool = Field(default=False, alias="isVerified")
    agent_profile: Optional[AgentProfileResponse] = Field(default=None, alias="agentProfile")
    created_at: Optional[datetime] = Field(default=None, alias="createdAt")

    @classmethod
    def from_orm_model(cls, user_model: Any) -> "UserSummary":
        agent_data = None
        if hasattr(user_model, "agent") and user_model.agent is not None:
            agent_data = AgentProfileResponse.from_orm_model(user_model.agent)

        return cls(
            id=str(user_model.id),
            name=user_model.name,
            email=user_model.email,
            phone=user_model.phone,
            role=user_model.role,
            isActive=user_model.is_active,
            isVerified=user_model.is_verified,
            agentProfile=agent_data,
            createdAt=user_model.created_at,
        )


class UserProfileUpdateRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    name: Optional[str] = Field(default=None, min_length=2, max_length=255, description="Customer full name")
    phone: Optional[str] = Field(default=None, min_length=7, max_length=50, description="Customer phone number")

