import http from "http";
import { app } from "./app.js";
import { connectDatabase, disconnectDatabase } from "./config/db.js";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { connectRedis, disconnectRedis } from "./config/redis.js";

const server = http.createServer(app);

async function start() {
  await connectDatabase();
  await connectRedis();

  server.listen(env.PORT, () => {
    logger.info({ port: env.PORT }, "backend API listening");
  });
}

async function shutdown(signal) {
  logger.info({ signal }, "shutting down backend API");
  server.close(async () => {
    await Promise.allSettled([disconnectRedis(), disconnectDatabase()]);
    process.exit(0);
  });

  setTimeout(() => {
    logger.error("forced shutdown after timeout");
    process.exit(1);
  }, 10000).unref();
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

start().catch((error) => {
  logger.error({ error }, "failed to start backend API");
  process.exit(1);
});
