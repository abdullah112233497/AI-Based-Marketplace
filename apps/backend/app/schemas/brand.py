from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class BrandResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: str
    name: str
    slug: str
    logo_url: Optional[str] = Field(default=None, alias="logoUrl")
    is_active: bool = Field(default=True, alias="isActive")
