import asyncio
from app.tasks.celery_app import celery_app
import logging

logger = logging.getLogger(__name__)


def run_async(coro):
    """Helper to run async code in Celery tasks."""
    loop = asyncio.new_event_loop()
    try:
        return loop.run_until_complete(coro)
    finally:
        loop.close()


@celery_app.task(name="app.tasks.inventory_tasks.check_low_stock_alert")
def check_low_stock_alert():
    """Periodically check for low stock and send notifications."""
    async def _run():
        from sqlalchemy.ext.asyncio import AsyncSession
        from app.core.database import AsyncSessionLocal
        from app.models.inventory import Inventory
        from sqlalchemy import select

        async with AsyncSessionLocal() as db:
            result = await db.execute(
                select(Inventory).where(Inventory.available_quantity <= Inventory.min_stock_level)
            )
            low_stock = result.scalars().all()
            if low_stock:
                from app.services.notification_service import create_notification_for_role
                from app.models.notification import NotificationType, ReferenceType
                from app.models.user import UserRole

                for inv in low_stock:
                    await create_notification_for_role(
                        role=UserRole.INVENTORY,
                        notification_type=NotificationType.LOW_STOCK,
                        title="Low Stock Alert",
                        message=f"Inventory {inv.id} has only {inv.available_quantity} units (min: {inv.min_stock_level}).",
                        reference_type=ReferenceType.INVENTORY,
                        reference_id=inv.id,
                        db=db,
                    )
                await db.commit()

            logger.info(f"Low stock check complete. Found {len(low_stock)} low-stock records.")

    run_async(_run())


@celery_app.task(name="app.tasks.inventory_tasks.sync_vendor_prices")
def sync_vendor_prices():
    """Placeholder for vendor price sync. Extend with actual API calls."""
    logger.info("Vendor price sync task started (placeholder).")
    # In a real implementation, this would fetch prices from Amazon/Flipkart/Meesho APIs
    return {"status": "placeholder", "synced": 0}
