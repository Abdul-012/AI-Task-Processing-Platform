import mongoose from "mongoose";
import { SUPPORTED_OPERATIONS } from "../domain/operations.js";

const taskLogSchema = new mongoose.Schema(
  {
    level: {
      type: String,
      enum: ["info", "warn", "error"],
      default: "info"
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500
    },
    meta: {
      type: mongoose.Schema.Types.Mixed,
      default: undefined
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false }
);

const taskSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 120
    },
    inputText: {
      type: String,
      required: true,
      maxlength: 10000
    },
    operation: {
      type: String,
      required: true,
      enum: SUPPORTED_OPERATIONS
    },
    status: {
      type: String,
      enum: ["pending", "running", "success", "failed"],
      default: "pending",
      index: true
    },
    result: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    error: {
      type: String,
      default: null,
      maxlength: 1000
    },
    logs: {
      type: [taskLogSchema],
      default: []
    },
    startedAt: {
      type: Date,
      default: null
    },
    completedAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

taskSchema.index({ user: 1, createdAt: -1 });
taskSchema.index({ user: 1, status: 1, createdAt: -1 });
taskSchema.index({ status: 1, createdAt: 1 });
taskSchema.index({ operation: 1, createdAt: -1 });

export const Task = mongoose.model("Task", taskSchema);
