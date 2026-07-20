import { UserService } from "@/services/UserService.js";
import { BoardService } from "@/services/BoardService.js";
import { ColumnService } from "@/services/ColumnService.js";
import { TaskService } from "@/services/TaskService.js";
import { CommentService } from "@/services/CommentService.js";
import { NotificationService } from "@/services/NotificationService.js";
import { ActivityService } from "@/services/ActivityService.js";

import { AuthController } from "@/controllers/AuthController.js";
import { BoardController } from "@/controllers/BoardController.js";
import { ColumnController } from "@/controllers/ColumnController.js";
import { TaskController } from "@/controllers/TaskController.js";
import { CommentController } from "@/controllers/CommentController.js";
import { NotificationController } from "@/controllers/NotificationController.js";
import { AdminController } from "@/controllers/AdminController.js";
import { ActivityController } from "@/controllers/ActivityController.js";

const userService = new UserService();
const boardService = new BoardService();
const columnService = new ColumnService();
const taskService = new TaskService();
const commentService = new CommentService();
const notificationService = new NotificationService();
const activityService = new ActivityService();

export const authController = new AuthController(userService);
export const boardController = new BoardController(
  boardService,
  columnService,
  taskService
);
export const columnController = new ColumnController(columnService);
export const taskController = new TaskController(taskService);
export const commentController = new CommentController(commentService);
export const notificationController = new NotificationController(
  notificationService
);
export const adminController = new AdminController(userService);
export const activityController = new ActivityController(activityService);
