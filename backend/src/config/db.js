import mongoose from "mongoose";
import { env } from "./env.js";
import { logger } from "./logger.js";

export async function connectDatabase() {
  mongoose.set("strictQuery", true);

  await mongoose.connect(env.MONGO_URI, {
    serverSelectionTimeoutMS: 5000,
    maxPoolSize: 25,
    minPoolSize: 2
  });

  logger.info("connected to MongoDB");
}

export async function disconnectDatabase() {
  await mongoose.disconnect();
}

export function getDatabaseHealth() {
  return {
    ready: mongoose.connection.readyState === 1,
    readyState: mongoose.connection.readyState
  };
}
