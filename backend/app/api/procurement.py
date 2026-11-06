from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List, Optional
from uuid import UUID
from app.core.database import get_db
from app.api.deps import get_current_user, require_procurement
from app.models.user import User
from app.models.procurement import ProcurementRequest, ProcurementStatus
from app.models.notification import ApprovalRequest
from app.schemas.procurement import ProcurementRequestCreate, ProcurementRequestUpdate, ProcurementRequestResponse
from app.services.procurement_service import generate_request_number, create_procurement_request_auto

router = APIRouter(prefix="/procurement", tags=["Procurement"])


@router.get("/", response_model=List[ProcurementRequestResponse])
async def list_procurement_requests(
    skip: int = 0,
    limit: int = Query(default=50, le=200),
    status_filter: Optional[ProcurementStatus] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = select(ProcurementRequest)
    if status_filter:
        query = query.where(ProcurementRequest.status == status_filter)
    query = query.order_by(ProcurementRequest.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/", response_model=ProcurementRequestResponse, status_code=status.HTTP_201_CREATED)
async def create_procurement_request(
    request: ProcurementRequestCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    pr = await create_procurement_request_auto(
        product_id=request.product_id,
        required_quantity=request.required_quantity,
        available_quantity=0,
        shortage_quantity=request.required_quantity,
        requested_by=current_user.id,
        sales_order_id=request.sales_order_id,
        db=db,
    )
    if request.notes:
        pr.notes = request.notes
    await db.commit()
    await db.refresh(pr)
    return pr


@router.get("/{pr_id}", response_model=ProcurementRequestResponse)
async def get_procurement_request(
    pr_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(ProcurementRequest).where(ProcurementRequest.id == pr_id))
    pr = result.scalar_one_or_none()
    if not pr:
        raise HTTPException(status_code=404, detail="Procurement request not found")
    return pr


@router.put("/{pr_id}", response_model=ProcurementRequestResponse)
async def update_procurement_request(
    pr_id: UUID,
    request: ProcurementRequestUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_procurement),
):
    result = await db.execute(select(ProcurementRequest).where(ProcurementRequest.id == pr_id))
    pr = result.scalar_one_or_none()
    if not pr:
        raise HTTPException(status_code=404, detail="Procurement request not found")

    for field, value in request.model_dump(exclude_unset=True).items():
        setattr(pr, field, value)

    # If status changes to APPROVAL_PENDING, create an ApprovalRequest
    if request.status == ProcurementStatus.APPROVAL_PENDING:
        approval = ApprovalRequest(
            reference_type="PROCUREMENT",
            reference_id=pr.id,
            requested_by=current_user.id,
        )
        db.add(approval)

        from app.services.notification_service import create_notification_for_role
        from app.models.notification import NotificationType, ReferenceType
        from app.models.user import UserRole

        await create_notification_for_role(
            role=UserRole.MANAGEMENT,
            notification_type=NotificationType.APPROVAL_REQUIRED,
            title="Approval Required",
            message=f"Procurement request {pr.request_number} requires approval.",
            reference_type=ReferenceType.PROCUREMENT,
            reference_id=pr.id,
            db=db,
        )

    await db.commit()
    await db.refresh(pr)
    return pr


@router.delete("/{pr_id}", status_code=status.HTTP_204_NO_CONTENT)
async def cancel_procurement_request(
    pr_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_procurement),
):
    result = await db.execute(select(ProcurementRequest).where(ProcurementRequest.id == pr_id))
    pr = result.scalar_one_or_none()
    if not pr:
        raise HTTPException(status_code=404, detail="Procurement request not found")
    pr.status = ProcurementStatus.CANCELLED
    await db.commit()
