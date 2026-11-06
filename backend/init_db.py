import asyncio

from sqlalchemy import func, select

from app.core.database import AsyncSessionLocal, create_tables
from app.models.user import User
from seed import seed


async def initialize_database() -> None:
    await create_tables()

    async with AsyncSessionLocal() as db:
        user_count = await db.scalar(select(func.count(User.id)))

    if user_count == 0:
        await seed()


if __name__ == "__main__":
    asyncio.run(initialize_database())
