import logging
import signal
import time
from collections.abc import Mapping
from datetime import UTC, datetime

from redis import Redis, ResponseError

from app.config import settings
from app.logging_config import configure_logging
from app.processor import run_operation
from app.repository import TaskRepository

logger = logging.getLogger("task-worker")
running = True


class TaskWorker:
    def __init__(self) -> None:
        self.redis = Redis.from_url(settings.redis_url, decode_responses=True)
        self.repository = TaskRepository(settings.mongo_uri, settings.mongo_db)
        self.last_reclaim_at = 0.0

    def start(self) -> None:
        self.ensure_consumer_group()
        logger.info(
            "worker started consumer=%s stream=%s group=%s",
            settings.consumer_name,
            settings.stream_key,
            settings.consumer_group,
        )

        while running:
            self.reclaim_stale_messages_if_due()
            response = self.redis.xreadgroup(
                groupname=settings.consumer_group,
                consumername=settings.consumer_name,
                streams={settings.stream_key: ">"},
                count=1,
                block=settings.block_ms,
            )

            for _stream, messages in response:
                for message_id, fields in messages:
                    self.process_message(message_id, fields)

    def close(self) -> None:
        self.repository.close()
        self.redis.close()

    def ensure_consumer_group(self) -> None:
        try:
            self.redis.xgroup_create(
                name=settings.stream_key,
                groupname=settings.consumer_group,
                id="0",
                mkstream=True,
            )
        except ResponseError as error:
            if "BUSYGROUP" not in str(error):
                raise

    def process_message(self, message_id: str, fields: Mapping[str, str]) -> None:
        task_id = fields.get("taskId")

        if not task_id:
            logger.warning("message missing taskId message_id=%s", message_id)
            self.redis.xack(settings.stream_key, settings.consumer_group, message_id)
            return

        logger.info("processing task task_id=%s message_id=%s", task_id, message_id)

        try:
            task = self.repository.mark_running(task_id)

            if not task:
                logger.info("task not eligible for processing task_id=%s", task_id)
                return

            result = run_operation(task["operation"], task["inputText"])
            self.repository.mark_success(task_id, result)
            logger.info("completed task task_id=%s", task_id)
        except Exception as error:
            logger.exception("failed to process task task_id=%s", task_id)
            self.repository.mark_failed(task_id, str(error))
            self.redis.xadd(
                settings.dead_letter_stream,
                {
                    "taskId": task_id,
                    "error": str(error),
                    "failedAt": datetime.now(UTC).isoformat(),
                },
            )
        finally:
            self.redis.xack(settings.stream_key, settings.consumer_group, message_id)

    def reclaim_stale_messages_if_due(self) -> None:
        now = time.monotonic()
        if now - self.last_reclaim_at < settings.reclaim_interval_seconds:
            return

        self.last_reclaim_at = now

        try:
            _next_id, messages, *_rest = self.redis.xautoclaim(
                name=settings.stream_key,
                groupname=settings.consumer_group,
                consumername=settings.consumer_name,
                min_idle_time=settings.stale_message_ms,
                start_id="0-0",
                count=10,
            )
        except ResponseError as error:
            logger.warning("could not reclaim stale messages error=%s", error)
            return

        for message_id, fields in messages:
            logger.info("reclaimed stale message message_id=%s", message_id)
            self.process_message(message_id, fields)


def stop(_signum: int, _frame: object) -> None:
    global running
    running = False


def main() -> None:
    configure_logging(settings.log_level)
    signal.signal(signal.SIGTERM, stop)
    signal.signal(signal.SIGINT, stop)

    worker = TaskWorker()
    try:
        worker.start()
    finally:
        worker.close()


if __name__ == "__main__":
    main()
