import type { RequestHandler } from "express";
import { ActivityService } from "@/services/ActivityService.js";
import { requireUserId } from "@/utils/requireUserId.js";
import { serializeActivity } from "@/utils/serialize.js";
import { success } from "@/utils/apiResponse.js";

export class ActivityController {
  constructor(private readonly activities: ActivityService) {}

  listActivity: RequestHandler = async (req, res) => {
    const { boardId } = req.params as { boardId: string };
    const activities = await this.activities.listActivity(
      requireUserId(req),
      boardId
    );
    res.status(200).json(success(activities.map(serializeActivity)));
  };
}
