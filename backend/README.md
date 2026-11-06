# Smart Inventory & Procurement Management System — Backend

## Tech Stack
- **FastAPI 0.111** — REST API + WebSockets
- **SQLAlchemy 2.0 (async)** + asyncpg — ORM
- **Alembic** — Database migrations
- **Pydantic v2** — Data validation & serialization
- **JWT** (python-jose + passlib[bcrypt]) — Authentication
- **Redis + aioredis** — Caching & Celery broker
- **Celery** — Background tasks & scheduling
- **reportlab** — PDF export
- **openpyxl + pandas** — Excel/CSV export
- **FastAPI WebSockets** — Real-time notifications

---

## Project Structure

```
backend/
├── app/
│   ├── api/              # FastAPI routers
│   │   ├── auth.py       # Login, refresh, register
│   │   ├── users.py      # User & department management
│   │   ├── products.py   # Products & categories
│   │   ├── inventory.py  # Inventory & warehouses
│   │   ├── vendors.py    # Vendors & vendor products
│   │   ├── procurement.py # Procurement requests
│   │   ├── purchase_orders.py # Purchase orders
│   │   ├── warehouse_receipts.py # Goods receiving
│   │   ├── sales_orders.py # Sales orders with auto-allocation
│   │   ├── notifications.py # Notifications & approvals
│   │   ├── reports.py    # Reports (PDF, Excel, CSV)
│   │   ├── websocket.py  # Real-time WebSocket
│   │   └── deps.py       # Auth dependencies + RBAC
│   ├── core/
│   │   ├── config.py     # Pydantic settings
│   │   ├── database.py   # Async SQLAlchemy engine
│   │   ├── security.py   # JWT + password hashing
│   │   └── redis_client.py # Redis connection
│   ├── models/           # SQLAlchemy ORM models
│   ├── schemas/          # Pydantic v2 schemas
│   ├── services/         # Business logic
│   │   ├── availability_service.py
│   │   ├── allocation_service.py
│   │   ├── procurement_service.py
│   │   └── notification_service.py
│   ├── tasks/            # Celery tasks
│   │   ├── celery_app.py
│   │   ├── inventory_tasks.py
│   │   └── notification_tasks.py
│   ├── websockets/
│   │   └── manager.py    # WebSocket connection manager
│   └── main.py           # FastAPI app entry point
├── alembic/              # DB migrations
├── requirements.txt
├── .env.example
├── alembic.ini
└── seed.py               # Sample data seeder
```

---

## Setup

### 1. Install dependencies
```bash
pip install -r requirements.txt
```

### 2. Configure environment
```bash
cp .env.example .env
# The default uses the persistent local SQLite file smart_inventory.db.
# For a hosted database, set DATABASE_URL to your PostgreSQL connection string.
```

### 3. Initialize the database
```bash
python init_db.py
```
The API also runs this initialization at startup. Tables are created and the
demo dataset is loaded only when the database has no users.

To load a client's opening/current stock count, use **CSV Template** and
**Import Stock CSV** on the Inventory page. Choose a warehouse and provide
`sku,quantity,min_stock_level,reorder_level`; `quantity` is the available
physical count, and each change is added to the inventory audit. Products must
already exist in the product catalog. Sales are entered as sales orders and
counted as sold only after a fully allocated order is dispatched.

### 4. Seed initial data manually (optional)
```bash
python seed.py
```

### 5. Start the API server
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 6. Start Celery worker (background tasks)
```bash
celery -A app.tasks.celery_app worker --loglevel=info
```

### 7. Start Celery Beat (scheduled tasks)
```bash
celery -A app.tasks.celery_app beat --loglevel=info
```

---

## API Endpoints

### Auth
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/auth/login` | Login → JWT tokens |
| POST | `/api/v1/auth/refresh` | Refresh access token |
| POST | `/api/v1/auth/register` | Public registration |

### Users & Departments
| Method | Path | Role |
|--------|------|------|
| GET | `/api/v1/users/me` | Any |
| GET/POST | `/api/v1/users/` | Admin |
| GET/PUT | `/api/v1/departments/` | Admin |

### Products & Categories
| Method | Path | Role |
|--------|------|------|
| GET | `/api/v1/products/` | Any |
| POST/PUT | `/api/v1/products/` | Inventory |
| GET/POST | `/api/v1/categories/` | Any/Inventory |

### Inventory & Warehouses
| Method | Path | Role |
|--------|------|------|
| GET/POST | `/api/v1/inventory/` | Any/Inventory |
| POST | `/api/v1/inventory/{id}/adjust` | Inventory |
| GET | `/api/v1/inventory/{id}/transactions` | Any |
| GET/POST | `/api/v1/warehouses/` | Any/Inventory |

### Vendors
| Method | Path | Role |
|--------|------|------|
| GET/POST | `/api/v1/vendors/` | Any/Procurement |
| GET | `/api/v1/vendors/compare/{product_id}` | Any |
| POST | `/api/v1/vendors/products` | Procurement |

### Procurement
| Method | Path | Role |
|--------|------|------|
| GET/POST | `/api/v1/procurement/` | Any/Any |
| PUT | `/api/v1/procurement/{id}` | Procurement |

### Purchase Orders
| Method | Path | Role |
|--------|------|------|
| GET/POST | `/api/v1/purchase-orders/` | Any/Procurement |
| PUT/DELETE | `/api/v1/purchase-orders/{id}` | Procurement |

### Warehouse Receipts
| Method | Path | Role |
|--------|------|------|
| GET/POST | `/api/v1/warehouse-receipts/` | Any/Inventory |

### Sales Orders
| Method | Path | Role |
|--------|------|------|
| GET/POST | `/api/v1/sales-orders/` | Any/Sales |
| POST | `/api/v1/sales-orders/{id}/allocate` | Sales |
| DELETE | `/api/v1/sales-orders/{id}` | Sales |

### Notifications & Approvals
| Method | Path | Role |
|--------|------|------|
| GET | `/api/v1/notifications/` | Any |
| POST | `/api/v1/notifications/{id}/read` | Any |
| GET/POST | `/api/v1/approvals/` | Management |

### Reports & Exports
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/reports/inventory/summary` | JSON summary |
| GET | `/api/v1/reports/inventory/low-stock` | Low stock list |
| GET | `/api/v1/reports/inventory/export/csv` | CSV export |
| GET | `/api/v1/reports/inventory/export/excel` | Excel export |
| GET | `/api/v1/reports/inventory/export/pdf` | PDF export |
| GET | `/api/v1/reports/sales/summary` | Sales summary |
| GET | `/api/v1/reports/procurement/summary` | Procurement summary |

### WebSocket
```
ws://localhost:8000/api/v1/ws/notifications?token=<JWT>
```

---

## Key Business Logic

### Auto-Allocation Flow
1. Sales order created → system auto-allocates from available inventory
2. If inventory insufficient → auto-creates procurement request
3. After warehouse receipt → `process_pending_allocations_for_product()` re-allocates pending orders (priority-ordered)

### Procurement Workflow
```
PENDING_REVIEW → UNDER_EVALUATION → VENDOR_SELECTED → APPROVAL_PENDING
→ APPROVED → PO_CREATED → ORDERED → SHIPPED → RECEIVED → COMPLETED
```

### RBAC Roles
| Role | Permissions |
|------|-------------|
| `admin` | Full access |
| `inventory` | Inventory, warehouses, products |
| `procurement` | Vendors, procurement, purchase orders |
| `sales` | Sales orders |
| `management` | Reports, approvals |

---

## Interactive Docs
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
