from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from uuid import UUID
from datetime import datetime
from app.core.database import get_db
from app.api.deps import get_current_user, require_management
from app.models.user import User
from app.models.notification import Notification, ApprovalRequest
from app.models.procurement import ProcurementRequest, ProcurementStatus
from app.schemas.notification import NotificationResponse, ApprovalRequestResponse, ApprovalAction

router = APIRouter(prefix="/notifications", tags=["Notifications"])
approval_router = APIRouter(prefix="/approvals", tags=["Approvals"])


@router.get("/", response_model=List[NotificationResponse])
async def list_notifications(
    skip: int = 0,
    limit: int = Query(default=50, le=100),
    unread_only: bool = False,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = select(Notification).where(Notification.user_id == current_user.id)
    if unread_only:
        query = query.where(Notification.is_read == False)
    query = query.order_by(Notification.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/{notification_id}/read", status_code=status.HTTP_204_NO_CONTENT)
async def mark_notification_read(
    notification_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Notification).where(
            Notification.id == notification_id,
            Notification.user_id == current_user.id,
        )
    )
    notif = result.scalar_one_or_none()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    notif.is_read = True
    await db.commit()


@router.post("/read-all", status_code=status.HTTP_204_NO_CONTENT)
async def mark_all_notifications_read(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Notification).where(
            Notification.user_id == current_user.id,
            Notification.is_read == False,
        )
    )
    notifications = result.scalars().all()
    for n in notifications:
        n.is_read = True
    await db.commit()


# Approvals
@approval_router.get("/", response_model=List[ApprovalRequestResponse])
async def list_approval_requests(
    skip: int = 0,
    limit: int = Query(default=50, le=100),
    status_filter: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_management),
):
    query = select(ApprovalRequest)
    if status_filter:
        query = query.where(ApprovalRequest.status == status_filter)
    query = query.order_by(ApprovalRequest.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()


@approval_router.post("/{approval_id}/action", response_model=ApprovalRequestResponse)
async def process_approval(
    approval_id: UUID,
    action: ApprovalAction,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_management),
):
    result = await db.execute(select(ApprovalRequest).where(ApprovalRequest.id == approval_id))
    approval = result.scalar_one_or_none()
    if not approval:
        raise HTTPException(status_code=404, detail="Approval request not found")
    if approval.status != "PENDING":
        raise HTTPException(status_code=400, detail="Approval already processed")

    if action.action not in ["approve", "reject"]:
        raise HTTPException(status_code=400, detail="Action must be 'approve' or 'reject'")

    approval.status = "APPROVED" if action.action == "approve" else "REJECTED"
    approval.approved_by = current_user.id
    approval.comments = action.comments
    approval.resolved_at = datetime.utcnow()

    # Update linked procurement request
    if approval.reference_type == "PROCUREMENT":
        pr_result = await db.execute(
            select(ProcurementRequest).where(ProcurementRequest.id == approval.reference_id)
        )
        pr = pr_result.scalar_one_or_none()
        if pr:
            pr.status = ProcurementStatus.APPROVED if action.action == "approve" else ProcurementStatus.CANCELLED

    await db.commit()
    await db.refresh(approval)
    return approval
