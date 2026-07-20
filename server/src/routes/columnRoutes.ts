import { Router } from "express";
import { authenticate } from "@/middlewares/authenticate.js";
import { validateBody } from "@/middlewares/validate.js";
import {
  renameColumnSchema,
  reorderColumnSchema,
} from "@/controllers/ColumnController.js";
import { createTaskSchema } from "@/controllers/TaskController.js";
import { columnController, taskController } from "@/composition.js";

export const columnRoutes = Router();

columnRoutes.use(authenticate);

columnRoutes.patch(
  "/:columnId",
  validateBody(renameColumnSchema),
  columnController.renameColumn
);
columnRoutes.delete("/:columnId", columnController.deleteColumn);
columnRoutes.patch(
  "/:columnId/position",
  validateBody(reorderColumnSchema),
  columnController.reorderColumn
);

// Tasks nested under their column.
columnRoutes.post(
  "/:columnId/tasks",
  validateBody(createTaskSchema),
  taskController.createTask
);
columnRoutes.get("/:columnId/tasks", taskController.listTasks);
