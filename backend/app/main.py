from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.core.config import settings
from app.core.database import create_tables
from app.core.redis_client import get_redis, close_redis

# Import all models to register them with SQLAlchemy metadata
import app.models  # noqa: F401

from app.api import auth, users, products, inventory, vendors, procurement, purchase_orders, warehouse_receipts, sales_orders, notifications, reports, websocket


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown lifecycle."""
    # Startup
    await get_redis()
    # Note: In production use Alembic migrations instead of create_tables()
    # await create_tables()
    yield
    # Shutdown
    await close_redis()


app = FastAPI(
    title="Smart Inventory & Procurement Management System",
    description="Complete backend API for inventory management, procurement, sales orders, and vendor management.",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth.router, prefix="/api/v1")
app.include_router(users.router, prefix="/api/v1")
app.include_router(users.dept_router, prefix="/api/v1")
app.include_router(products.router, prefix="/api/v1")
app.include_router(products.cat_router, prefix="/api/v1")
app.include_router(inventory.router, prefix="/api/v1")
app.include_router(inventory.wh_router, prefix="/api/v1")
app.include_router(vendors.router, prefix="/api/v1")
app.include_router(procurement.router, prefix="/api/v1")
app.include_router(purchase_orders.router, prefix="/api/v1")
app.include_router(warehouse_receipts.router, prefix="/api/v1")
app.include_router(sales_orders.router, prefix="/api/v1")
app.include_router(notifications.router, prefix="/api/v1")
app.include_router(notifications.approval_router, prefix="/api/v1")
app.include_router(reports.router, prefix="/api/v1")
app.include_router(websocket.router, prefix="/api/v1")


@app.get("/", tags=["Health"])
async def root():
    return {"status": "ok", "message": "Smart Inventory API is running", "version": "1.0.0"}


@app.get("/health", tags=["Health"])
async def health():
    return {"status": "healthy", "environment": settings.ENVIRONMENT}
