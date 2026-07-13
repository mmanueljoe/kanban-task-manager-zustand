import { logger } from "@/config/logger.js";
import type { ActivityType, ActivityDetails } from "@/domain/Activity.js";

export type BoardEvent = {
  type: ActivityType;
  boardId: string;
  actorId: string;
  // Present when the event concerns a specific user (assigned, invited, …), so
  // listeners like notifications know who to reach without parsing `details`.
  targetUserId?: string;
  details: ActivityDetails;
};

export interface EventPublisher {
  publish(event: BoardEvent): Promise<void>;
}

type Handler = (event: BoardEvent) => Promise<void> | void;

export class EventBus implements EventPublisher {
  private readonly handlers: Handler[] = [];

  subscribe(handler: Handler): void {
    this.handlers.push(handler);
  }

  async publish(event: BoardEvent): Promise<void> {
    await Promise.all(
      this.handlers.map(async (handler) => {
        try {
          await handler(event);
        } catch (err) {
          // A listener failing (say, the activity write) must never break the
          // user action that emitted the event.
          logger.error({ err, event: event.type }, "event handler failed");
        }
      })
    );
  }
}

export const eventBus = new EventBus();
