from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime
from app.models.notification import NotificationType, ReferenceType


class NotificationResponse(BaseModel):
    id: UUID
    user_id: Optional[UUID] = None
    type: NotificationType
    title: str
    message: str
    is_read: bool
    reference_type: Optional[ReferenceType] = None
    reference_id: Optional[UUID] = None
    created_at: datetime
    model_config = {"from_attributes": True}


class ApprovalRequestResponse(BaseModel):
    id: UUID
    reference_type: str
    reference_id: UUID
    requested_by: UUID
    approved_by: Optional[UUID] = None
    status: str
    comments: Optional[str] = None
    created_at: datetime
    resolved_at: Optional[datetime] = None
    model_config = {"from_attributes": True}


class ApprovalAction(BaseModel):
    action: str  # "approve" or "reject"
    comments: Optional[str] = None
