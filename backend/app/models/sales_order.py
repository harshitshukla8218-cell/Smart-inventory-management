import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, Numeric, ForeignKey, Text, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import enum
from app.core.database import Base


class SalesOrderStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    PENDING = "PENDING"
    PROCESSING = "PROCESSING"
    PARTIALLY_ALLOCATED = "PARTIALLY_ALLOCATED"
    FULLY_ALLOCATED = "FULLY_ALLOCATED"
    AWAITING_STOCK = "AWAITING_STOCK"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


class OrderPriority(str, enum.Enum):
    LOW = "LOW"
    NORMAL = "NORMAL"
    HIGH = "HIGH"
    URGENT = "URGENT"


class SalesOrder(Base):
    __tablename__ = "sales_orders"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_number = Column(String(50), unique=True, nullable=False)
    customer_name = Column(String(255), nullable=False)
    customer_email = Column(String(255))
    customer_phone = Column(String(20))
    status = Column(Enum(SalesOrderStatus), default=SalesOrderStatus.PENDING, nullable=False)
    priority = Column(Enum(OrderPriority), default=OrderPriority.NORMAL)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    warehouse_id = Column(UUID(as_uuid=True), ForeignKey("warehouses.id"), nullable=True)
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    creator = relationship("User", foreign_keys=[created_by])
    warehouse = relationship("Warehouse")
    items = relationship("SalesOrderItem", back_populates="sales_order", cascade="all, delete-orphan")
    allocations = relationship("ProductAllocation", back_populates="sales_order")
    procurement_requests = relationship(
        "ProcurementRequest",
        back_populates="sales_order",
        foreign_keys="ProcurementRequest.sales_order_id",
    )


class SalesOrderItem(Base):
    __tablename__ = "sales_order_items"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    sales_order_id = Column(UUID(as_uuid=True), ForeignKey("sales_orders.id"), nullable=False)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=False)
    quantity_requested = Column(Integer, nullable=False)
    quantity_allocated = Column(Integer, default=0)
    quantity_pending = Column(Integer, default=0)
    unit_price = Column(Numeric(12, 2), default=0)
    notes = Column(Text)
    sales_order = relationship("SalesOrder", back_populates="items")
    product = relationship("Product")
    allocations = relationship("ProductAllocation", back_populates="sales_order_item")
