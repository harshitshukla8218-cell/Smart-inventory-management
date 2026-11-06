import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Text, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import enum
from app.core.database import Base


class ReceiptStatus(str, enum.Enum):
    PENDING = "PENDING"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    PARTIAL = "PARTIAL"


class ItemCondition(str, enum.Enum):
    GOOD = "GOOD"
    DAMAGED = "DAMAGED"
    PARTIAL = "PARTIAL"


class WarehouseReceipt(Base):
    __tablename__ = "warehouse_receipts"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    receipt_number = Column(String(50), unique=True, nullable=False)
    purchase_order_id = Column(UUID(as_uuid=True), ForeignKey("purchase_orders.id"), nullable=True)
    warehouse_id = Column(UUID(as_uuid=True), ForeignKey("warehouses.id"), nullable=False)
    received_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    receipt_date = Column(DateTime, default=datetime.utcnow)
    status = Column(Enum(ReceiptStatus), default=ReceiptStatus.PENDING, nullable=False)
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    purchase_order = relationship("PurchaseOrder", back_populates="receipts")
    warehouse = relationship("Warehouse", back_populates="receipts")
    receiver = relationship("User", foreign_keys=[received_by])
    items = relationship("WarehouseReceiptItem", back_populates="receipt", cascade="all, delete-orphan")


class WarehouseReceiptItem(Base):
    __tablename__ = "warehouse_receipt_items"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    warehouse_receipt_id = Column(UUID(as_uuid=True), ForeignKey("warehouse_receipts.id"), nullable=False)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=False)
    purchase_order_item_id = Column(UUID(as_uuid=True), ForeignKey("purchase_order_items.id"), nullable=True)
    expected_quantity = Column(Integer, nullable=False)
    received_quantity = Column(Integer, default=0)
    damaged_quantity = Column(Integer, default=0)
    condition = Column(Enum(ItemCondition), default=ItemCondition.GOOD)
    notes = Column(Text)
    receipt = relationship("WarehouseReceipt", back_populates="items")
    product = relationship("Product")
    po_item = relationship("PurchaseOrderItem", foreign_keys=[purchase_order_item_id])
