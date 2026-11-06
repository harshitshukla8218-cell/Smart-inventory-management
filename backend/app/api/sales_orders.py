from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from typing import List, Optional
from uuid import UUID
from datetime import datetime
from app.core.database import get_db
from app.api.deps import get_current_user, require_sales
from app.models.user import User
from app.models.sales_order import SalesOrder, SalesOrderItem, SalesOrderStatus
from app.schemas.sales_order import SalesOrderCreate, SalesOrderUpdate, SalesOrderResponse
from app.services.allocation_service import allocate_sales_order

router = APIRouter(prefix="/sales-orders", tags=["Sales Orders"])


async def generate_order_number(db: AsyncSession) -> str:
    result = await db.execute(select(func.count(SalesOrder.id)))
    count = result.scalar() or 0
    return f"SO-{datetime.now().year}-{str(count + 1).zfill(5)}"


@router.get("/", response_model=List[SalesOrderResponse])
async def list_sales_orders(
    skip: int = 0,
    limit: int = Query(default=50, le=200),
    status_filter: Optional[SalesOrderStatus] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = select(SalesOrder).options(selectinload(SalesOrder.items))
    if status_filter:
        query = query.where(SalesOrder.status == status_filter)
    query = query.order_by(SalesOrder.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/", response_model=SalesOrderResponse, status_code=status.HTTP_201_CREATED)
async def create_sales_order(
    request: SalesOrderCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_sales),
):
    order_number = await generate_order_number(db)

    order = SalesOrder(
        order_number=order_number,
        customer_name=request.customer_name,
        customer_email=request.customer_email,
        customer_phone=request.customer_phone,
        priority=request.priority,
        warehouse_id=request.warehouse_id,
        notes=request.notes,
        created_by=current_user.id,
        status=SalesOrderStatus.PENDING,
    )
    db.add(order)
    await db.flush()

    for item_data in request.items:
        item = SalesOrderItem(
            sales_order_id=order.id,
            product_id=item_data.product_id,
            quantity_requested=item_data.quantity_requested,
            unit_price=item_data.unit_price,
            notes=item_data.notes,
        )
        db.add(item)

    await db.flush()

    # Notify
    from app.services.notification_service import create_notification_for_role
    from app.models.notification import NotificationType, ReferenceType
    from app.models.user import UserRole

    await create_notification_for_role(
        role=UserRole.INVENTORY,
        notification_type=NotificationType.ORDER_CREATED,
        title="New Sales Order",
        message=f"Sales order {order_number} created for {request.customer_name}.",
        reference_type=ReferenceType.SALES_ORDER,
        reference_id=order.id,
        db=db,
    )

    # Auto-allocate
    order.status = SalesOrderStatus.PROCESSING
    await db.flush()
    allocation_result = await allocate_sales_order(order.id, current_user, db)

    await db.commit()
    await db.refresh(order)
    return order


@router.get("/{order_id}", response_model=SalesOrderResponse)
async def get_sales_order(
    order_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(SalesOrder).options(selectinload(SalesOrder.items)).where(SalesOrder.id == order_id)
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Sales order not found")
    return order


@router.put("/{order_id}", response_model=SalesOrderResponse)
async def update_sales_order(
    order_id: UUID,
    request: SalesOrderUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_sales),
):
    result = await db.execute(
        select(SalesOrder).options(selectinload(SalesOrder.items)).where(SalesOrder.id == order_id)
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Sales order not found")
    for field, value in request.model_dump(exclude_unset=True).items():
        setattr(order, field, value)
    await db.commit()
    await db.refresh(order)
    return order


@router.post("/{order_id}/allocate", response_model=SalesOrderResponse)
async def manually_allocate_order(
    order_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_sales),
):
    result_dict = await allocate_sales_order(order_id, current_user, db)
    if not result_dict.get("success"):
        raise HTTPException(status_code=404, detail=result_dict.get("message", "Allocation failed"))
    await db.commit()

    result = await db.execute(
        select(SalesOrder).options(selectinload(SalesOrder.items)).where(SalesOrder.id == order_id)
    )
    order = result.scalar_one_or_none()
    return order


@router.delete("/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
async def cancel_sales_order(
    order_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_sales),
):
    result = await db.execute(select(SalesOrder).where(SalesOrder.id == order_id))
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Sales order not found")
    if order.status == SalesOrderStatus.COMPLETED:
        raise HTTPException(status_code=400, detail="Cannot cancel a completed order")
    order.status = SalesOrderStatus.CANCELLED
    await db.commit()
