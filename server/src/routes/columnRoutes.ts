import { Router } from "express";
import { authenticate } from "@/middlewares/authenticate.js";
import { validateBody } from "@/middlewares/validate.js";
import * as column from "@/controllers/ColumnController.js";
import * as task from "@/controllers/TaskController.js";

export const columnRoutes = Router();

columnRoutes.use(authenticate);

columnRoutes.patch(
  "/:columnId",
  validateBody(column.renameColumnSchema),
  column.renameColumn
);
columnRoutes.delete("/:columnId", column.deleteColumn);
columnRoutes.patch(
  "/:columnId/position",
  validateBody(column.reorderColumnSchema),
  column.reorderColumn
);

// Tasks nested under their column.
columnRoutes.post(
  "/:columnId/tasks",
  validateBody(task.createTaskSchema),
  task.createTask
);
columnRoutes.get("/:columnId/tasks", task.listTasks);
