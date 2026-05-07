import { createClient } from "redis";
import { env } from "./env.js";
import { logger } from "./logger.js";

let redisClient;

export function getRedisClient() {
  if (!redisClient) {
    redisClient = createClient({
      url: env.REDIS_URL,
      socket: {
        reconnectStrategy: (retries) => Math.min(retries * 100, 3000)
      }
    });

    redisClient.on("error", (error) => {
      logger.error({ error }, "redis client error");
    });
  }

  return redisClient;
}

export async function connectRedis() {
  const client = getRedisClient();

  if (!client.isOpen) {
    await client.connect();
    logger.info("connected to Redis");
  }
}

export async function disconnectRedis() {
  if (redisClient?.isOpen) {
    await redisClient.quit();
  }
}

export async function getRedisHealth() {
  const client = getRedisClient();

  if (!client.isOpen) {
    return { ready: false };
  }

  try {
    const pong = await client.ping();
    return { ready: pong === "PONG" };
  } catch (error) {
    logger.warn({ error }, "redis health check failed");
    return { ready: false };
  }
}
