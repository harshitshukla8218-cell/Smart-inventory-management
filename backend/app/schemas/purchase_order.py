from pydantic import BaseModel
from typing import Optional, List
from uuid import UUID
from datetime import datetime, date
from decimal import Decimal
from app.models.purchase_order import POStatus, PaymentStatus


class PurchaseOrderItemCreate(BaseModel):
    product_id: UUID
    quantity_ordered: int
    unit_price: Decimal
    notes: Optional[str] = None


class PurchaseOrderItemUpdate(BaseModel):
    quantity_ordered: Optional[int] = None
    unit_price: Optional[Decimal] = None
    notes: Optional[str] = None


class PurchaseOrderItemResponse(BaseModel):
    id: UUID
    purchase_order_id: UUID
    product_id: UUID
    quantity_ordered: int
    quantity_received: int
    unit_price: Decimal
    total_price: Decimal
    notes: Optional[str] = None
    model_config = {"from_attributes": True}


class PurchaseOrderCreate(BaseModel):
    vendor_id: UUID
    procurement_request_id: Optional[UUID] = None
    expected_delivery_date: Optional[date] = None
    notes: Optional[str] = None
    items: List[PurchaseOrderItemCreate]


class PurchaseOrderUpdate(BaseModel):
    status: Optional[POStatus] = None
    expected_delivery_date: Optional[date] = None
    payment_status: Optional[PaymentStatus] = None
    notes: Optional[str] = None


class PurchaseOrderResponse(BaseModel):
    id: UUID
    po_number: str
    vendor_id: UUID
    procurement_request_id: Optional[UUID] = None
    status: POStatus
    order_date: datetime
    expected_delivery_date: Optional[date] = None
    payment_status: PaymentStatus
    total_amount: Decimal
    notes: Optional[str] = None
    created_at: datetime
    items: List[PurchaseOrderItemResponse] = []
    model_config = {"from_attributes": True}
