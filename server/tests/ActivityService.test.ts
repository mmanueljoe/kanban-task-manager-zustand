import { describe, it, expect, vi } from "vitest";
import { ActivityService } from "@/services/ActivityService.js";
import { ActivityRepository } from "@/repositories/ActivityRepository.js";
import { BoardRepository } from "@/repositories/BoardRepository.js";
import { Board } from "@/domain/Board.js";
import { Activity } from "@/domain/Activity.js";
import { NotAuthorizedError, NotFoundError } from "@/errors/AppError.js";
import type { BoardEvent } from "@/events/eventBus.js";

const OWNER = "user-1";

const event: BoardEvent = {
  type: "TASK_MOVED",
  boardId: "board-1",
  actorId: OWNER,
  details: { taskTitle: "Design the landing page", to: "Done" },
};

function fakeActivityRepo(): ActivityRepository {
  return {
    create: vi.fn(async (a: Activity) => a),
    findByBoardId: vi.fn(async () => []),
  } as unknown as ActivityRepository;
}

function fakeBoardRepo(board: Board | null): BoardRepository {
  return { findById: vi.fn(async () => board) } as unknown as BoardRepository;
}

describe("ActivityService.record", () => {
  it("saves an activity built from the event", async () => {
    let saved: Activity | undefined;
    const activities = {
      create: vi.fn(async (a: Activity) => {
        saved = a;
        return a;
      }),
      findByBoardId: vi.fn(async () => []),
    } as unknown as ActivityRepository;

    await new ActivityService(activities, fakeBoardRepo(null)).record(event);

    expect(activities.create).toHaveBeenCalledTimes(1);
    expect(saved?.boardId).toBe("board-1");
    expect(saved?.actorId).toBe(OWNER);
    expect(saved?.type).toBe("TASK_MOVED");
    expect(saved?.details).toEqual(event.details);
  });
});

describe("ActivityService.listActivity", () => {
  const board = new Board({
    id: "board-1",
    ownerId: OWNER,
    name: "Product Roadmap",
    collaborators: [{ userId: "editor-1", role: "EDITOR" }],
  });

  it("returns the feed for someone with access", async () => {
    const activities = fakeActivityRepo();
    const service = new ActivityService(activities, fakeBoardRepo(board));

    await service.listActivity(OWNER, "board-1");

    expect(activities.findByBoardId).toHaveBeenCalledWith("board-1");
  });

  it("throws NotFoundError when the board doesn't exist", async () => {
    const service = new ActivityService(
      fakeActivityRepo(),
      fakeBoardRepo(null)
    );

    await expect(service.listActivity(OWNER, "board-1")).rejects.toBeInstanceOf(
      NotFoundError
    );
  });

  it("throws NotAuthorizedError for someone with no access", async () => {
    const service = new ActivityService(
      fakeActivityRepo(),
      fakeBoardRepo(board)
    );

    await expect(
      service.listActivity("stranger", "board-1")
    ).rejects.toBeInstanceOf(NotAuthorizedError);
  });
});
