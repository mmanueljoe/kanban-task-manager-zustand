import { Router } from "express";
import { authenticate } from "@/middlewares/authenticate.js";
import * as notification from "@/controllers/NotificationController.js";

export const notificationRoutes = Router();

notificationRoutes.use(authenticate);

notificationRoutes.get("/", notification.listNotifications);
notificationRoutes.post("/read-all", notification.markAllRead);
notificationRoutes.patch("/:notificationId/read", notification.markRead);
