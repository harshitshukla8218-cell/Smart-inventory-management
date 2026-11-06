import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, Numeric, ForeignKey, Text, Enum
from sqlalchemy.orm import relationship, foreign
from sqlalchemy.dialects.postgresql import UUID
import enum
from app.core.database import Base


class ProcurementStatus(str, enum.Enum):
    PENDING_REVIEW = "PENDING_REVIEW"
    UNDER_EVALUATION = "UNDER_EVALUATION"
    VENDOR_SELECTED = "VENDOR_SELECTED"
    APPROVAL_PENDING = "APPROVAL_PENDING"
    APPROVED = "APPROVED"
    PO_CREATED = "PO_CREATED"
    ORDERED = "ORDERED"
    SHIPPED = "SHIPPED"
    PARTIALLY_RECEIVED = "PARTIALLY_RECEIVED"
    RECEIVED = "RECEIVED"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


class ProcurementRequest(Base):
    __tablename__ = "procurement_requests"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    request_number = Column(String(50), unique=True, nullable=False)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=False)
    required_quantity = Column(Integer, nullable=False)
    available_quantity = Column(Integer, nullable=False, default=0)
    shortage_quantity = Column(Integer, nullable=False)
    status = Column(Enum(ProcurementStatus), default=ProcurementStatus.PENDING_REVIEW, nullable=False)
    requested_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    assigned_to = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    selected_vendor_id = Column(UUID(as_uuid=True), ForeignKey("vendors.id"), nullable=True)
    estimated_total_cost = Column(Numeric(14, 2), nullable=True)
    sales_order_id = Column(UUID(as_uuid=True), ForeignKey("sales_orders.id"), nullable=True)
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    product = relationship("Product")
    requester = relationship("User", foreign_keys=[requested_by])
    assignee = relationship("User", foreign_keys=[assigned_to])
    selected_vendor = relationship(
        "Vendor",
        back_populates="procurement_requests",
        foreign_keys=[selected_vendor_id],
    )
    sales_order = relationship("SalesOrder", foreign_keys=[sales_order_id])
    purchase_orders = relationship("PurchaseOrder", back_populates="procurement_request")
    approval_requests = relationship(
        "ApprovalRequest",
        back_populates="procurement_request",
        primaryjoin="and_(foreign(ApprovalRequest.reference_id) == ProcurementRequest.id, ApprovalRequest.reference_type == 'PROCUREMENT')",
        viewonly=True,
    )
