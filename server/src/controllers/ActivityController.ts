import type { RequestHandler } from "express";
import { ActivityService } from "@/services/ActivityService.js";
import { requireUserId } from "@/utils/requireUserId.js";
import { serializeActivity } from "@/utils/serialize.js";
import { success } from "@/utils/apiResponse.js";

const activityService = new ActivityService();

export const listActivity: RequestHandler = async (req, res) => {
  const { boardId } = req.params as { boardId: string };
  const activities = await activityService.listActivity(
    requireUserId(req),
    boardId
  );
  res.status(200).json(success(activities.map(serializeActivity)));
};
