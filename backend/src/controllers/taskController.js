import { z } from "zod";
import { SUPPORTED_OPERATIONS } from "../domain/operations.js";
import { Task } from "../models/Task.js";
import { enqueueTask } from "../queues/taskQueue.js";
import { AppError } from "../utils/AppError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const createTaskSchema = z.object({
  body: z.object({
    title: z.string().trim().min(2).max(120),
    inputText: z.string().min(1).max(10000),
    operation: z.enum(SUPPORTED_OPERATIONS)
  }),
  params: z.object({}).default({}),
  query: z.object({}).default({})
});

export const retryTaskSchema = z.object({
  body: z.object({}).default({}),
  params: z.object({
    id: z.string().regex(/^[a-f\d]{24}$/i, "Invalid task id")
  }),
  query: z.object({}).default({})
});

export const listTasksSchema = z.object({
  body: z.object({}).default({}),
  params: z.object({}).default({}),
  query: z.object({
    status: z.enum(["pending", "running", "success", "failed"]).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(25)
  })
});

export const getTaskSchema = z.object({
  body: z.object({}).default({}),
  params: z.object({
    id: z.string().regex(/^[a-f\d]{24}$/i, "Invalid task id")
  }),
  query: z.object({}).default({})
});

export const createTask = asyncHandler(async (req, res) => {
  const { title, inputText, operation } = req.validated.body;

  const task = await Task.create({
    user: req.user._id,
    title,
    inputText,
    operation,
    status: "pending",
    logs: [
      {
        level: "info",
        message: "Task created and waiting for a worker"
      }
    ]
  });

  try {
    await enqueueTask(task);
    task.logs.push({
      level: "info",
      message: "Task published to Redis stream"
    });
    await task.save();
  } catch (error) {
    task.status = "failed";
    task.error = "Queue is unavailable. Please retry when the platform recovers.";
    task.completedAt = new Date();
    task.logs.push({
      level: "error",
      message: "Failed to publish task to Redis stream",
      meta: { reason: error.message }
    });
    await task.save();
    throw new AppError("Task could not be queued. Please retry later.", 503, {
      taskId: task._id.toString()
    });
  }

  res.status(201).json({ task });
});

export const listTasks = asyncHandler(async (req, res) => {
  const { status, page, limit } = req.validated.query;
  const filter = { user: req.user._id };

  if (status) {
    filter.status = status;
  }

  const skip = (page - 1) * limit;
  const [tasks, total] = await Promise.all([
    Task.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select("-inputText")
      .lean(),
    Task.countDocuments(filter)
  ]);

  res.json({
    tasks,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

export const getTask = asyncHandler(async (req, res) => {
  const task = await Task.findOne({
    _id: req.validated.params.id,
    user: req.user._id
  });

  if (!task) {
    throw new AppError("Task not found", 404);
  }

  res.json({ task });
});

export const retryTask = asyncHandler(async (req, res) => {
  const task = await Task.findOne({
    _id: req.validated.params.id,
    user: req.user._id
  });

  if (!task) {
    throw new AppError("Task not found", 404);
  }

  if (task.status !== "failed") {
    throw new AppError("Only failed tasks can be retried", 409);
  }

  task.status = "pending";
  task.result = null;
  task.error = null;
  task.startedAt = null;
  task.completedAt = null;
  task.logs.push({
    level: "info",
    message: "Task retry requested"
  });

  await task.save();

  try {
    await enqueueTask(task);
  } catch (error) {
    task.status = "failed";
    task.error = "Queue is unavailable. Please retry when the platform recovers.";
    task.completedAt = new Date();
    task.logs.push({
      level: "error",
      message: "Failed to publish retry to Redis stream",
      meta: { reason: error.message }
    });
    await task.save();
    throw new AppError("Task retry could not be queued. Please retry later.", 503, {
      taskId: task._id.toString()
    });
  }

  res.json({ task });
});
