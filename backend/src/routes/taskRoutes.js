import { Router } from "express";
import {
  createTask,
  createTaskSchema,
  getTask,
  getTaskSchema,
  listTasks,
  listTasksSchema,
  retryTask,
  retryTaskSchema
} from "../controllers/taskController.js";
import { authenticate } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";

const taskRouter = Router();

taskRouter.use(authenticate);
taskRouter.get("/", validate(listTasksSchema), listTasks);
taskRouter.post("/", validate(createTaskSchema), createTask);
taskRouter.get("/:id", validate(getTaskSchema), getTask);
taskRouter.post("/:id/retry", validate(retryTaskSchema), retryTask);

export { taskRouter };
