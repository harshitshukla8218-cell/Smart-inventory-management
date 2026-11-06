from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.security import get_token_subject_id, verify_token
from app.models.user import User
from app.websockets.manager import manager
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ws", tags=["WebSocket"])


@router.websocket("/notifications")
async def websocket_notifications(
    websocket: WebSocket,
    token: str = Query(...),
    db: AsyncSession = Depends(get_db),
):
    """WebSocket endpoint for real-time notifications. Pass token as query param."""
    payload = verify_token(token, "access")
    if not payload:
        await websocket.close(code=4001, reason="Invalid token")
        return

    user_id = get_token_subject_id(payload)
    if user_id is None:
        await websocket.close(code=4001, reason="Invalid token subject")
        return
    result = await db.execute(select(User).where(User.id == user_id, User.is_active == True))
    user = result.scalar_one_or_none()
    if not user:
        await websocket.close(code=4001, reason="User not found")
        return

    await manager.connect(websocket, str(user.id))
    try:
        # Send a welcome message
        await websocket.send_json({
            "type": "connected",
            "data": {"user_id": str(user.id), "message": "WebSocket connected"},
        })

        while True:
            # Keep the connection alive; handle pings from client
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        manager.disconnect(websocket, str(user.id))
        logger.info(f"User {user.id} disconnected from WebSocket")
    except Exception as e:
        logger.error(f"WebSocket error for user {user_id}: {e}")
        manager.disconnect(websocket, str(user.id))
