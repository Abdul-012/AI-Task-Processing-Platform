import { env } from "../config/env.js";
import { getRedisClient } from "../config/redis.js";

export async function enqueueTask(task) {
  const redis = getRedisClient();

  return redis.xAdd(env.REDIS_STREAM_KEY, "*", {
    taskId: task._id.toString(),
    userId: task.user.toString(),
    operation: task.operation,
    enqueuedAt: new Date().toISOString()
  });
}
