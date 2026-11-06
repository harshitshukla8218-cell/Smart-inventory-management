import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Text, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import enum
from app.core.database import Base


class AllocationStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    RELEASED = "RELEASED"
    FULFILLED = "FULFILLED"
    CANCELLED = "CANCELLED"


class ProductAllocation(Base):
    __tablename__ = "product_allocations"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    sales_order_id = Column(UUID(as_uuid=True), ForeignKey("sales_orders.id"), nullable=False)
    sales_order_item_id = Column(UUID(as_uuid=True), ForeignKey("sales_order_items.id"), nullable=False)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=False)
    inventory_id = Column(UUID(as_uuid=True), ForeignKey("inventory.id"), nullable=False)
    quantity_allocated = Column(Integer, nullable=False)
    allocated_at = Column(DateTime, default=datetime.utcnow)
    allocated_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    status = Column(Enum(AllocationStatus), default=AllocationStatus.ACTIVE)
    notes = Column(Text)
    sales_order = relationship("SalesOrder", back_populates="allocations")
    sales_order_item = relationship("SalesOrderItem", back_populates="allocations")
    product = relationship("Product")
    inventory = relationship("Inventory", back_populates="allocations")
    allocator = relationship("User", foreign_keys=[allocated_by])
