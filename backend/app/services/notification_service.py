from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.notification import Notification, NotificationType, ReferenceType
from app.models.user import User, UserRole
from app.websockets.manager import manager
import uuid


async def create_notification(
    user_id: uuid.UUID,
    notification_type: NotificationType,
    title: str,
    message: str,
    reference_type: ReferenceType = None,
    reference_id: uuid.UUID = None,
    db: AsyncSession = None,
) -> Notification:
    notification = Notification(
        user_id=user_id,
        type=notification_type,
        title=title,
        message=message,
        reference_type=reference_type,
        reference_id=reference_id,
    )
    db.add(notification)
    await db.flush()

    # Send real-time notification via WebSocket
    await manager.send_to_user(
        str(user_id),
        {
            "type": "notification",
            "data": {
                "id": str(notification.id),
                "type": notification_type.value,
                "title": title,
                "message": message,
                "reference_type": reference_type.value if reference_type else None,
                "reference_id": str(reference_id) if reference_id else None,
            },
        },
    )

    return notification


async def create_notification_for_role(
    role: UserRole,
    notification_type: NotificationType,
    title: str,
    message: str,
    reference_type: ReferenceType = None,
    reference_id: uuid.UUID = None,
    db: AsyncSession = None,
) -> int:
    """Create notifications for all users with a given role."""
    result = await db.execute(select(User).where(User.role == role, User.is_active == True))
    users = result.scalars().all()

    count = 0
    for user in users:
        await create_notification(
            user_id=user.id,
            notification_type=notification_type,
            title=title,
            message=message,
            reference_type=reference_type,
            reference_id=reference_id,
            db=db,
        )
        count += 1

    return count
