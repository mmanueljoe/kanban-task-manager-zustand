import { Router } from "express";
import { authenticate } from "@/middlewares/authenticate.js";
import { notificationController } from "@/composition.js";

export const notificationRoutes = Router();

notificationRoutes.use(authenticate);

notificationRoutes.get("/", notificationController.listNotifications);
notificationRoutes.post("/read-all", notificationController.markAllRead);
notificationRoutes.patch(
  "/:notificationId/read",
  notificationController.markRead
);
