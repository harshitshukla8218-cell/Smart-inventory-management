from pydantic import BaseModel
from typing import Optional, List
from uuid import UUID
from datetime import datetime
from decimal import Decimal
from app.models.sales_order import SalesOrderStatus, OrderPriority


class SalesOrderItemCreate(BaseModel):
    product_id: UUID
    quantity_requested: int
    unit_price: Decimal = Decimal("0")
    notes: Optional[str] = None


class SalesOrderItemResponse(BaseModel):
    id: UUID
    sales_order_id: UUID
    product_id: UUID
    quantity_requested: int
    quantity_allocated: int
    quantity_pending: int
    unit_price: Decimal
    notes: Optional[str] = None
    model_config = {"from_attributes": True}


class SalesOrderCreate(BaseModel):
    customer_name: str
    customer_email: Optional[str] = None
    customer_phone: Optional[str] = None
    priority: OrderPriority = OrderPriority.NORMAL
    warehouse_id: Optional[UUID] = None
    notes: Optional[str] = None
    items: List[SalesOrderItemCreate]


class SalesOrderUpdate(BaseModel):
    customer_name: Optional[str] = None
    customer_email: Optional[str] = None
    customer_phone: Optional[str] = None
    status: Optional[SalesOrderStatus] = None
    priority: Optional[OrderPriority] = None
    warehouse_id: Optional[UUID] = None
    notes: Optional[str] = None


class SalesOrderResponse(BaseModel):
    id: UUID
    order_number: str
    customer_name: str
    customer_email: Optional[str] = None
    customer_phone: Optional[str] = None
    status: SalesOrderStatus
    priority: OrderPriority
    created_by: Optional[UUID] = None
    warehouse_id: Optional[UUID] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    items: List[SalesOrderItemResponse] = []
    model_config = {"from_attributes": True}
