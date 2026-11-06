from pydantic import BaseModel
from typing import Optional, List
from uuid import UUID
from datetime import datetime
from app.models.warehouse import ReceiptStatus, ItemCondition


class WarehouseReceiptItemCreate(BaseModel):
    product_id: UUID
    purchase_order_item_id: Optional[UUID] = None
    expected_quantity: int
    received_quantity: int = 0
    damaged_quantity: int = 0
    condition: ItemCondition = ItemCondition.GOOD
    notes: Optional[str] = None


class WarehouseReceiptItemResponse(BaseModel):
    id: UUID
    warehouse_receipt_id: UUID
    product_id: UUID
    purchase_order_item_id: Optional[UUID] = None
    expected_quantity: int
    received_quantity: int
    damaged_quantity: int
    condition: ItemCondition
    notes: Optional[str] = None
    model_config = {"from_attributes": True}


class WarehouseReceiptCreate(BaseModel):
    purchase_order_id: Optional[UUID] = None
    warehouse_id: UUID
    notes: Optional[str] = None
    items: List[WarehouseReceiptItemCreate]


class WarehouseReceiptUpdate(BaseModel):
    status: Optional[ReceiptStatus] = None
    notes: Optional[str] = None


class WarehouseReceiptResponse(BaseModel):
    id: UUID
    receipt_number: str
    purchase_order_id: Optional[UUID] = None
    warehouse_id: UUID
    received_by: UUID
    receipt_date: datetime
    status: ReceiptStatus
    notes: Optional[str] = None
    created_at: datetime
    items: List[WarehouseReceiptItemResponse] = []
    model_config = {"from_attributes": True}
