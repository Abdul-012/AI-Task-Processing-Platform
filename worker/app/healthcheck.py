import sys

from redis import Redis

from app.config import settings
from app.repository import TaskRepository


def main() -> int:
    repository = TaskRepository(settings.mongo_uri, settings.mongo_db)
    redis = Redis.from_url(settings.redis_url, socket_timeout=3)

    try:
        repository.ping()
        redis.ping()
    except Exception:
        return 1
    finally:
        repository.close()
        redis.close()

    return 0


if __name__ == "__main__":
    sys.exit(main())
