import { prisma } from "@/config/prisma.js";
import { Activity, type ActivityDetails } from "@/domain/Activity.js";
import type { ActivityModel } from "@/generated/prisma/models.js";

function toDomain(row: ActivityModel): Activity {
  return new Activity({
    id: row.id,
    boardId: row.boardId,
    actorId: row.actorId,
    type: row.type,
    details: row.details as ActivityDetails,
    createdAt: row.createdAt,
  });
}

export class ActivityRepository {
  async create(activity: Activity): Promise<Activity> {
    const row = await prisma.activity.create({
      data: {
        id: activity.id,
        boardId: activity.boardId,
        actorId: activity.actorId,
        type: activity.type,
        details: activity.details,
        createdAt: activity.createdAt,
      },
    });
    return toDomain(row);
  }

  async findByBoardId(boardId: string, limit = 50): Promise<Activity[]> {
    const rows = await prisma.activity.findMany({
      where: { boardId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    return rows.map(toDomain);
  }
}
