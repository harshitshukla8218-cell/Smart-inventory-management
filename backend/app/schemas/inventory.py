from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime
from decimal import Decimal
from app.models.inventory import TransactionType


class WarehouseCreate(BaseModel):
    name: str
    location: Optional[str] = None
    address: Optional[str] = None
    manager_id: Optional[UUID] = None


class WarehouseUpdate(BaseModel):
    name: Optional[str] = None
    location: Optional[str] = None
    address: Optional[str] = None
    manager_id: Optional[UUID] = None
    is_active: Optional[bool] = None


class WarehouseResponse(BaseModel):
    id: UUID
    name: str
    location: Optional[str] = None
    address: Optional[str] = None
    manager_id: Optional[UUID] = None
    is_active: bool
    created_at: datetime
    model_config = {"from_attributes": True}


class InventoryCreate(BaseModel):
    product_id: UUID
    warehouse_id: UUID
    total_quantity: int = 0
    available_quantity: int = 0
    reserved_quantity: int = 0
    incoming_quantity: int = 0
    damaged_quantity: int = 0
    min_stock_level: int = 10
    reorder_level: int = 20


class InventoryUpdate(BaseModel):
    total_quantity: Optional[int] = None
    available_quantity: Optional[int] = None
    reserved_quantity: Optional[int] = None
    incoming_quantity: Optional[int] = None
    damaged_quantity: Optional[int] = None
    min_stock_level: Optional[int] = None
    reorder_level: Optional[int] = None


class InventoryProductSummary(BaseModel):
    id: UUID
    sku: str
    name: str
    brand: Optional[str] = None
    model_config = {"from_attributes": True}


class InventoryWarehouseSummary(BaseModel):
    id: UUID
    name: str
    model_config = {"from_attributes": True}


class InventoryResponse(BaseModel):
    id: UUID
    product_id: UUID
    product: Optional[InventoryProductSummary] = None
    warehouse_id: UUID
    warehouse: Optional[InventoryWarehouseSummary] = None
    total_quantity: int
    available_quantity: int
    reserved_quantity: int
    incoming_quantity: int
    damaged_quantity: int
    min_stock_level: int
    reorder_level: int
    last_updated: Optional[datetime] = None
    model_config = {"from_attributes": True}


class InventoryAdjustRequest(BaseModel):
    quantity_change: int
    transaction_type: TransactionType
    notes: Optional[str] = None


class InventoryTransactionResponse(BaseModel):
    id: UUID
    inventory_id: UUID
    transaction_type: TransactionType
    quantity_change: int
    quantity_before: int
    quantity_after: int
    reference_type: Optional[str] = None
    reference_id: Optional[UUID] = None
    notes: Optional[str] = None
    created_at: datetime
    model_config = {"from_attributes": True}
