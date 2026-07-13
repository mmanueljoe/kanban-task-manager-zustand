import { describe, it, expect } from "vitest";
import { Activity } from "@/domain/Activity.js";

const base = {
  id: "act-1",
  boardId: "board-1",
  actorId: "user-1",
  type: "TASK_MOVED" as const,
  details: { taskTitle: "Design the landing page", to: "Done" },
};

describe("Activity", () => {
  it("constructs with the given fields", () => {
    const at = new Date("2026-01-01T00:00:00Z");
    const activity = new Activity({ ...base, createdAt: at });

    expect(activity.id).toBe("act-1");
    expect(activity.boardId).toBe("board-1");
    expect(activity.actorId).toBe("user-1");
    expect(activity.type).toBe("TASK_MOVED");
    expect(activity.details).toEqual(base.details);
    expect(activity.createdAt).toBe(at);
  });

  it("defaults createdAt to now when omitted", () => {
    const before = Date.now();
    const activity = new Activity(base);
    expect(activity.createdAt.getTime()).toBeGreaterThanOrEqual(before);
  });

  it("throws when boardId is blank", () => {
    expect(() => new Activity({ ...base, boardId: "  " })).toThrow();
  });

  it("throws when actorId is blank", () => {
    expect(() => new Activity({ ...base, actorId: "" })).toThrow();
  });

  it("does not expose its internal details for mutation", () => {
    const activity = new Activity(base);
    activity.details.to = "Todo";
    expect(activity.details.to).toBe("Done");
  });
});
