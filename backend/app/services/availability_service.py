from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.models.inventory import Inventory
from app.models.procurement import ProcurementRequest, ProcurementStatus
from app.models.user import User
import uuid


async def check_product_availability(
    product_id: uuid.UUID,
    quantity_requested: int,
    warehouse_id: uuid.UUID = None,
    current_user: User = None,
    db: AsyncSession = None,
) -> dict:
    query = select(Inventory).where(Inventory.product_id == product_id)
    if warehouse_id:
        query = query.where(Inventory.warehouse_id == warehouse_id)

    result = await db.execute(query)
    inventory_records = result.scalars().all()

    total_available = sum(inv.available_quantity for inv in inventory_records)

    if total_available >= quantity_requested:
        return {
            "available": True,
            "total_available": total_available,
            "shortage_quantity": 0,
            "procurement_request_id": None,
            "inventory_records": inventory_records,
        }
    else:
        shortage = quantity_requested - total_available

        from app.services.procurement_service import create_procurement_request_auto

        pr = await create_procurement_request_auto(
            product_id=product_id,
            required_quantity=quantity_requested,
            available_quantity=total_available,
            shortage_quantity=shortage,
            requested_by=current_user.id if current_user else None,
            db=db,
        )

        return {
            "available": total_available > 0,
            "total_available": total_available,
            "shortage_quantity": shortage,
            "procurement_request_id": pr.id if pr else None,
            "inventory_records": inventory_records,
        }
