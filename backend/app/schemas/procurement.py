from pydantic import BaseModel
from typing import Optional, List
from uuid import UUID
from datetime import datetime
from decimal import Decimal
from app.models.procurement import ProcurementStatus


class ProcurementRequestCreate(BaseModel):
    product_id: UUID
    required_quantity: int
    notes: Optional[str] = None
    sales_order_id: Optional[UUID] = None


class ProcurementRequestUpdate(BaseModel):
    status: Optional[ProcurementStatus] = None
    assigned_to: Optional[UUID] = None
    selected_vendor_id: Optional[UUID] = None
    estimated_total_cost: Optional[Decimal] = None
    notes: Optional[str] = None


class ProcurementRequestResponse(BaseModel):
    id: UUID
    request_number: str
    product_id: UUID
    required_quantity: int
    available_quantity: int
    shortage_quantity: int
    status: ProcurementStatus
    requested_by: UUID
    assigned_to: Optional[UUID] = None
    selected_vendor_id: Optional[UUID] = None
    estimated_total_cost: Optional[Decimal] = None
    sales_order_id: Optional[UUID] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    model_config = {"from_attributes": True}
