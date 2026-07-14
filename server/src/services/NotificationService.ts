import { randomUUID } from "node:crypto";
import { Notification } from "@/domain/Notification.js";
import { NotificationRepository } from "@/repositories/NotificationRepository.js";
import { NotAuthorizedError, NotFoundError } from "@/errors/AppError.js";
import type { BoardEvent } from "@/events/eventBus.js";

export class NotificationService {
  constructor(
    private readonly notifications: NotificationRepository = new NotificationRepository()
  ) {}

  // The bus listener. Only events aimed at a specific user become a
  // notification, and never for your own actions.
  async notifyFromEvent(event: BoardEvent): Promise<void> {
    if (!event.targetUserId || event.targetUserId === event.actorId) {
      return;
    }
    const notification = new Notification({
      id: randomUUID(),
      userId: event.targetUserId,
      actorId: event.actorId,
      type: event.type,
      boardId: event.boardId,
      details: event.details,
    });
    await this.notifications.create(notification);
  }

  async listForUser(userId: string): Promise<Notification[]> {
    return this.notifications.findByUserId(userId);
  }

  async markRead(userId: string, notificationId: string): Promise<void> {
    const notification = await this.notifications.findById(notificationId);
    if (!notification) {
      throw new NotFoundError("Notification not found");
    }
    if (notification.userId !== userId) {
      throw new NotAuthorizedError("That notification isn't yours");
    }
    await this.notifications.markRead(notificationId);
  }

  async markAllRead(userId: string): Promise<void> {
    await this.notifications.markAllRead(userId);
  }
}
