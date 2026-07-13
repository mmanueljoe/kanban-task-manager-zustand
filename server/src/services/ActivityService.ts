import { randomUUID } from "node:crypto";
import { Activity } from "@/domain/Activity.js";
import { ActivityRepository } from "@/repositories/ActivityRepository.js";
import { BoardRepository } from "@/repositories/BoardRepository.js";
import { NotAuthorizedError, NotFoundError } from "@/errors/AppError.js";
import type { BoardEvent } from "@/events/eventBus.js";

export class ActivityService {
  constructor(
    private readonly activities: ActivityRepository = new ActivityRepository(),
    private readonly boards: BoardRepository = new BoardRepository()
  ) {}

  async record(event: BoardEvent): Promise<void> {
    const activity = new Activity({
      id: randomUUID(),
      boardId: event.boardId,
      actorId: event.actorId,
      type: event.type,
      details: event.details,
    });
    await this.activities.create(activity);
  }

  async listActivity(userId: string, boardId: string): Promise<Activity[]> {
    const board = await this.boards.findById(boardId);
    if (!board) {
      throw new NotFoundError("Board not found");
    }
    if (board.getAccessLevel(userId) === null) {
      throw new NotAuthorizedError("You don't have access to this board");
    }
    return this.activities.findByBoardId(boardId);
  }
}
