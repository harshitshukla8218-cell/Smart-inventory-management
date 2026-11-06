import logging
from sqlalchemy.engine import make_url
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from app.core.config import settings

logger = logging.getLogger(__name__)

database_url = make_url(settings.DATABASE_URL)
connect_args = {}

if database_url.drivername in {"postgres", "postgresql"}:
    database_url = database_url.set(drivername="postgresql+asyncpg")

if database_url.drivername == "postgresql+asyncpg":
    query = dict(database_url.query)
    sslmode = query.pop("sslmode", None)
    query.pop("channel_binding", None)
    database_url = database_url.set(query=query)
    if sslmode:
        connect_args["ssl"] = sslmode

is_sqlite = database_url.drivername.startswith("sqlite")

engine_kwargs = {
    "echo": settings.ENVIRONMENT == "development",
}

if not is_sqlite:
    engine_kwargs.update(
        {
            "pool_pre_ping": True,
            "pool_recycle": 300,
            "pool_size": 5,
            "max_overflow": 5,
            "connect_args": connect_args,
        }
    )
else:
    engine_kwargs.update({"connect_args": {"check_same_thread": False}})

engine = create_async_engine(database_url, **engine_kwargs)

AsyncSessionLocal = async_sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)


class Base(DeclarativeBase):
    pass


async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def create_tables():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database tables initialized successfully.")
