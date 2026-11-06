import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Date, DateTime, Numeric, ForeignKey, Text, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import enum
from app.core.database import Base


class POStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    ORDERED = "ORDERED"
    SHIPPED = "SHIPPED"
    PARTIALLY_RECEIVED = "PARTIALLY_RECEIVED"
    RECEIVED = "RECEIVED"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


class PaymentStatus(str, enum.Enum):
    PENDING = "PENDING"
    PARTIAL = "PARTIAL"
    PAID = "PAID"


class PurchaseOrder(Base):
    __tablename__ = "purchase_orders"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    po_number = Column(String(50), unique=True, nullable=False)
    vendor_id = Column(UUID(as_uuid=True), ForeignKey("vendors.id"), nullable=False)
    procurement_request_id = Column(UUID(as_uuid=True), ForeignKey("procurement_requests.id"), nullable=True)
    status = Column(Enum(POStatus), default=POStatus.DRAFT, nullable=False)
    order_date = Column(DateTime, default=datetime.utcnow)
    expected_delivery_date = Column(Date, nullable=True)
    payment_status = Column(Enum(PaymentStatus), default=PaymentStatus.PENDING)
    total_amount = Column(Numeric(14, 2), default=0)
    notes = Column(Text)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    vendor = relationship("Vendor", back_populates="purchase_orders")
    procurement_request = relationship("ProcurementRequest", back_populates="purchase_orders")
    items = relationship("PurchaseOrderItem", back_populates="purchase_order", cascade="all, delete-orphan")
    creator = relationship("User", foreign_keys=[created_by])
    receipts = relationship("WarehouseReceipt", back_populates="purchase_order")


class PurchaseOrderItem(Base):
    __tablename__ = "purchase_order_items"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    purchase_order_id = Column(UUID(as_uuid=True), ForeignKey("purchase_orders.id"), nullable=False)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=False)
    quantity_ordered = Column(Integer, nullable=False)
    quantity_received = Column(Integer, default=0)
    unit_price = Column(Numeric(12, 2), nullable=False)
    total_price = Column(Numeric(14, 2), nullable=False)
    notes = Column(Text)
    purchase_order = relationship("PurchaseOrder", back_populates="items")
    product = relationship("Product")
