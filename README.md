# 🏭 Smart Inventory & Procurement Management System

A production-oriented, full-stack enterprise web application built to automate **product availability checking, multi-warehouse inventory tracking, external vendor price comparison (Amazon, Flipkart, Meesho), procurement workflows, warehouse inward arrival verification, and automatic product allocation against sales orders**.

---

## 🚀 Live System URLs

- **Frontend Application**: [http://localhost:5173](http://localhost:5173)
- **FastAPI Backend API**: [http://127.0.0.1:8000](http://127.0.0.1:8000)
- **Interactive Swagger API Docs**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **API Health Check**: [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health)

---

## 🔑 Pre-Seeded Demo User Accounts

All accounts are pre-seeded with the password: `Demo@1234`
*(The web application header also provides a 1-click persona switcher to immediately test every role)*

| Role | Email | Scope & Permissions |
|---|---|---|
| 👑 **Admin** | `admin@inventory.com` | Complete access, User management, System settings, Full ERP oversight |
| 📦 **Warehouse Team** | `warehouse@inventory.com` | Available stock, Inward gate receipts, QC inspection, Physical adjustments |
| 🛒 **Procurement Team** | `procurement@inventory.com` | Shortage alerts, Vendor price comparison, Vendor selection, PO generation |
| 💼 **Sales Team** | `sales@inventory.com` | Create sales orders, Check stock, Auto-allocation status, Order tracking |
| 📊 **Management** | `manager@inventory.com` | Business intelligence, Monthly spend trends, Vendor performance, Audits |

---

## 🌟 Core Features Implemented

### 1. Executive Real-time Dashboard
- **10 Core KPI Cards**: Total Products, Available Stock, Out-of-Stock Products, Low-Stock Products, Pending Procurement Requests, Active Purchase Orders, Incoming Warehouse Products, Pending Sales Orders, Allocated Products, Completed Orders.
- **Visualizations**:
  - Multi-category Inventory Bar Chart
  - Stock State Ratio Donut Chart (Available / Reserved / Incoming / Damaged)
  - Monthly Procurement Spend Trend (₹) Line Chart
  - Sales Order Statistics Trend
  - Live Inventory Movement Audit Stream
  - Immediate Stock Replenishment Alerts Table

### 2. Product Availability & Shortage Detection
- Select product, warehouse, and requested units.
- Compares requested quantity against available warehouse stock.
- **Sufficient Stock**: Confirms instantaneous allocation readiness.
- **Shortage Detected**: Automatically calculates shortage quantity and provides a 1-click trigger to generate a linked procurement request and launch multi-vendor market price comparison.

### 3. Automatic Vendor Search & Price Comparison
- Scans and benchmarks matching products across **Amazon Business, Flipkart Commerce, Meesho Wholesale, and Authorized Distributors**.
- Smart recommendation badges:
  - 🏆 **Cheapest Option**
  - ⚡ **Fastest Delivery**
  - ⭐ **Best Overall Option**
- Filters by Lowest Landed Cost (Price + Delivery Charges), Fastest Lead Time, and Vendor Rating.
- Direct **"Select Vendor"** action for procurement authorization.

### 4. Procurement & Requisition Management
- Full 12-stage procurement lifecycle:
  `Pending Review` → `Under Evaluation` → `Vendor Selected` → `Approval Pending` → `Approved` → `PO Created` → `Ordered` → `In Transit` → `Partially Received` → `Received` → `Completed`.
- Vendor approval workflows and 1-click Purchase Order generation.

### 5. Purchase Order (PO) Management
- Line items, unit prices, delivery terms, and payment terms.
- Status milestone updater from Draft to Fulfilled.
- **Official Print / PDF View**: Formatted purchase order ready for download and physical dispatch.

### 6. Warehouse Inward Arrival Verification
- Inward gate pass verification against vendor Purchase Orders.
- Physical QC check: records **Good units** (added to Available Stock) vs **Damaged units** (quarantined).
- Supports **Partial Arrivals** (remaining units kept pending).
- **Automated Workflow**: On arrival confirmation, the system updates inventory, sends in-app notifications, and automatically checks pending backordered sales orders for immediate fulfillment!

### 7. Automatic Product Allocation Against Sales Orders
- Sales order creation with customer details, priority, and line items.
- Immediately checks available warehouse inventory and reserves units.
- **Partial Allocation**: If stock is insufficient, allocates available units and automatically creates a linked procurement request for the shortage.
- **Collision Prevention**: Prevents two simultaneous orders from reserving the same stock.

### 8. Multi-Warehouse Inventory Management
- Stock tracking across Mumbai, Delhi, and Bangalore hubs.
- Real-time balances: Total, Available, Reserved, Incoming, and Damaged.
- Manual Stock Adjustment modal with audit logging.
- Complete transaction ledger tracking every inward receipt, issue, damage quarantine, and sales reservation.

### 9. System Notification Engine
- In-app notification bell with live unread counter.
- Categorized feeds: Stock Shortages, Procurement Approvals, Warehouse Arrivals, Sales Order Allocations.
- Mark individual or all notifications as read.

### 10. Reports & Analytics
- 12 standardized enterprise reports with interactive data views.
- 1-click **CSV / Excel export** for spreadsheet analysis.

---

## 🛠️ Technology Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Lucide Icons, Recharts, Axios.
- **Backend**: Python 3.12, FastAPI, SQLAlchemy 2.0 (Async), SQLite / PostgreSQL support, Pydantic v2, PyJWT, bcrypt.
- **Security**: JWT Bearer token authentication, bcrypt password hashing, Role-Based Access Control (RBAC).

---

## 🏃 Running the Application

### 1. Backend Server
```bash
cd backend
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

### 2. Frontend Server
```bash
cd frontend
npm run dev -- --host 127.0.0.1 --port 5173
```
