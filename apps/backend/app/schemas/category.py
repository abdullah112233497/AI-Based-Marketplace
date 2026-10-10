from typing import Any, List, Optional
from pydantic import BaseModel, ConfigDict, Field


class SpecFieldDefinition(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    key: str
    label: str
    type: str  # 'text' | 'number' | 'select' | 'boolean'
    unit: Optional[str] = None
    options: Optional[List[str]] = None
    required: bool = False
    filterable: bool = False
    comparable: bool = False
    default_value: Optional[Any] = Field(default=None, alias="defaultValue")
    placeholder: Optional[str] = None


class CategorySpecSchemaResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    category_id: str = Field(..., alias="categoryId")
    category_name: str = Field(..., alias="categoryName")
    slug: Optional[str] = None
    fields: List[SpecFieldDefinition] = Field(default_factory=list)


class CategoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: str
    name: str
    slug: str
    description: Optional[str] = None
    icon: Optional[str] = None
    product_count: int = Field(default=0, alias="productCount")
