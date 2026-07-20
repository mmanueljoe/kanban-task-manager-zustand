import type { RequestHandler } from "express";
import { NotificationService } from "@/services/NotificationService.js";
import { requireUserId } from "@/utils/requireUserId.js";
import { serializeNotification } from "@/utils/serialize.js";
import { success } from "@/utils/apiResponse.js";

export class NotificationController {
  constructor(private readonly notifications: NotificationService) {}

  listNotifications: RequestHandler = async (req, res) => {
    const items = await this.notifications.listForUser(requireUserId(req));
    res.status(200).json(success(items.map(serializeNotification)));
  };

  markRead: RequestHandler = async (req, res) => {
    const { notificationId } = req.params as { notificationId: string };
    await this.notifications.markRead(requireUserId(req), notificationId);
    res.status(200).json(success(null));
  };

  markAllRead: RequestHandler = async (req, res) => {
    await this.notifications.markAllRead(requireUserId(req));
    res.status(200).json(success(null));
  };
}
