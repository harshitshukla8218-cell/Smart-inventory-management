# 🚀 Quick Start Guide for Evaluators & Reviewers

Welcome to the **Smart Inventory & Procurement Management System**!

---

## ⚡ Prerequisites
- **Python 3.11+**
- **Node.js 18+ & npm**

---

## 🏃 Running the Application (2 Simple Steps)

The backend uses a persistent SQLite database at `backend/smart_inventory.db`
by default. On its first start, it creates the schema and loads demo data if the
database is empty. Set `DATABASE_URL` to a PostgreSQL connection string when
using a hosted database; keep production credentials in your hosting provider's
environment settings, not in source control.

### Step 1: Start Backend
Open a terminal in `backend`:
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
> On a fresh database, startup initializes and seeds it automatically. To load
> a fresh demo dataset manually, run `python init_db.py` from `backend`.
> For real opening stock, download the CSV template on the Inventory page,
> select a warehouse, and import rows using existing product SKUs. The
> `quantity` column is the current available stock count; imports are validated
> before applying and recorded in the inventory transaction audit.

- **API Documentation**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **Health Check**: [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health)

---

### Step 2: Start Frontend
Open a second terminal in `frontend`:
```bash
cd frontend
npm install
npm run dev
```
- Open browser at: **[http://localhost:5173](http://localhost:5173)**

---

## 🔑 Demo Login Personas

All accounts use the password: `Demo@1234`

| Persona | Email | Primary Responsibilities |
|---|---|---|
| 👑 **Admin** | `admin@inventory.com` | Complete access, User management (RBAC), Settings |
| 📦 **Warehouse Team** | `warehouse@inventory.com` | Stock balances, Inward arrival verification, QC inspection |
| 🛒 **Procurement Team** | `procurement@inventory.com` | Shortage alerts, Multi-vendor price comparison (Amazon, Flipkart, Meesho), PO creation |
| 💼 **Sales Team** | `sales@inventory.com` | Create sales orders, Check product availability, Auto-allocation |
| 📊 **Management** | `manager@inventory.com` | Executive dashboard, Spend trends, Vendor performance |

*(Tip: In the top right header of the application, you can use the **1-Click Persona Switcher** to switch roles on the fly without logging out!)*

---

## 🌟 Key Features to Explore

1. **Main Executive Dashboard (`/`)**: 10 KPI cards, interactive category inventory chart, stock ratio breakdown, procurement expenses, low-stock alerts.
2. **Product Availability Check (`/availability`)**: Enter required quantity, calculate shortage, and trigger 1-click automated procurement requisition.
3. **Vendor Price & Lead Time Comparison (`/vendor-comparison`)**: Side-by-side comparison across Amazon, Flipkart, Meesho, and suppliers with Cheapest 🏆, Fastest ⚡, and Best Overall ⭐ badges.
4. **Procurement Management (`/procurement`)**: 12-state requisition lifecycle from evaluation to approval and purchase order creation.
5. **Purchase Order Management (`/purchase-orders`)**: Printable and downloadable official Purchase Order document view.
6. **Warehouse Inward Arrival (`/warehouse`)**: Verify gate receipts, inspect good vs damaged units, update stock, and automatically allocate pending sales orders.
7. **Sales Orders & Auto-Allocation (`/sales-orders`)**: Order placement, instant reservation locking, and shortage backorder tracking.
8. **Multi-Warehouse Inventory (`/inventory`)**: Stock tracking across Mumbai, Delhi, and Bangalore with manual adjustment modal and complete transaction audit ledger.
9. **Notification Engine (`/notifications`)**: Real-time alerts for stock shortages, PO milestones, and warehouse receipts.
10. **Reports & Analytics (`/reports`)**: 12 standardized enterprise reports with 1-click CSV/Excel export.
