import re
from typing import Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from app.schemas.response import StandardApiResponse
from app.schemas.user import UserSummary


class LoginRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    email: EmailStr
    password: str = Field(..., min_length=6, description="Account password (min 6 characters)")

    @field_validator("email", mode="before")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        return v.strip().lower() if isinstance(v, str) else v


class CustomerRegisterRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    name: str = Field(..., min_length=2, max_length=255, description="Full customer name")
    email: EmailStr
    phone: str = Field(..., min_length=10, max_length=25, description="Pakistani mobile number")
    password: str = Field(..., min_length=8, description="Password (min 8 characters)")

    @field_validator("email", mode="before")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        return v.strip().lower() if isinstance(v, str) else v

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        cleaned = v.strip().replace(" ", "").replace("-", "")
        # Allow standard formats: 03001234567 or +923001234567 or 923001234567
        pattern = r"^(03\d{9}|\+?923\d{9})$"
        if not re.match(pattern, cleaned):
            raise ValueError("Phone number must be a valid Pakistani mobile number (e.g. 03001234567)")
        return cleaned


class AgentRegisterRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    name: str = Field(..., min_length=2, max_length=255, description="Shop owner full name")
    email: EmailStr
    phone: str = Field(..., min_length=10, max_length=25, description="Primary contact phone")
    password: str = Field(..., min_length=8, description="Password (min 8 characters)")
    shop_name: str = Field(..., min_length=3, max_length=255, alias="shopName", description="Shop or business name")
    city: str = Field(..., min_length=2, max_length=100, description="City location")
    address: str = Field(..., min_length=5, max_length=500, description="Physical shop address")
    cnic_or_tax_id: Optional[str] = Field(default=None, alias="cnicOrTaxId", description="CNIC or NTN number")
    shop_description: Optional[str] = Field(default=None, alias="shopDescription", description="Description of the business")

    @field_validator("email", mode="before")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        return v.strip().lower() if isinstance(v, str) else v

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        cleaned = v.strip().replace(" ", "").replace("-", "")
        pattern = r"^(03\d{9}|\+?923\d{9})$"
        if not re.match(pattern, cleaned):
            raise ValueError("Phone number must be a valid Pakistani mobile number (e.g. 03001234567)")
        return cleaned


class AuthData(BaseModel):
    token: str
    user: UserSummary


AuthResponse = StandardApiResponse[AuthData]
CurrentUserResponse = StandardApiResponse[UserSummary]
