from pydantic import BaseModel
from typing import Optional, List
from uuid import UUID
from datetime import datetime
from decimal import Decimal
from app.models.vendor import VendorPlatform


class VendorCreate(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    website: Optional[str] = None
    rating: Optional[Decimal] = None


class VendorUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    website: Optional[str] = None
    rating: Optional[Decimal] = None
    is_active: Optional[bool] = None


class VendorResponse(BaseModel):
    id: UUID
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    website: Optional[str] = None
    rating: Optional[Decimal] = None
    is_active: bool
    created_at: datetime
    model_config = {"from_attributes": True}


class VendorProductCreate(BaseModel):
    vendor_id: UUID
    product_id: UUID
    external_product_name: Optional[str] = None
    unit_price: Decimal
    available_quantity: int = 0
    delivery_days_estimate: int = 7
    delivery_charges: Decimal = Decimal("0")
    product_url: Optional[str] = None
    product_image_url: Optional[str] = None
    platform: VendorPlatform = VendorPlatform.OTHER
    rating: Optional[Decimal] = None


class VendorProductUpdate(BaseModel):
    external_product_name: Optional[str] = None
    unit_price: Optional[Decimal] = None
    available_quantity: Optional[int] = None
    delivery_days_estimate: Optional[int] = None
    delivery_charges: Optional[Decimal] = None
    product_url: Optional[str] = None
    product_image_url: Optional[str] = None
    platform: Optional[VendorPlatform] = None
    rating: Optional[Decimal] = None


class VendorProductResponse(BaseModel):
    id: UUID
    vendor_id: UUID
    product_id: UUID
    external_product_name: Optional[str] = None
    unit_price: Decimal
    available_quantity: int
    delivery_days_estimate: int
    delivery_charges: Decimal
    product_url: Optional[str] = None
    product_image_url: Optional[str] = None
    platform: VendorPlatform
    rating: Optional[Decimal] = None
    last_synced_at: datetime
    model_config = {"from_attributes": True}


class VendorComparisonItem(BaseModel):
    vendor_id: UUID
    vendor_name: str
    unit_price: Decimal
    delivery_days_estimate: int
    delivery_charges: Decimal
    total_cost: Decimal
    available_quantity: int
    platform: str
    rating: Optional[Decimal] = None
    model_config = {"from_attributes": True}
