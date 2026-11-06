from app.tasks.celery_app import celery_app
import logging

logger = logging.getLogger(__name__)


@celery_app.task(name="app.tasks.notification_tasks.send_email_notification")
def send_email_notification(to_email: str, subject: str, body: str):
    """Send email notification (uses fastapi-mail config)."""
    # Implement with fastapi-mail or smtplib
    logger.info(f"Email notification task: to={to_email}, subject={subject}")
    # In production, integrate with fastapi-mail here
    return {"status": "sent", "to": to_email}


@celery_app.task(name="app.tasks.notification_tasks.bulk_notify_role")
def bulk_notify_role(role: str, title: str, message: str, reference_type: str = None, reference_id: str = None):
    """Send bulk notifications to all users of a role (async via Celery)."""
    import asyncio

    async def _run():
        from app.core.database import AsyncSessionLocal
        from app.services.notification_service import create_notification_for_role
        from app.models.user import UserRole
        from app.models.notification import NotificationType, ReferenceType
        import uuid

        async with AsyncSessionLocal() as db:
            role_enum = UserRole(role)
            ref_type = ReferenceType(reference_type) if reference_type else None
            ref_id = uuid.UUID(reference_id) if reference_id else None

            await create_notification_for_role(
                role=role_enum,
                notification_type=NotificationType.INVENTORY_UPDATED,
                title=title,
                message=message,
                reference_type=ref_type,
                reference_id=ref_id,
                db=db,
            )
            await db.commit()

    loop = asyncio.new_event_loop()
    try:
        loop.run_until_complete(_run())
    finally:
        loop.close()

    return {"status": "sent", "role": role}
