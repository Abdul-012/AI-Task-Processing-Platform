from datetime import UTC, datetime
from typing import Any

from bson import ObjectId
from pymongo import MongoClient, ReturnDocument


class TaskRepository:
    def __init__(self, mongo_uri: str, mongo_db: str) -> None:
        self.client = MongoClient(
            mongo_uri,
            serverSelectionTimeoutMS=5000,
            connectTimeoutMS=5000,
            maxPoolSize=20,
        )
        self.database = self.client[mongo_db]
        self.tasks = self.database["tasks"]

    def ping(self) -> None:
        self.client.admin.command("ping")

    def close(self) -> None:
        self.client.close()

    def mark_running(self, task_id: str) -> dict[str, Any] | None:
        now = datetime.now(UTC)
        return self.tasks.find_one_and_update(
            {
                "_id": ObjectId(task_id),
                "status": {"$in": ["pending", "running"]},
            },
            {
                "$set": {
                    "status": "running",
                    "startedAt": now,
                    "updatedAt": now,
                },
                "$push": {
                    "logs": self._log("info", "Worker started processing")
                },
            },
            return_document=ReturnDocument.AFTER,
        )

    def mark_success(self, task_id: str, result: str | int) -> None:
        now = datetime.now(UTC)
        self.tasks.update_one(
            {"_id": ObjectId(task_id)},
            {
                "$set": {
                    "status": "success",
                    "result": result,
                    "error": None,
                    "completedAt": now,
                    "updatedAt": now,
                },
                "$push": {
                    "logs": self._log("info", "Worker completed task successfully")
                },
            },
        )

    def mark_failed(self, task_id: str, error: str) -> None:
        now = datetime.now(UTC)
        self.tasks.update_one(
            {"_id": ObjectId(task_id)},
            {
                "$set": {
                    "status": "failed",
                    "error": error[:1000],
                    "completedAt": now,
                    "updatedAt": now,
                },
                "$push": {
                    "logs": self._log("error", "Worker failed to process task", {"error": error})
                },
            },
        )

    @staticmethod
    def _log(level: str, message: str, meta: dict[str, Any] | None = None) -> dict[str, Any]:
        entry: dict[str, Any] = {
            "level": level,
            "message": message,
            "timestamp": datetime.now(UTC),
        }

        if meta:
            entry["meta"] = meta

        return entry
