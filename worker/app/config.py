import os
from dataclasses import dataclass


@dataclass(frozen=True)
class Settings:
    mongo_uri: str = os.getenv("MONGO_URI", "mongodb://localhost:27017/ai_tasks")
    mongo_db: str = os.getenv("MONGO_DB", "ai_tasks")
    redis_url: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    stream_key: str = os.getenv("REDIS_STREAM_KEY", "tasks:stream")
    dead_letter_stream: str = os.getenv("REDIS_DEAD_LETTER_STREAM", "tasks:dead-letter")
    consumer_group: str = os.getenv("REDIS_CONSUMER_GROUP", "task-workers")
    consumer_name: str = os.getenv("WORKER_NAME", f"worker-{os.getpid()}")
    block_ms: int = int(os.getenv("REDIS_BLOCK_MS", "5000"))
    stale_message_ms: int = int(os.getenv("REDIS_STALE_MESSAGE_MS", "60000"))
    reclaim_interval_seconds: int = int(os.getenv("REDIS_RECLAIM_INTERVAL_SECONDS", "30"))
    log_level: str = os.getenv("LOG_LEVEL", "INFO")


settings = Settings()
