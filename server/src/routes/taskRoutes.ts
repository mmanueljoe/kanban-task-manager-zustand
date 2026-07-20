import { Router } from "express";
import { authenticate } from "@/middlewares/authenticate.js";
import { validateBody } from "@/middlewares/validate.js";
import {
  editTaskSchema,
  moveTaskSchema,
  assignTaskSchema,
  addSubtaskSchema,
} from "@/controllers/TaskController.js";
import { addCommentSchema } from "@/controllers/CommentController.js";
import { taskController, commentController } from "@/composition.js";

export const taskRoutes = Router();

taskRoutes.use(authenticate);

taskRoutes.patch(
  "/:taskId",
  validateBody(editTaskSchema),
  taskController.editTask
);
taskRoutes.delete("/:taskId", taskController.deleteTask);
taskRoutes.patch(
  "/:taskId/move",
  validateBody(moveTaskSchema),
  taskController.moveTask
);
taskRoutes.patch(
  "/:taskId/assign",
  validateBody(assignTaskSchema),
  taskController.assignTask
);

// Subtasks nested under their task.
taskRoutes.post(
  "/:taskId/subtasks",
  validateBody(addSubtaskSchema),
  taskController.addSubtask
);
taskRoutes.patch("/:taskId/subtasks/:subtaskId", taskController.toggleSubtask);
taskRoutes.delete("/:taskId/subtasks/:subtaskId", taskController.removeSubtask);

// Comments nested under their task.
taskRoutes.post(
  "/:taskId/comments",
  validateBody(addCommentSchema),
  commentController.addComment
);
taskRoutes.get("/:taskId/comments", commentController.listComments);
