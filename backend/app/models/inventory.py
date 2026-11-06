import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey, Text, Enum, CheckConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import enum
from app.core.database import Base


class TransactionType(str, enum.Enum):
    RECEIPT = "RECEIPT"
    ISSUE = "ISSUE"
    ADJUSTMENT = "ADJUSTMENT"
    RESERVATION = "RESERVATION"
    ALLOCATION = "ALLOCATION"
    RETURN = "RETURN"
    DAMAGE = "DAMAGE"


class Warehouse(Base):
    __tablename__ = "warehouses"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False)
    location = Column(String(255))
    address = Column(Text)
    manager_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    manager = relationship("User", foreign_keys=[manager_id])
    inventory_records = relationship("Inventory", back_populates="warehouse")
    receipts = relationship("WarehouseReceipt", back_populates="warehouse")


class Inventory(Base):
    __tablename__ = "inventory"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=False)
    warehouse_id = Column(UUID(as_uuid=True), ForeignKey("warehouses.id"), nullable=False)
    total_quantity = Column(Integer, nullable=False, default=0)
    available_quantity = Column(Integer, nullable=False, default=0)
    reserved_quantity = Column(Integer, nullable=False, default=0)
    incoming_quantity = Column(Integer, nullable=False, default=0)
    damaged_quantity = Column(Integer, nullable=False, default=0)
    min_stock_level = Column(Integer, default=10)
    reorder_level = Column(Integer, default=20)
    last_updated = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    updated_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    __table_args__ = (
        CheckConstraint("available_quantity >= 0", name="chk_available_non_negative"),
        CheckConstraint("reserved_quantity >= 0", name="chk_reserved_non_negative"),
        CheckConstraint("total_quantity >= 0", name="chk_total_non_negative"),
    )
    product = relationship("Product", back_populates="inventory_records")
    warehouse = relationship("Warehouse", back_populates="inventory_records")
    updater = relationship("User", foreign_keys=[updated_by])
    transactions = relationship("InventoryTransaction", back_populates="inventory")
    allocations = relationship("ProductAllocation", back_populates="inventory")


class InventoryTransaction(Base):
    __tablename__ = "inventory_transactions"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    inventory_id = Column(UUID(as_uuid=True), ForeignKey("inventory.id"), nullable=False)
    transaction_type = Column(Enum(TransactionType), nullable=False)
    quantity_change = Column(Integer, nullable=False)
    quantity_before = Column(Integer, nullable=False)
    quantity_after = Column(Integer, nullable=False)
    reference_type = Column(String(50))
    reference_id = Column(UUID(as_uuid=True), nullable=True)
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    inventory = relationship("Inventory", back_populates="transactions")
    creator = relationship("User", foreign_keys=[created_by])
