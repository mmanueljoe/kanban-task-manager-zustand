import type { RequestHandler } from "express";
import { NotificationService } from "@/services/NotificationService.js";
import { requireUserId } from "@/utils/requireUserId.js";
import { serializeNotification } from "@/utils/serialize.js";
import { success } from "@/utils/apiResponse.js";

const notificationService = new NotificationService();

export const listNotifications: RequestHandler = async (req, res) => {
  const items = await notificationService.listForUser(requireUserId(req));
  res.status(200).json(success(items.map(serializeNotification)));
};

export const markRead: RequestHandler = async (req, res) => {
  const { notificationId } = req.params as { notificationId: string };
  await notificationService.markRead(requireUserId(req), notificationId);
  res.status(200).json(success(null));
};

export const markAllRead: RequestHandler = async (req, res) => {
  await notificationService.markAllRead(requireUserId(req));
  res.status(200).json(success(null));
};
