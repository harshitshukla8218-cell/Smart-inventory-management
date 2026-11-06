from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.models.sales_order import SalesOrder, SalesOrderItem, SalesOrderStatus, OrderPriority
from app.models.inventory import Inventory, InventoryTransaction, TransactionType
from app.models.allocation import ProductAllocation, AllocationStatus
from app.models.user import User
import uuid
from datetime import datetime


async def allocate_sales_order(
    sales_order_id: uuid.UUID,
    current_user: User,
    db: AsyncSession,
) -> dict:
    result = await db.execute(
        select(SalesOrder)
        .options(selectinload(SalesOrder.items).selectinload(SalesOrderItem.product))
        .where(SalesOrder.id == sales_order_id)
        .with_for_update()
    )
    order = result.scalar_one_or_none()
    if not order:
        return {"success": False, "message": "Order not found"}

    all_allocated = True
    any_allocated = False

    for item in order.items:
        remaining_to_allocate = item.quantity_requested - item.quantity_allocated
        if remaining_to_allocate <= 0:
            any_allocated = True
            continue

        inv_result = await db.execute(
            select(Inventory)
            .where(
                Inventory.product_id == item.product_id,
                Inventory.available_quantity > 0,
            )
            .order_by(Inventory.available_quantity.desc())
            .with_for_update()
        )
        inventory_records = inv_result.scalars().all()

        for inv in inventory_records:
            if remaining_to_allocate <= 0:
                break
            allocate_qty = min(inv.available_quantity, remaining_to_allocate)

            before = inv.available_quantity
            inv.available_quantity -= allocate_qty
            inv.reserved_quantity += allocate_qty

            txn = InventoryTransaction(
                inventory_id=inv.id,
                transaction_type=TransactionType.ALLOCATION,
                quantity_change=-allocate_qty,
                quantity_before=before,
                quantity_after=inv.available_quantity,
                reference_type="SALES_ORDER",
                reference_id=sales_order_id,
                notes=f"Allocated to order {order.order_number}",
                created_by=current_user.id,
            )
            db.add(txn)

            allocation = ProductAllocation(
                sales_order_id=sales_order_id,
                sales_order_item_id=item.id,
                product_id=item.product_id,
                inventory_id=inv.id,
                quantity_allocated=allocate_qty,
                allocated_by=current_user.id,
                status=AllocationStatus.ACTIVE,
            )
            db.add(allocation)

            item.quantity_allocated += allocate_qty
            remaining_to_allocate -= allocate_qty
            any_allocated = True

        if remaining_to_allocate > 0:
            item.quantity_pending = remaining_to_allocate
            all_allocated = False

            from app.services.procurement_service import create_procurement_request_auto

            await create_procurement_request_auto(
                product_id=item.product_id,
                required_quantity=item.quantity_requested,
                available_quantity=item.quantity_allocated,
                shortage_quantity=remaining_to_allocate,
                requested_by=current_user.id,
                sales_order_id=sales_order_id,
                db=db,
            )

    if all_allocated:
        order.status = SalesOrderStatus.FULLY_ALLOCATED
    elif any_allocated:
        order.status = SalesOrderStatus.PARTIALLY_ALLOCATED
    else:
        order.status = SalesOrderStatus.AWAITING_STOCK

    await db.flush()
    return {"success": True, "status": order.status, "message": f"Order {order.status}"}


async def process_pending_allocations_for_product(
    product_id: uuid.UUID,
    db: AsyncSession,
    system_user_id: uuid.UUID = None,
) -> int:
    """Called after warehouse receipt confirmed. Allocate pending sales orders."""
    result = await db.execute(
        select(SalesOrder)
        .options(selectinload(SalesOrder.items))
        .join(SalesOrderItem, SalesOrder.id == SalesOrderItem.sales_order_id)
        .where(
            SalesOrderItem.product_id == product_id,
            SalesOrderItem.quantity_pending > 0,
            SalesOrder.status.in_(
                [SalesOrderStatus.AWAITING_STOCK, SalesOrderStatus.PARTIALLY_ALLOCATED]
            ),
        )
        .order_by(
            SalesOrder.priority.desc(),
            SalesOrder.created_at.asc(),
        )
    )
    orders = result.scalars().unique().all()

    allocated_count = 0
    for order in orders:
        class _SystemUser:
            id = system_user_id

        sys_user = _SystemUser()
        result_dict = await allocate_sales_order(order.id, sys_user, db)
        if result_dict.get("success"):
            allocated_count += 1

    return allocated_count
