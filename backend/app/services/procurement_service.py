from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.models.procurement import ProcurementRequest, ProcurementStatus
import uuid
from datetime import datetime


async def generate_request_number(db: AsyncSession) -> str:
    result = await db.execute(select(func.count(ProcurementRequest.id)))
    count = result.scalar() or 0
    return f"PR-{datetime.now().year}-{str(count + 1).zfill(4)}"


async def create_procurement_request_auto(
    product_id: uuid.UUID,
    required_quantity: int,
    available_quantity: int,
    shortage_quantity: int,
    requested_by: uuid.UUID,
    sales_order_id: uuid.UUID = None,
    db: AsyncSession = None,
) -> ProcurementRequest:
    request_number = await generate_request_number(db)
    pr = ProcurementRequest(
        request_number=request_number,
        product_id=product_id,
        required_quantity=required_quantity,
        available_quantity=available_quantity,
        shortage_quantity=shortage_quantity,
        status=ProcurementStatus.PENDING_REVIEW,
        requested_by=requested_by,
        sales_order_id=sales_order_id,
    )
    db.add(pr)
    await db.flush()

    # Notify procurement team
    from app.services.notification_service import create_notification_for_role
    from app.models.notification import NotificationType, ReferenceType
    from app.models.user import UserRole

    await create_notification_for_role(
        role=UserRole.PROCUREMENT,
        notification_type=NotificationType.PROCUREMENT_REQUEST,
        title="New Procurement Request",
        message=f"Procurement request {request_number} created. Shortage: {shortage_quantity} units.",
        reference_type=ReferenceType.PROCUREMENT,
        reference_id=pr.id,
        db=db,
    )

    return pr
