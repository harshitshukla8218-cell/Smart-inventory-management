from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from typing import List, Optional
from uuid import UUID
from datetime import datetime
from app.core.database import get_db
from app.api.deps import get_current_user, require_inventory
from app.models.user import User
from app.models.warehouse import WarehouseReceipt, WarehouseReceiptItem, ReceiptStatus
from app.models.inventory import Inventory, InventoryTransaction, TransactionType
from app.models.purchase_order import PurchaseOrder, PurchaseOrderItem, POStatus
from app.schemas.warehouse_receipt import WarehouseReceiptCreate, WarehouseReceiptUpdate, WarehouseReceiptResponse

router = APIRouter(prefix="/warehouse-receipts", tags=["Warehouse Receipts"])


async def generate_receipt_number(db: AsyncSession) -> str:
    result = await db.execute(select(func.count(WarehouseReceipt.id)))
    count = result.scalar() or 0
    return f"WR-{datetime.now().year}-{str(count + 1).zfill(5)}"


@router.get("/", response_model=List[WarehouseReceiptResponse])
async def list_receipts(
    skip: int = 0,
    limit: int = Query(default=50, le=200),
    status_filter: Optional[ReceiptStatus] = None,
    warehouse_id: Optional[UUID] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = select(WarehouseReceipt).options(selectinload(WarehouseReceipt.items))
    if status_filter:
        query = query.where(WarehouseReceipt.status == status_filter)
    if warehouse_id:
        query = query.where(WarehouseReceipt.warehouse_id == warehouse_id)
    query = query.order_by(WarehouseReceipt.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/", response_model=WarehouseReceiptResponse, status_code=status.HTTP_201_CREATED)
async def create_receipt(
    request: WarehouseReceiptCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_inventory),
):
    receipt_number = await generate_receipt_number(db)

    receipt = WarehouseReceipt(
        receipt_number=receipt_number,
        purchase_order_id=request.purchase_order_id,
        warehouse_id=request.warehouse_id,
        received_by=current_user.id,
        notes=request.notes,
        status=ReceiptStatus.IN_PROGRESS,
    )
    db.add(receipt)
    await db.flush()

    for item_data in request.items:
        item = WarehouseReceiptItem(
            warehouse_receipt_id=receipt.id,
            product_id=item_data.product_id,
            purchase_order_item_id=item_data.purchase_order_item_id,
            expected_quantity=item_data.expected_quantity,
            received_quantity=item_data.received_quantity,
            damaged_quantity=item_data.damaged_quantity,
            condition=item_data.condition,
            notes=item_data.notes,
        )
        db.add(item)

        # Update inventory
        inv_result = await db.execute(
            select(Inventory).where(
                Inventory.product_id == item_data.product_id,
                Inventory.warehouse_id == request.warehouse_id,
            ).with_for_update()
        )
        inv = inv_result.scalar_one_or_none()

        good_qty = item_data.received_quantity - item_data.damaged_quantity
        if inv:
            before = inv.available_quantity
            inv.available_quantity += good_qty
            inv.total_quantity += item_data.received_quantity
            inv.damaged_quantity += item_data.damaged_quantity
            inv.updated_by = current_user.id

            txn = InventoryTransaction(
                inventory_id=inv.id,
                transaction_type=TransactionType.RECEIPT,
                quantity_change=good_qty,
                quantity_before=before,
                quantity_after=inv.available_quantity,
                reference_type="WAREHOUSE_RECEIPT",
                reference_id=receipt.id,
                notes=f"Receipt {receipt_number}",
                created_by=current_user.id,
            )
            db.add(txn)
        else:
            # Create new inventory record
            inv = Inventory(
                product_id=item_data.product_id,
                warehouse_id=request.warehouse_id,
                total_quantity=item_data.received_quantity,
                available_quantity=good_qty,
                damaged_quantity=item_data.damaged_quantity,
                updated_by=current_user.id,
            )
            db.add(inv)
            await db.flush()

            txn = InventoryTransaction(
                inventory_id=inv.id,
                transaction_type=TransactionType.RECEIPT,
                quantity_change=good_qty,
                quantity_before=0,
                quantity_after=good_qty,
                reference_type="WAREHOUSE_RECEIPT",
                reference_id=receipt.id,
                notes=f"Receipt {receipt_number} - initial",
                created_by=current_user.id,
            )
            db.add(txn)

        # Update PO item if linked
        if item_data.purchase_order_item_id:
            po_item_result = await db.execute(
                select(PurchaseOrderItem).where(PurchaseOrderItem.id == item_data.purchase_order_item_id)
            )
            po_item = po_item_result.scalar_one_or_none()
            if po_item:
                po_item.quantity_received += item_data.received_quantity

    # Determine if fully or partially received
    all_received = all(
        i.received_quantity >= i.expected_quantity for i in request.items
    )
    receipt.status = ReceiptStatus.COMPLETED if all_received else ReceiptStatus.PARTIAL

    # Update PO status if linked
    if request.purchase_order_id:
        po_result = await db.execute(
            select(PurchaseOrder).options(selectinload(PurchaseOrder.items)).where(
                PurchaseOrder.id == request.purchase_order_id
            )
        )
        po = po_result.scalar_one_or_none()
        if po:
            po.status = POStatus.RECEIVED if all_received else POStatus.PARTIALLY_RECEIVED

    # Trigger pending allocations for each received product
    from app.services.allocation_service import process_pending_allocations_for_product

    received_products = {item_data.product_id for item_data in request.items if item_data.received_quantity > 0}
    for product_id in received_products:
        await process_pending_allocations_for_product(product_id, db, system_user_id=current_user.id)

    # Notify
    from app.services.notification_service import create_notification_for_role
    from app.models.notification import NotificationType, ReferenceType
    from app.models.user import UserRole

    await create_notification_for_role(
        role=UserRole.INVENTORY,
        notification_type=NotificationType.ARRIVED,
        title="Stock Arrived",
        message=f"Warehouse receipt {receipt_number} processed.",
        reference_type=ReferenceType.WAREHOUSE_RECEIPT,
        reference_id=receipt.id,
        db=db,
    )

    await db.commit()
    await db.refresh(receipt)
    return receipt


@router.get("/{receipt_id}", response_model=WarehouseReceiptResponse)
async def get_receipt(
    receipt_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(WarehouseReceipt).options(selectinload(WarehouseReceipt.items)).where(WarehouseReceipt.id == receipt_id)
    )
    receipt = result.scalar_one_or_none()
    if not receipt:
        raise HTTPException(status_code=404, detail="Receipt not found")
    return receipt
