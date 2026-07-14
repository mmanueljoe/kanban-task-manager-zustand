import { prisma } from "@/config/prisma.js";
import { Notification } from "@/domain/Notification.js";
import type { ActivityDetails } from "@/domain/Activity.js";
import type { NotificationModel } from "@/generated/prisma/models.js";

function toDomain(row: NotificationModel): Notification {
  return new Notification({
    id: row.id,
    userId: row.userId,
    actorId: row.actorId,
    type: row.type,
    boardId: row.boardId,
    details: row.details as ActivityDetails,
    read: row.read,
    createdAt: row.createdAt,
  });
}

export class NotificationRepository {
  async create(notification: Notification): Promise<Notification> {
    const row = await prisma.notification.create({
      data: {
        id: notification.id,
        userId: notification.userId,
        actorId: notification.actorId,
        type: notification.type,
        boardId: notification.boardId,
        details: notification.details,
        read: notification.read,
        createdAt: notification.createdAt,
      },
    });
    return toDomain(row);
  }

  async findByUserId(userId: string, limit = 50): Promise<Notification[]> {
    const rows = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    return rows.map(toDomain);
  }

  async findById(id: string): Promise<Notification | null> {
    const row = await prisma.notification.findUnique({ where: { id } });
    return row ? toDomain(row) : null;
  }

  async markRead(id: string): Promise<void> {
    await prisma.notification.update({ where: { id }, data: { read: true } });
  }

  async markAllRead(userId: string): Promise<void> {
    await prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
  }
}
