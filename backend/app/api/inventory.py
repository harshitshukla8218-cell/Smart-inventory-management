import csv
import io
from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi import File, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List, Optional
from uuid import UUID
from app.core.database import get_db
from app.api.deps import get_current_user, require_inventory
from app.models.user import User
from app.models.inventory import Inventory, InventoryTransaction, Warehouse, TransactionType
from app.models.product import Product
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
    query = select(Inventory).options(
        selectinload(Inventory.product),
        selectinload(Inventory.warehouse),
    )
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


@router.post("/import")
async def import_inventory_csv(
    warehouse_id: UUID,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_inventory),
):
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Upload a .csv file")

    content = await file.read(5 * 1024 * 1024 + 1)
    if len(content) > 5 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="CSV file must be 5 MB or smaller")

    try:
        reader = csv.DictReader(io.StringIO(content.decode("utf-8-sig"), newline=""))
        headers = {header.strip().lower() for header in (reader.fieldnames or [])}
        if not {"sku", "quantity"}.issubset(headers):
            raise HTTPException(
                status_code=400,
                detail="CSV must include sku and quantity columns",
            )

        rows = []
        seen_skus = set()
        errors = []
        for line_number, row in enumerate(reader, start=2):
            normalized = {
                (key or "").strip().lower(): (value or "").strip()
                for key, value in row.items()
            }
            sku = normalized.get("sku", "")
            if not sku:
                errors.append(f"Line {line_number}: SKU is required")
                continue
            if sku in seen_skus:
                errors.append(f"Line {line_number}: duplicate SKU '{sku}'")
                continue
            seen_skus.add(sku)

            try:
                quantity = int(normalized.get("quantity", ""))
                min_stock = int(normalized.get("min_stock_level") or 10)
                reorder_level = int(normalized.get("reorder_level") or 20)
                if min(quantity, min_stock, reorder_level) < 0:
                    raise ValueError
            except ValueError:
                errors.append(
                    f"Line {line_number}: quantity and stock levels must be non-negative whole numbers"
                )
                continue

            rows.append((line_number, sku, quantity, min_stock, reorder_level))
    except UnicodeDecodeError as exc:
        raise HTTPException(status_code=400, detail="CSV must be UTF-8 encoded") from exc
    except csv.Error as exc:
        raise HTTPException(status_code=400, detail="Could not parse CSV file") from exc
    finally:
        await file.close()

    if not rows and not errors:
        raise HTTPException(status_code=400, detail="CSV contains no inventory rows")

    warehouse = await db.scalar(
        select(Warehouse).where(Warehouse.id == warehouse_id, Warehouse.is_active.is_(True))
    )
    if not warehouse:
        raise HTTPException(status_code=404, detail="Active warehouse not found")

    products_result = await db.execute(
        select(Product).where(Product.sku.in_([row[1] for row in rows]))
    )
    products_by_sku = {product.sku: product for product in products_result.scalars()}
    inventory_result = await db.execute(
        select(Inventory).where(
            Inventory.warehouse_id == warehouse_id,
            Inventory.product_id.in_([product.id for product in products_by_sku.values()]),
        )
    )
    inventory_by_product = {
        inventory.product_id: inventory for inventory in inventory_result.scalars()
    }

    resolved_rows = []
    for line_number, sku, quantity, min_stock, reorder_level in rows:
        product = products_by_sku.get(sku)
        if not product:
            errors.append(f"Line {line_number}: unknown SKU '{sku}'")
            continue
        inventory = inventory_by_product.get(product.id)
        if inventory and quantity - inventory.available_quantity + inventory.total_quantity < 0:
            errors.append(
                f"Line {line_number}: quantity would make total stock negative for SKU '{sku}'"
            )
            continue
        resolved_rows.append(
            (line_number, product, inventory, quantity, min_stock, reorder_level)
        )

    if errors:
        raise HTTPException(
            status_code=400,
            detail={"message": "No rows were imported; correct the CSV and retry.", "errors": errors},
        )

    created_count = 0
    updated_count = 0
    unchanged_count = 0
    for _, product, inventory, quantity, min_stock, reorder_level in resolved_rows:
        if inventory is None:
            inventory = Inventory(
                product_id=product.id,
                warehouse_id=warehouse_id,
                total_quantity=quantity,
                available_quantity=quantity,
                min_stock_level=min_stock,
                reorder_level=reorder_level,
                updated_by=current_user.id,
            )
            db.add(inventory)
            await db.flush()
            db.add(
                InventoryTransaction(
                    inventory_id=inventory.id,
                    transaction_type=TransactionType.ADJUSTMENT,
                    quantity_change=quantity,
                    quantity_before=0,
                    quantity_after=quantity,
                    notes="Opening stock imported from CSV",
                    created_by=current_user.id,
                )
            )
            created_count += 1
            continue

        delta = quantity - inventory.available_quantity
        inventory.min_stock_level = min_stock
        inventory.reorder_level = reorder_level
        if delta:
            before = inventory.available_quantity
            inventory.available_quantity = quantity
            inventory.total_quantity += delta
            inventory.updated_by = current_user.id
            db.add(
                InventoryTransaction(
                    inventory_id=inventory.id,
                    transaction_type=TransactionType.ADJUSTMENT,
                    quantity_change=delta,
                    quantity_before=before,
                    quantity_after=quantity,
                    notes="Available stock reconciled from CSV import",
                    created_by=current_user.id,
                )
            )
            updated_count += 1
        else:
            unchanged_count += 1

    await db.commit()
    return {
        "warehouse": warehouse.name,
        "created": created_count,
        "updated": updated_count,
        "unchanged": unchanged_count,
    }


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
