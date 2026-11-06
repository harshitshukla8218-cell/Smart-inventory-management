from celery import Celery
from app.core.config import settings

celery_app = Celery(
    "smart_inventory",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=["app.tasks.inventory_tasks", "app.tasks.notification_tasks"],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    beat_schedule={
        "check-low-stock-every-hour": {
            "task": "app.tasks.inventory_tasks.check_low_stock_alert",
            "schedule": 3600.0,  # every hour
        },
        "sync-vendor-prices-every-6-hours": {
            "task": "app.tasks.inventory_tasks.sync_vendor_prices",
            "schedule": 21600.0,  # every 6 hours
        },
    },
)
