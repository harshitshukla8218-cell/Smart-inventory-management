import logging
from typing import Optional, Any
from app.core.config import settings

logger = logging.getLogger(__name__)

class InMemoryRedisFallback:
    """Fallback in-memory key-value store when Redis service is not running."""
    def __init__(self):
        self._store = {}

    async def get(self, key: str) -> Optional[str]:
        return self._store.get(key)

    async def set(self, key: str, value: Any, ex: Optional[int] = None) -> bool:
        self._store[key] = str(value)
        return True

    async def delete(self, *keys: str) -> int:
        count = 0
        for k in keys:
            if k in self._store:
                del self._store[k]
                count += 1
        return count

    async def close(self):
        self._store.clear()


redis = None

async def get_redis():
    global redis
    if redis is None:
        try:
            import redis.asyncio as aioredis
            client = aioredis.from_url(settings.REDIS_URL, decode_responses=True)
            # Test ping
            await client.ping()
            redis = client
            logger.info("Connected to Redis successfully.")
        except Exception as e:
            logger.warning(f"Redis unavailable ({e}), using in-memory store fallback.")
            redis = InMemoryRedisFallback()
    return redis


async def close_redis():
    global redis
    if redis:
        try:
            await redis.close()
        except Exception:
            pass
        redis = None
