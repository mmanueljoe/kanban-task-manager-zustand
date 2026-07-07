import { Router } from "express";
import { authenticate } from "@/middlewares/authenticate.js";
import { validateBody } from "@/middlewares/validate.js";
import * as task from "@/controllers/TaskController.js";

export const taskRoutes = Router();

taskRoutes.use(authenticate);

taskRoutes.patch("/:taskId", validateBody(task.editTaskSchema), task.editTask);
taskRoutes.delete("/:taskId", task.deleteTask);
taskRoutes.patch(
  "/:taskId/move",
  validateBody(task.moveTaskSchema),
  task.moveTask
);

// Subtasks nested under their task.
taskRoutes.post(
  "/:taskId/subtasks",
  validateBody(task.addSubtaskSchema),
  task.addSubtask
);
taskRoutes.patch("/:taskId/subtasks/:subtaskId", task.toggleSubtask);
taskRoutes.delete("/:taskId/subtasks/:subtaskId", task.removeSubtask);
