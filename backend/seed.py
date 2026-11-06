"""
Comprehensive Database Seed Script for Smart Inventory & Procurement Management System
Populates all 23 entities with realistic enterprise data.
Run with: python seed.py
"""
import asyncio
from datetime import datetime, date, timedelta
import decimal
import uuid

from app.core.database import AsyncSessionLocal, create_tables
from app.core.security import get_password_hash
from app.models.user import User, UserRole, Department
from app.models.product import Product, Category
from app.models.inventory import Warehouse, Inventory, InventoryTransaction, TransactionType
from app.models.vendor import Vendor, VendorProduct, VendorPlatform
from app.models.procurement import ProcurementRequest, ProcurementStatus
from app.models.purchase_order import PurchaseOrder, PurchaseOrderItem, POStatus, PaymentStatus
from app.models.warehouse import WarehouseReceipt, WarehouseReceiptItem, ReceiptStatus, ItemCondition
from app.models.sales_order import SalesOrder, SalesOrderItem, SalesOrderStatus, OrderPriority
from app.models.allocation import ProductAllocation, AllocationStatus
from app.models.notification import Notification, NotificationType, ReferenceType


import sys
import io
if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

async def seed():
    print("⏳ Creating tables...")
    await create_tables()
    print("✅ Tables initialized.")

    async with AsyncSessionLocal() as db:
        print("🌱 Seeding realistic demo data...")

        # 1. DEPARTMENTS
        dept_it = Department(name="IT & Systems", description="IT administration and infrastructure")
        dept_wh = Department(name="Warehouse & Logistics", description="Inventory handling, receipts and dispatches")
        dept_proc = Department(name="Procurement & Sourcing", description="Vendor negotiations, RFQs and purchase orders")
        dept_sales = Department(name="Enterprise Sales", description="B2B client management and sales order creation")
        dept_mgmt = Department(name="Executive Management", description="Strategic analytics and business oversight")
        db.add_all([dept_it, dept_wh, dept_proc, dept_sales, dept_mgmt])
        await db.flush()

        # 2. USERS (Password: Demo@1234 for all)
        password_hash = get_password_hash("Demo@1234")
        users_map = {
            "admin": User(
                email="admin@inventory.com",
                hashed_password=password_hash,
                full_name="Rajesh Sharma (Admin)",
                role=UserRole.ADMIN,
                department_id=dept_it.id,
                is_active=True,
            ),
            "warehouse": User(
                email="warehouse@inventory.com",
                hashed_password=password_hash,
                full_name="Vikram Verma (Warehouse Lead)",
                role=UserRole.INVENTORY,
                department_id=dept_wh.id,
                is_active=True,
            ),
            "procurement": User(
                email="procurement@inventory.com",
                hashed_password=password_hash,
                full_name="Priya Patel (Procurement Lead)",
                role=UserRole.PROCUREMENT,
                department_id=dept_proc.id,
                is_active=True,
            ),
            "sales": User(
                email="sales@inventory.com",
                hashed_password=password_hash,
                full_name="Ananya Roy (Senior Sales)",
                role=UserRole.SALES,
                department_id=dept_sales.id,
                is_active=True,
            ),
            "manager": User(
                email="manager@inventory.com",
                hashed_password=password_hash,
                full_name="Arjun Mehta (VP Operations)",
                role=UserRole.MANAGEMENT,
                department_id=dept_mgmt.id,
                is_active=True,
            ),
        }
        for u in users_map.values():
            db.add(u)
        await db.flush()

        # 3. WAREHOUSES
        wh_mumbai = Warehouse(
            name="Mumbai Central Warehouse",
            location="Bhiwandi, Mumbai",
            address="Plot 42, Logistic Park, Mumbai - 421302",
            manager_id=users_map["warehouse"].id,
            is_active=True,
        )
        wh_delhi = Warehouse(
            name="Delhi North Fulfillment Hub",
            location="Kundli, NCR Delhi",
            address="Industrial Area Phase 2, Sonipat - 131028",
            manager_id=users_map["warehouse"].id,
            is_active=True,
        )
        wh_blr = Warehouse(
            name="Bangalore Tech Distribution Hub",
            location="Peenya Industrial Area, Bengaluru",
            address="Sector 3, Peenya, Bengaluru - 560058",
            manager_id=users_map["warehouse"].id,
            is_active=True,
        )
        db.add_all([wh_mumbai, wh_delhi, wh_blr])
        await db.flush()

        # 4. CATEGORIES
        cat_laptops = Category(name="Laptops & Computing", description="Workstations, Ultrabooks, Enterprise laptops")
        cat_monitors = Category(name="Displays & Monitors", description="4K, Ultrawide, and ergonomic office screens")
        cat_periph = Category(name="Peripherals & Accessories", description="Keyboards, mice, webcams, docks")
        cat_networking = Category(name="Networking & Servers", description="Routers, switches, rack servers, APs")
        cat_furniture = Category(name="Office Infrastructure", description="Ergonomic chairs, motorized standing desks")
        db.add_all([cat_laptops, cat_monitors, cat_periph, cat_networking, cat_furniture])
        await db.flush()

        # 5. PRODUCTS (20 products)
        raw_products = [
            ("HP-LAP-001", "HP EliteBook 840 G10 (i7, 16GB, 512GB)", "HP", "840 G10", cat_laptops.id, 84500, "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=400"),
            ("LN-TP-002", "Lenovo ThinkPad X1 Carbon Gen 11", "Lenovo", "X1 Carbon Gen 11", cat_laptops.id, 138000, "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=400"),
            ("DL-LAT-003", "Dell Latitude 5540 15.6'' FHD", "Dell", "Latitude 5540", cat_laptops.id, 76000, "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400"),
            ("APL-MB-004", "Apple MacBook Pro 14'' (M3 Pro, 18GB)", "Apple", "MBP 14 M3", cat_laptops.id, 199900, "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400"),
            ("DL-MON-005", "Dell UltraSharp 27'' 4K USB-C Hub Monitor", "Dell", "U2723QE", cat_monitors.id, 48500, "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=400"),
            ("LG-MON-006", "LG 34'' UltraWide Curved QHD Ergonomic", "LG", "34WN80C-B", cat_monitors.id, 52000, "https://images.unsplash.com/photo-1586210579191-33b45e38fa2c?w=400"),
            ("SS-MON-007", "Samsung ViewFinity S9 27'' 5K Smart Screen", "Samsung", "S90PC", cat_monitors.id, 89000, "https://images.unsplash.com/photo-1547082299-de196ea013d6?w=400"),
            ("LG-MXK-008", "Logitech MX Master 3S Wireless Mouse", "Logitech", "MX Master 3S", cat_periph.id, 8995, "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=400"),
            ("LG-KBD-009", "Logitech MX Mechanical Wireless Keyboard", "Logitech", "MX Mechanical", cat_periph.id, 14995, "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400"),
            ("DL-DCK-010", "Dell Thunderbolt 4 Dock WD22TB4 180W", "Dell", "WD22TB4", cat_periph.id, 24500, "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400"),
            ("LG-BRI-011", "Logitech Brio 4K Ultra HD Pro Webcam", "Logitech", "Brio 4K", cat_periph.id, 18500, "https://images.unsplash.com/photo-1585792180666-f7347c490ee2?w=400"),
            ("CSC-RTR-012", "Cisco Catalyst 1000 Series 24-Port Gigabit", "Cisco", "C1000-24FP-4G-L", cat_networking.id, 68000, "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=400"),
            ("UBI-AP-013", "Ubiquiti UniFi U6 Enterprise WiFi 6E AP", "Ubiquiti", "U6-Enterprise", cat_networking.id, 29500, "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=400"),
            ("SYN-NAS-014", "Synology DiskStation DS923+ 4-Bay NAS", "Synology", "DS923+", cat_networking.id, 56000, "https://images.unsplash.com/photo-1597852074816-d933c7d2b988?w=400"),
            ("APC-UPS-015", "APC Smart-UPS 1500VA LCD 230V SmartConnect", "APC", "SMT1500IC", cat_networking.id, 42000, "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=400"),
            ("HM-AER-016", "Herman Miller Aeron Ergonomic Task Chair", "Herman Miller", "Aeron Mineral B", cat_furniture.id, 115000, "https://images.unsplash.com/photo-1580481077195-73ab013f636f?w=400"),
            ("ST-DESK-017", "Dual-Motor Electric Height Adjustable Desk (60x30)", "ErgoTech", "ET-DUAL-PRO", cat_furniture.id, 34000, "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=400"),
            ("ST-ARM-018", "Ergotron LX Dual Stacking Monitor Arm", "Ergotron", "LX-45-248-026", cat_furniture.id, 22000, "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=400"),
            ("SN-WH-019", "Sony WH-1000XM5 ANC Wireless Headset", "Sony", "WH-1000XM5", cat_periph.id, 29990, "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400"),
            ("HP-LJ-020", "HP LaserJet Pro MFP 4104fdw Laser Printer", "HP", "4104fdw", cat_periph.id, 44500, "https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=400"),
        ]

        products = []
        for sku, name, brand, model_no, cat_id, price, img in raw_products:
            p = Product(
                sku=sku,
                name=name,
                brand=brand,
                model_number=model_no,
                category_id=cat_id,
                unit_price=decimal.Decimal(str(price)),
                image_url=img,
                description=f"High performance {brand} enterprise device designed for enterprise productivity.",
                is_active=True,
                created_by=users_map["admin"].id,
            )
            db.add(p)
            products.append(p)
        await db.flush()

        # 6. INVENTORY (Distribution across warehouses)
        inventories = []
        # Predefined quantities for realistic inventory states:
        # Some plentiful, some low-stock, some out-of-stock
        stock_configs = [
            # total, available, reserved, incoming, damaged, min, reorder
            (45, 35, 10, 20, 0, 15, 25),   # HP-LAP-001 (Healthy)
            (12, 4, 8, 15, 0, 10, 15),     # LN-TP-002 (Low Stock!)
            (0, 0, 0, 25, 0, 8, 12),       # DL-LAT-003 (OUT OF STOCK!)
            (18, 12, 6, 10, 0, 5, 8),      # APL-MB-004
            (32, 28, 4, 15, 0, 10, 15),    # DL-MON-005
            (8, 2, 6, 10, 0, 5, 10),       # LG-MON-006 (Low Stock!)
            (0, 0, 0, 8, 0, 4, 6),         # SS-MON-007 (OUT OF STOCK!)
            (120, 105, 15, 50, 2, 25, 40), # LG-MXK-008
            (85, 75, 10, 30, 1, 20, 35),   # LG-KBD-009
            (22, 18, 4, 12, 0, 10, 15),    # DL-DCK-010
            (14, 5, 9, 20, 0, 8, 12),      # LG-BRI-011 (Low Stock!)
            (9, 6, 3, 5, 0, 4, 8),         # CSC-RTR-012
            (15, 12, 3, 10, 0, 5, 8),      # UBI-AP-013
            (6, 1, 5, 4, 0, 3, 5),         # SYN-NAS-014 (Low Stock!)
            (11, 8, 3, 6, 0, 4, 6),        # APC-UPS-015
            (25, 20, 5, 10, 0, 8, 12),     # HM-AER-016
            (30, 25, 5, 15, 0, 10, 15),    # ST-DESK-017
            (40, 34, 6, 20, 0, 12, 18),    # ST-ARM-018
            (55, 48, 7, 25, 1, 15, 25),    # SN-WH-019
            (16, 11, 5, 8, 0, 6, 10),      # HP-LJ-020
        ]

        wh_list = [wh_mumbai, wh_delhi, wh_blr]
        for i, p in enumerate(products):
            cfg = stock_configs[i]
            # Primary warehouse record
            inv = Inventory(
                product_id=p.id,
                warehouse_id=wh_list[i % len(wh_list)].id,
                total_quantity=cfg[0],
                available_quantity=cfg[1],
                reserved_quantity=cfg[2],
                incoming_quantity=cfg[3],
                damaged_quantity=cfg[4],
                min_stock_level=cfg[5],
                reorder_level=cfg[6],
                updated_by=users_map["warehouse"].id,
            )
            db.add(inv)
            inventories.append(inv)
            await db.flush()

            # Record initial inventory transaction
            if cfg[0] > 0:
                txn = InventoryTransaction(
                    inventory_id=inv.id,
                    transaction_type=TransactionType.RECEIPT,
                    quantity_change=cfg[0],
                    quantity_before=0,
                    quantity_after=cfg[0],
                    reference_type="OPENING_BALANCE",
                    notes="Initial system stock setup",
                    created_by=users_map["admin"].id,
                )
                db.add(txn)
        await db.flush()

        # 7. VENDORS & EXTERNAL PLATFORMS
        v_amazon = Vendor(
            name="Amazon Business India",
            email="enterprise-sales@amazon.in",
            phone="+91-1800-3000-9009",
            address="Amazon Development Centre, Brigade Gateway, Bengaluru",
            website="https://business.amazon.in",
            rating=decimal.Decimal("4.8"),
            is_active=True,
        )
        v_flipkart = Vendor(
            name="Flipkart Commerce Direct",
            email="b2b@flipkart.com",
            phone="+91-1800-208-9898",
            address="Embassy Tech Village, Outer Ring Road, Bengaluru",
            website="https://www.flipkart.com",
            rating=decimal.Decimal("4.5"),
            is_active=True,
        )
        v_meesho = Vendor(
            name="Meesho Enterprise Wholesale",
            email="b2b-supply@meesho.com",
            phone="+91-80-6179-9600",
            address="Finchley Castle, Outer Ring Road, Bellandur, Bengaluru",
            website="https://supplier.meesho.com",
            rating=decimal.Decimal("4.2"),
            is_active=True,
        )
        v_direct = Vendor(
            name="TechWorld Prime Distribution",
            email="orders@techworld-direct.com",
            phone="+91-22-4589-7700",
            address="Lamington Road Commercial Hub, Grant Road, Mumbai",
            website="https://techworld-direct.com",
            rating=decimal.Decimal("4.7"),
            is_active=True,
        )
        db.add_all([v_amazon, v_flipkart, v_meesho, v_direct])
        await db.flush()

        # 8. VENDOR PRODUCTS (For Automatic Comparison Table across Amazon, Flipkart, Meesho, Suppliers)
        # Populate comparison records for multiple products
        vendor_configs = [
            # (vendor, platform, price_ratio, delivery_days, delivery_charges)
            (v_amazon, VendorPlatform.AMAZON, 1.02, 2, 0),       # Fastest delivery
            (v_flipkart, VendorPlatform.FLIPKART, 0.96, 4, 150),  # Cheapest price
            (v_meesho, VendorPlatform.MEESHO, 0.98, 5, 80),      # Budget alternative
            (v_direct, VendorPlatform.OTHER, 0.99, 3, 0),        # Official distributor
        ]

        for p in products[:10]:  # Top 10 products have rich comparison matrices
            for v, platform, p_ratio, days, charges in vendor_configs:
                v_price = round(float(p.unit_price) * p_ratio, 2)
                vp = VendorProduct(
                    vendor_id=v.id,
                    product_id=p.id,
                    external_product_name=f"{p.name} - Official Authorized Unit",
                    unit_price=decimal.Decimal(str(v_price)),
                    available_quantity=50,
                    delivery_days_estimate=days,
                    delivery_charges=decimal.Decimal(str(charges)),
                    product_url=f"https://example.com/item/{p.sku}",
                    product_image_url=p.image_url,
                    platform=platform,
                    rating=decimal.Decimal(str(v.rating)),
                )
                db.add(vp)
        await db.flush()

        # 9. PROCUREMENT REQUESTS
        pr1 = ProcurementRequest(
            request_number="PR-2026-0001",
            product_id=products[2].id,  # Dell Latitude (Out of Stock)
            required_quantity=20,
            available_quantity=0,
            shortage_quantity=20,
            status=ProcurementStatus.VENDOR_SELECTED,
            requested_by=users_map["sales"].id,
            assigned_to=users_map["procurement"].id,
            selected_vendor_id=v_flipkart.id,
            estimated_total_cost=decimal.Decimal("1459200.00"),
            notes="Client urgently needs 20 Dell Latitude units for onboarding.",
        )
        pr2 = ProcurementRequest(
            request_number="PR-2026-0002",
            product_id=products[1].id,  # ThinkPad X1 (Low Stock)
            required_quantity=15,
            available_quantity=4,
            shortage_quantity=11,
            status=ProcurementStatus.PO_CREATED,
            requested_by=users_map["procurement"].id,
            assigned_to=users_map["procurement"].id,
            selected_vendor_id=v_amazon.id,
            estimated_total_cost=decimal.Decimal("1518000.00"),
            notes="Automated replenishment triggered below reorder threshold.",
        )
        pr3 = ProcurementRequest(
            request_number="PR-2026-0003",
            product_id=products[6].id,  # Samsung ViewFinity (Out of stock)
            required_quantity=10,
            available_quantity=0,
            shortage_quantity=10,
            status=ProcurementStatus.UNDER_EVALUATION,
            requested_by=users_map["sales"].id,
            assigned_to=users_map["procurement"].id,
            notes="Evaluating between Amazon (fast delivery) and Flipkart (lowest rate).",
        )
        db.add_all([pr1, pr2, pr3])
        await db.flush()

        # 10. PURCHASE ORDERS
        po1 = PurchaseOrder(
            po_number="PO-2026-1001",
            vendor_id=v_amazon.id,
            procurement_request_id=pr2.id,
            status=POStatus.ORDERED,
            order_date=datetime.utcnow() - timedelta(days=2),
            expected_delivery_date=date.today() + timedelta(days=2),
            payment_status=PaymentStatus.PARTIAL,
            total_amount=decimal.Decimal("1518000.00"),
            notes="Standard priority dispatch. Track tracking code: AMZ-TRK-9812",
            created_by=users_map["procurement"].id,
        )
        db.add(po1)
        await db.flush()

        po_item1 = PurchaseOrderItem(
            purchase_order_id=po1.id,
            product_id=products[1].id,
            quantity_ordered=11,
            quantity_received=0,
            unit_price=decimal.Decimal("138000.00"),
            total_price=decimal.Decimal("1518000.00"),
            notes="Lenovo ThinkPad X1 Carbon Gen 11 - Sealed Indian Retail Units",
        )
        db.add(po_item1)
        await db.flush()

        # 11. SALES ORDERS & ALLOCATIONS
        so1 = SalesOrder(
            order_number="SO-2026-5001",
            customer_name="Infosys Global Solutions",
            customer_email="procurement@infosys-demo.com",
            customer_phone="+91-98450-11223",
            status=SalesOrderStatus.FULLY_ALLOCATED,
            priority=OrderPriority.HIGH,
            created_by=users_map["sales"].id,
            warehouse_id=wh_mumbai.id,
            notes="Executive batch delivery for Q4 projects.",
        )
        so2 = SalesOrder(
            order_number="SO-2026-5002",
            customer_name="Tata Consultancy Services",
            customer_email="assets@tcs-demo.com",
            customer_phone="+91-98200-44556",
            status=SalesOrderStatus.PARTIALLY_ALLOCATED,
            priority=OrderPriority.URGENT,
            created_by=users_map["sales"].id,
            warehouse_id=wh_blr.id,
            notes="Requires 20 Dell Latitude units. 0 in stock, linked to PR-2026-0001.",
        )
        db.add_all([so1, so2])
        await db.flush()

        so1_item = SalesOrderItem(
            sales_order_id=so1.id,
            product_id=products[0].id,
            quantity_requested=10,
            quantity_allocated=10,
            quantity_pending=0,
            unit_price=products[0].unit_price,
            notes="HP EliteBook allocated from Mumbai Central",
        )
        so2_item = SalesOrderItem(
            sales_order_id=so2.id,
            product_id=products[2].id,
            quantity_requested=20,
            quantity_allocated=0,
            quantity_pending=20,
            unit_price=products[2].unit_price,
            notes="Awaiting shipment arrival from supplier",
        )
        db.add_all([so1_item, so2_item])
        await db.flush()

        alloc1 = ProductAllocation(
            sales_order_id=so1.id,
            sales_order_item_id=so1_item.id,
            product_id=products[0].id,
            inventory_id=inventories[0].id,
            quantity_allocated=10,
            allocated_by=users_map["sales"].id,
            status=AllocationStatus.ACTIVE,
            notes="Auto-allocated on sales order submission.",
        )
        db.add(alloc1)
        await db.flush()

        # 12. NOTIFICATIONS
        notifs = [
            Notification(
                user_id=users_map["procurement"].id,
                type=NotificationType.STOCK_OUT,
                title="Critical Stock Shortage Detected",
                message="Dell Latitude 5540 has reached 0 available units. Procurement request PR-2026-0001 automatically generated.",
                reference_type=ReferenceType.PROCUREMENT,
                reference_id=pr1.id,
            ),
            Notification(
                user_id=users_map["procurement"].id,
                type=NotificationType.VENDOR_COMPARISON,
                title="Vendor Comparison Ready",
                message="Market prices scanned for ThinkPad X1: Flipkart is cheapest (₹1,32,480) | Amazon fastest (2 days).",
                reference_type=ReferenceType.PROCUREMENT,
                reference_id=pr2.id,
            ),
            Notification(
                user_id=users_map["sales"].id,
                type=NotificationType.ALLOCATED,
                title="Stock Allocation Confirmed",
                message="Sales Order SO-2026-5001 has been 100% reserved and confirmed for dispatch.",
                reference_type=ReferenceType.SALES_ORDER,
                reference_id=so1.id,
            ),
            Notification(
                user_id=users_map["warehouse"].id,
                type=NotificationType.ARRIVED,
                title="Incoming Warehouse Shipment",
                message="PO-2026-1001 expected to arrive in 48 hours at Mumbai Central Warehouse.",
                reference_type=ReferenceType.PURCHASE_ORDER,
                reference_id=po1.id,
            ),
            Notification(
                user_id=users_map["manager"].id,
                type=NotificationType.APPROVAL_REQUIRED,
                title="Purchase Order Approval Pending",
                message="PO-2026-1001 of ₹15,18,000 awaiting executive authorization.",
                reference_type=ReferenceType.PURCHASE_ORDER,
                reference_id=po1.id,
            ),
        ]
        db.add_all(notifs)

        await db.commit()
        print("\n🎉 ========================================================")
        print("✅ DATABASE SEEDED WITH ENTERPRISE REALISTIC DATA!")
        print("============================================================")
        print("🔑 Login Credentials (all passwords: Demo@1234):")
        print("   👑 Admin:       admin@inventory.com")
        print("   📦 Warehouse:   warehouse@inventory.com")
        print("   🛒 Procurement: procurement@inventory.com")
        print("   💼 Sales:       sales@inventory.com")
        print("   📊 Management:  manager@inventory.com")
        print("============================================================\n")


if __name__ == "__main__":
    asyncio.run(seed())
