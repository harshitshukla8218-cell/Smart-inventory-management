from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from typing import List, Optional
from uuid import UUID
from datetime import datetime
from app.core.database import get_db
from app.api.deps import get_current_user, require_procurement
from app.models.user import User
from app.models.purchase_order import PurchaseOrder, PurchaseOrderItem, POStatus
from app.models.procurement import ProcurementRequest, ProcurementStatus
from app.schemas.purchase_order import (
    PurchaseOrderCreate, PurchaseOrderUpdate, PurchaseOrderResponse, PurchaseOrderItemResponse,
)

router = APIRouter(prefix="/purchase-orders", tags=["Purchase Orders"])


async def generate_po_number(db: AsyncSession) -> str:
    result = await db.execute(select(func.count(PurchaseOrder.id)))
    count = result.scalar() or 0
    return f"PO-{datetime.now().year}-{str(count + 1).zfill(5)}"


@router.get("/", response_model=List[PurchaseOrderResponse])
async def list_purchase_orders(
    skip: int = 0,
    limit: int = Query(default=50, le=200),
    status_filter: Optional[POStatus] = None,
    vendor_id: Optional[UUID] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = select(PurchaseOrder).options(selectinload(PurchaseOrder.items))
    if status_filter:
        query = query.where(PurchaseOrder.status == status_filter)
    if vendor_id:
        query = query.where(PurchaseOrder.vendor_id == vendor_id)
    query = query.order_by(PurchaseOrder.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/", response_model=PurchaseOrderResponse, status_code=status.HTTP_201_CREATED)
async def create_purchase_order(
    request: PurchaseOrderCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_procurement),
):
    po_number = await generate_po_number(db)

    total_amount = sum(item.unit_price * item.quantity_ordered for item in request.items)

    po = PurchaseOrder(
        po_number=po_number,
        vendor_id=request.vendor_id,
        procurement_request_id=request.procurement_request_id,
        expected_delivery_date=request.expected_delivery_date,
        notes=request.notes,
        created_by=current_user.id,
        total_amount=total_amount,
    )
    db.add(po)
    await db.flush()

    for item_data in request.items:
        item = PurchaseOrderItem(
            purchase_order_id=po.id,
            product_id=item_data.product_id,
            quantity_ordered=item_data.quantity_ordered,
            unit_price=item_data.unit_price,
            total_price=item_data.unit_price * item_data.quantity_ordered,
            notes=item_data.notes,
        )
        db.add(item)

    # Update procurement request status if linked
    if request.procurement_request_id:
        pr_result = await db.execute(
            select(ProcurementRequest).where(ProcurementRequest.id == request.procurement_request_id)
        )
        pr = pr_result.scalar_one_or_none()
        if pr:
            pr.status = ProcurementStatus.PO_CREATED

    # Send notification
    from app.services.notification_service import create_notification_for_role
    from app.models.notification import NotificationType, ReferenceType
    from app.models.user import UserRole

    await create_notification_for_role(
        role=UserRole.INVENTORY,
        notification_type=NotificationType.PO_GENERATED,
        title="Purchase Order Created",
        message=f"Purchase order {po_number} created for vendor.",
        reference_type=ReferenceType.PURCHASE_ORDER,
        reference_id=po.id,
        db=db,
    )

    await db.commit()
    await db.refresh(po)
    return po


@router.get("/{po_id}", response_model=PurchaseOrderResponse)
async def get_purchase_order(
    po_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(PurchaseOrder).options(selectinload(PurchaseOrder.items)).where(PurchaseOrder.id == po_id)
    )
    po = result.scalar_one_or_none()
    if not po:
        raise HTTPException(status_code=404, detail="Purchase order not found")
    return po


@router.put("/{po_id}", response_model=PurchaseOrderResponse)
async def update_purchase_order(
    po_id: UUID,
    request: PurchaseOrderUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_procurement),
):
    result = await db.execute(
        select(PurchaseOrder).options(selectinload(PurchaseOrder.items)).where(PurchaseOrder.id == po_id)
    )
    po = result.scalar_one_or_none()
    if not po:
        raise HTTPException(status_code=404, detail="Purchase order not found")

    for field, value in request.model_dump(exclude_unset=True).items():
        setattr(po, field, value)

    await db.commit()
    await db.refresh(po)
    return po


@router.delete("/{po_id}", status_code=status.HTTP_204_NO_CONTENT)
async def cancel_purchase_order(
    po_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_procurement),
):
    result = await db.execute(select(PurchaseOrder).where(PurchaseOrder.id == po_id))
    po = result.scalar_one_or_none()
    if not po:
        raise HTTPException(status_code=404, detail="Purchase order not found")
    if po.status not in [POStatus.DRAFT, POStatus.PENDING]:
        raise HTTPException(status_code=400, detail="Cannot cancel an order that is already processed")
    po.status = POStatus.CANCELLED
    await db.commit()
