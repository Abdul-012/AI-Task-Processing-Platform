import { Router } from "express";
import { getDatabaseHealth } from "../config/db.js";
import { getRedisHealth } from "../config/redis.js";

const healthRouter = Router();

healthRouter.get("/live", (_req, res) => {
  res.json({ status: "ok" });
});

healthRouter.get("/ready", async (_req, res) => {
  const database = getDatabaseHealth();
  const redis = await getRedisHealth();
  const ready = database.ready && redis.ready;

  res.status(ready ? 200 : 503).json({
    status: ready ? "ready" : "not_ready",
    checks: {
      database,
      redis
    }
  });
});

export { healthRouter };
