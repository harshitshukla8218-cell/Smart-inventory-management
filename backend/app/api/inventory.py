from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List, Optional
from uuid import UUID
from app.core.database import get_db
from app.api.deps import get_current_user, require_inventory
from app.models.user import User
from app.models.inventory import Inventory, InventoryTransaction, Warehouse, TransactionType
from app.schemas.inventory import (
    InventoryCreate, InventoryUpdate, InventoryResponse,
    InventoryAdjustRequest, InventoryTransactionResponse,
    WarehouseCreate, WarehouseUpdate, WarehouseResponse,
)

router = APIRouter(prefix="/inventory", tags=["Inventory"])
wh_router = APIRouter(prefix="/warehouses", tags=["Warehouses"])


@wh_router.get("/", response_model=List[WarehouseResponse])
async def list_warehouses(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = await db.execute(select(Warehouse).where(Warehouse.is_active == True))
    return result.scalars().all()


@wh_router.post("/", response_model=WarehouseResponse, status_code=status.HTTP_201_CREATED)
async def create_warehouse(
    request: WarehouseCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_inventory),
):
    wh = Warehouse(**request.model_dump())
    db.add(wh)
    await db.commit()
    await db.refresh(wh)
    return wh


@wh_router.put("/{wh_id}", response_model=WarehouseResponse)
async def update_warehouse(
    wh_id: UUID,
    request: WarehouseUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_inventory),
):
    result = await db.execute(select(Warehouse).where(Warehouse.id == wh_id))
    wh = result.scalar_one_or_none()
    if not wh:
        raise HTTPException(status_code=404, detail="Warehouse not found")
    for field, value in request.model_dump(exclude_unset=True).items():
        setattr(wh, field, value)
    await db.commit()
    await db.refresh(wh)
    return wh


@router.get("/", response_model=List[InventoryResponse])
async def list_inventory(
    skip: int = 0,
    limit: int = Query(default=50, le=200),
    warehouse_id: Optional[UUID] = None,
    product_id: Optional[UUID] = None,
    low_stock: Optional[bool] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = select(Inventory)
    if warehouse_id:
        query = query.where(Inventory.warehouse_id == warehouse_id)
    if product_id:
        query = query.where(Inventory.product_id == product_id)
    if low_stock:
        query = query.where(Inventory.available_quantity <= Inventory.min_stock_level)
    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/", response_model=InventoryResponse, status_code=status.HTTP_201_CREATED)
async def create_inventory(
    request: InventoryCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_inventory),
):
    inv = Inventory(**request.model_dump(), updated_by=current_user.id)
    db.add(inv)
    await db.commit()
    await db.refresh(inv)
    return inv


@router.get("/{inventory_id}", response_model=InventoryResponse)
async def get_inventory(
    inventory_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Inventory).where(Inventory.id == inventory_id))
    inv = result.scalar_one_or_none()
    if not inv:
        raise HTTPException(status_code=404, detail="Inventory record not found")
    return inv


@router.put("/{inventory_id}", response_model=InventoryResponse)
async def update_inventory(
    inventory_id: UUID,
    request: InventoryUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_inventory),
):
    result = await db.execute(select(Inventory).where(Inventory.id == inventory_id))
    inv = result.scalar_one_or_none()
    if not inv:
        raise HTTPException(status_code=404, detail="Inventory record not found")
    for field, value in request.model_dump(exclude_unset=True).items():
        setattr(inv, field, value)
    inv.updated_by = current_user.id
    await db.commit()
    await db.refresh(inv)
    return inv


@router.post("/{inventory_id}/adjust", response_model=InventoryTransactionResponse)
async def adjust_inventory(
    inventory_id: UUID,
    request: InventoryAdjustRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_inventory),
):
    result = await db.execute(select(Inventory).where(Inventory.id == inventory_id).with_for_update())
    inv = result.scalar_one_or_none()
    if not inv:
        raise HTTPException(status_code=404, detail="Inventory record not found")

    before = inv.available_quantity
    new_qty = before + request.quantity_change
    if new_qty < 0:
        raise HTTPException(status_code=400, detail="Adjustment would result in negative available quantity")

    inv.available_quantity = new_qty
    inv.total_quantity = inv.total_quantity + request.quantity_change
    inv.updated_by = current_user.id

    txn = InventoryTransaction(
        inventory_id=inventory_id,
        transaction_type=request.transaction_type,
        quantity_change=request.quantity_change,
        quantity_before=before,
        quantity_after=new_qty,
        notes=request.notes,
        created_by=current_user.id,
    )
    db.add(txn)

    # Check low stock
    if inv.available_quantity <= inv.min_stock_level:
        from app.services.notification_service import create_notification_for_role
        from app.models.notification import NotificationType, ReferenceType
        from app.models.user import UserRole

        await create_notification_for_role(
            role=UserRole.INVENTORY,
            notification_type=NotificationType.LOW_STOCK,
            title="Low Stock Alert",
            message=f"Inventory {inventory_id} is low: {inv.available_quantity} units remaining.",
            reference_type=ReferenceType.INVENTORY,
            reference_id=inventory_id,
            db=db,
        )

    await db.commit()
    await db.refresh(txn)
    return txn


@router.get("/{inventory_id}/transactions", response_model=List[InventoryTransactionResponse])
async def get_inventory_transactions(
    inventory_id: UUID,
    skip: int = 0,
    limit: int = Query(default=50, le=200),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(InventoryTransaction)
        .where(InventoryTransaction.inventory_id == inventory_id)
        .order_by(InventoryTransaction.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    return result.scalars().all()
