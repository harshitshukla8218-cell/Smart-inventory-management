from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime
from decimal import Decimal


class CategoryCreate(BaseModel):
    name: str
    description: Optional[str] = None
    parent_id: Optional[UUID] = None


class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    parent_id: Optional[UUID] = None


class CategoryResponse(BaseModel):
    id: UUID
    name: str
    description: Optional[str] = None
    parent_id: Optional[UUID] = None
    model_config = {"from_attributes": True}


class ProductCreate(BaseModel):
    sku: str
    name: str
    description: Optional[str] = None
    brand: Optional[str] = None
    model_number: Optional[str] = None
    category_id: Optional[UUID] = None
    unit_price: Decimal = Decimal("0")
    image_url: Optional[str] = None


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    brand: Optional[str] = None
    model_number: Optional[str] = None
    category_id: Optional[UUID] = None
    unit_price: Optional[Decimal] = None
    image_url: Optional[str] = None
    is_active: Optional[bool] = None


class ProductResponse(BaseModel):
    id: UUID
    sku: str
    name: str
    description: Optional[str] = None
    brand: Optional[str] = None
    model_number: Optional[str] = None
    category_id: Optional[UUID] = None
    unit_price: Decimal
    image_url: Optional[str] = None
    is_active: bool
    created_at: datetime
    model_config = {"from_attributes": True}
