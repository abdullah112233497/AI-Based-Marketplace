from datetime import datetime
from typing import Optional, Union
import uuid
from pydantic import BaseModel, ConfigDict, Field, model_validator


class AddressCreateRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    label: str = Field(default="Home", min_length=1, max_length=50, description="Address label (e.g. Home, Office)")
    tag: Optional[str] = None
    recipient_name: str = Field(..., min_length=2, max_length=150, alias="recipientName")
    phone: str = Field(..., min_length=8, max_length=50)
    street_address: str = Field(default="", min_length=0, max_length=255, alias="streetAddress")
    street: Optional[str] = None
    city: str = Field(..., min_length=2, max_length=100)
    province: str = Field(default="Punjab", min_length=2, max_length=100)
    postal_code: Optional[str] = Field(default=None, alias="postalCode")
    is_default: bool = Field(default=False, alias="isDefault")

    @model_validator(mode="before")
    @classmethod
    def normalize_aliases(cls, data: dict) -> dict:
        if isinstance(data, dict):
            street_val = data.get("street") or data.get("streetAddress") or data.get("street_address") or ""
            data["streetAddress"] = street_val
            data["street_address"] = street_val
            if "tag" in data and ("label" not in data or data["label"] == "Home"):
                data["label"] = data["tag"]
        return data


class AddressUpdateRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    label: Optional[str] = Field(default=None, min_length=1, max_length=50)
    tag: Optional[str] = None
    recipient_name: Optional[str] = Field(default=None, min_length=2, max_length=150, alias="recipientName")
    phone: Optional[str] = Field(default=None, min_length=8, max_length=50)
    street_address: Optional[str] = Field(default=None, min_length=5, max_length=255, alias="streetAddress")
    street: Optional[str] = None
    city: Optional[str] = Field(default=None, min_length=2, max_length=100)
    province: Optional[str] = Field(default=None, min_length=2, max_length=100)
    postal_code: Optional[str] = Field(default=None, alias="postalCode")
    is_default: Optional[bool] = Field(default=None, alias="isDefault")

    @model_validator(mode="before")
    @classmethod
    def normalize_aliases(cls, data: dict) -> dict:
        if isinstance(data, dict):
            if "street" in data and not data.get("streetAddress") and not data.get("street_address"):
                data["streetAddress"] = data["street"]
                data["street_address"] = data["street"]
            if "tag" in data and not data.get("label"):
                data["label"] = data["tag"]
        return data


class AddressResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: Union[str, uuid.UUID]
    user_id: Union[str, uuid.UUID] = Field(..., alias="userId")
    label: str
    tag: Optional[str] = None
    recipient_name: str = Field(..., alias="recipientName")
    phone: str
    street_address: str = Field(..., alias="streetAddress")
    street: Optional[str] = None
    city: str
    province: str
    postal_code: Optional[str] = Field(default=None, alias="postalCode")
    is_default: bool = Field(..., alias="isDefault")
    created_at: Optional[datetime] = Field(default=None, alias="createdAt")
    updated_at: Optional[datetime] = Field(default=None, alias="updatedAt")

    @model_validator(mode="after")
    def populate_convenience_aliases(self) -> "AddressResponse":
        if not self.tag:
            self.tag = self.label
        if not self.street:
            self.street = self.street_address
        return self
