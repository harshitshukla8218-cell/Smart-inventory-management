import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Boolean, DateTime, Numeric, ForeignKey, Text, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import enum
from app.core.database import Base


class VendorPlatform(str, enum.Enum):
    AMAZON = "AMAZON"
    FLIPKART = "FLIPKART"
    MEESHO = "MEESHO"
    OTHER = "OTHER"


class Vendor(Base):
    __tablename__ = "vendors"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    email = Column(String(255))
    phone = Column(String(20))
    address = Column(Text)
    website = Column(String(500))
    rating = Column(Numeric(3, 2), default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    vendor_products = relationship("VendorProduct", back_populates="vendor")
    procurement_requests = relationship(
        "ProcurementRequest",
        back_populates="selected_vendor",
        foreign_keys="ProcurementRequest.selected_vendor_id",
    )
    purchase_orders = relationship("PurchaseOrder", back_populates="vendor")


class VendorProduct(Base):
    __tablename__ = "vendor_products"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    vendor_id = Column(UUID(as_uuid=True), ForeignKey("vendors.id"), nullable=False)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=False)
    external_product_name = Column(String(500))
    unit_price = Column(Numeric(12, 2), nullable=False)
    available_quantity = Column(Integer, default=0)
    delivery_days_estimate = Column(Integer, default=7)
    delivery_charges = Column(Numeric(10, 2), default=0)
    product_url = Column(String(1000))
    product_image_url = Column(String(1000))
    platform = Column(Enum(VendorPlatform), default=VendorPlatform.OTHER)
    rating = Column(Numeric(3, 2), default=0)
    last_synced_at = Column(DateTime, default=datetime.utcnow)
    vendor = relationship("Vendor", back_populates="vendor_products")
    product = relationship("Product", back_populates="vendor_products")
    price_history = relationship("VendorPriceHistory", back_populates="vendor_product")


class VendorPriceHistory(Base):
    __tablename__ = "vendor_price_history"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    vendor_product_id = Column(UUID(as_uuid=True), ForeignKey("vendor_products.id"), nullable=False)
    price = Column(Numeric(12, 2), nullable=False)
    recorded_at = Column(DateTime, default=datetime.utcnow)
    vendor_product = relationship("VendorProduct", back_populates="price_history")
