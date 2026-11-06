import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Text, Enum
from sqlalchemy.orm import relationship, foreign
from sqlalchemy.dialects.postgresql import UUID
import enum
from app.core.database import Base


class NotificationType(str, enum.Enum):
    STOCK_OUT = "STOCK_OUT"
    LOW_STOCK = "LOW_STOCK"
    PROCUREMENT_REQUEST = "PROCUREMENT_REQUEST"
    VENDOR_COMPARISON = "VENDOR_COMPARISON"
    APPROVAL_REQUIRED = "APPROVAL_REQUIRED"
    PO_GENERATED = "PO_GENERATED"
    SHIPPED = "SHIPPED"
    ARRIVED = "ARRIVED"
    INVENTORY_UPDATED = "INVENTORY_UPDATED"
    ORDER_CREATED = "ORDER_CREATED"
    ALLOCATED = "ALLOCATED"
    PARTIALLY_FULFILLED = "PARTIALLY_FULFILLED"
    COMPLETED = "COMPLETED"


class ReferenceType(str, enum.Enum):
    PROCUREMENT = "PROCUREMENT"
    PURCHASE_ORDER = "PURCHASE_ORDER"
    SALES_ORDER = "SALES_ORDER"
    INVENTORY = "INVENTORY"
    WAREHOUSE_RECEIPT = "WAREHOUSE_RECEIPT"


class Notification(Base):
    __tablename__ = "notifications"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    type = Column(Enum(NotificationType), nullable=False)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    reference_type = Column(Enum(ReferenceType), nullable=True)
    reference_id = Column(UUID(as_uuid=True), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    user = relationship("User", back_populates="notifications", foreign_keys=[user_id])


class ApprovalRequest(Base):
    __tablename__ = "approval_requests"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    reference_type = Column(String(50), nullable=False)
    reference_id = Column(UUID(as_uuid=True), nullable=False)
    requested_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    approved_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    status = Column(String(20), default="PENDING")
    comments = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)
    requester = relationship("User", foreign_keys=[requested_by])
    approver = relationship("User", foreign_keys=[approved_by])
    procurement_request = relationship(
        "ProcurementRequest",
        primaryjoin="and_(foreign(ApprovalRequest.reference_id) == ProcurementRequest.id, ApprovalRequest.reference_type == 'PROCUREMENT')",
        back_populates="approval_requests",
        viewonly=True,
    )


class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    action = Column(String(100), nullable=False)
    table_name = Column(String(100))
    record_id = Column(UUID(as_uuid=True), nullable=True)
    old_values = Column(Text)
    new_values = Column(Text)
    ip_address = Column(String(45))
    created_at = Column(DateTime, default=datetime.utcnow)
    user = relationship("User", back_populates="audit_logs")
