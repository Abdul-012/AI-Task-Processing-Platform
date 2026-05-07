import mongoose from "mongoose";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";
import { AppError } from "../utils/AppError.js";

export function notFoundHandler(req, _res, next) {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
}

export function errorHandler(error, _req, res, _next) {
  let statusCode = error.statusCode || 500;
  let message = error.message || "Internal server error";
  const details = error.details;

  if (error instanceof mongoose.Error.CastError) {
    statusCode = 404;
    message = "Resource not found";
  }

  if (error?.code === 11000) {
    statusCode = 409;
    message = "Resource already exists";
  }

  if (statusCode >= 500) {
    logger.error({ error }, "request failed");
  }

  res.status(statusCode).json({
    error: {
      message,
      details,
      ...(env.NODE_ENV !== "production" ? { stack: error.stack } : {})
    }
  });
}
