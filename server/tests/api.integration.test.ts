import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";

// ── Test seam ────────────────────────────────────────────────────────────────
// These are HTTP-level tests: they drive the REAL Express app — routing, the
// authenticate + validate middleware, controllers, services, and the domain —
// and only fake the OUTERMOST layer, the repositories (the database boundary).
// That's the whole point of the layered architecture: everything above the repo
// can be exercised without a database.
//
// `vi.hoisted` builds the fake repos before the mocks below run, so every
// `new XRepository()` inside the app resolves to the SAME fake object we can
// program per-test. `@/config/env` is mocked too, so the app boots with a fixed
// JWT secret and never needs a real .env — and the tokens we mint here verify
// against that same secret.
const repos = vi.hoisted(() => ({
  user: {
    findByEmail: vi.fn(),
    findById: vi.fn(),
    findByIds: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  board: {
    create: vi.fn(),
    findById: vi.fn(),
    findAccessibleByUserId: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  column: { findById: vi.fn() },
  task: { findById: vi.fn() },
  activity: {
    create: vi.fn(),
    findByBoardId: vi.fn(),
  },
  comment: {
    create: vi.fn(),
    findByTaskId: vi.fn(),
    findById: vi.fn(),
    delete: vi.fn(),
  },
  notification: {
    create: vi.fn(),
    findByUserId: vi.fn(),
    findById: vi.fn(),
    markRead: vi.fn(),
    markAllRead: vi.fn(),
  },
}));

vi.mock("@/config/env.js", () => ({
  env: {
    nodeEnv: "test",
    isProduction: false,
    port: 3000,
    jwtSecret: "test-secret-not-for-production",
    clientOrigin: "http://localhost:5173",
  },
}));
// Each mock is a real `function` (not an arrow) so it can be called with `new`;
// returning an object from a constructor makes `new X()` yield that object.
vi.mock("@/repositories/UserRepository.js", () => ({
  UserRepository: vi.fn(function () {
    return repos.user;
  }),
}));
vi.mock("@/repositories/BoardRepository.js", () => ({
  BoardRepository: vi.fn(function () {
    return repos.board;
  }),
}));
vi.mock("@/repositories/ColumnRepository.js", () => ({
  ColumnRepository: vi.fn(function () {
    return repos.column;
  }),
}));
vi.mock("@/repositories/TaskRepository.js", () => ({
  TaskRepository: vi.fn(function () {
    return repos.task;
  }),
}));
vi.mock("@/repositories/ActivityRepository.js", () => ({
  ActivityRepository: vi.fn(function () {
    return repos.activity;
  }),
}));
vi.mock("@/repositories/CommentRepository.js", () => ({
  CommentRepository: vi.fn(function () {
    return repos.comment;
  }),
}));
vi.mock("@/repositories/NotificationRepository.js", () => ({
  NotificationRepository: vi.fn(function () {
    return repos.notification;
  }),
}));

// Imported AFTER the mocks are declared (vitest hoists vi.mock above imports).
import argon2 from "argon2";
import { app } from "@/app.js";
import { signAuthToken } from "@/utils/jwt.js";
import { User } from "@/domain/User.js";
import { Board } from "@/domain/Board.js";
import { Activity } from "@/domain/Activity.js";
import { Task } from "@/domain/Task.js";
import { Column } from "@/domain/Column.js";
import { Comment } from "@/domain/Comment.js";
import { Notification } from "@/domain/Notification.js";

const USER_ID = "11111111-1111-1111-1111-111111111111";
const OTHER_ID = "99999999-9999-9999-9999-999999999999";

function fakeUser(
  overrides: Partial<{ id: string; email: string; passwordHash: string }> = {}
) {
  return new User({
    id: overrides.id ?? USER_ID,
    name: "Alice",
    email: overrides.email ?? "alice@example.com",
    passwordHash: overrides.passwordHash ?? "hash",
  });
}

// A signed cookie for USER_ID, so requests pass the authenticate middleware.
async function authCookie(userId = USER_ID): Promise<string> {
  return `token=${await signAuthToken(userId)}`;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("Auth routes", () => {
  it("registers a user, returns the profile envelope, and sets the cookie", async () => {
    repos.user.findByEmail.mockResolvedValue(null);
    repos.user.create.mockImplementation(async (u: User) => u);

    const res = await request(app).post("/api/auth/register").send({
      name: "Alice",
      email: "alice@example.com",
      password: "Password123!",
    });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe("success");
    expect(res.body.data).toMatchObject({
      name: "Alice",
      email: "alice@example.com",
      role: "USER",
    });
    // The password is never echoed back.
    expect(res.body.data.password).toBeUndefined();
    expect(res.body.data.passwordHash).toBeUndefined();
    // The auth cookie is set.
    const setCookie = res.headers["set-cookie"] as unknown as string[];
    expect(setCookie.join(";")).toMatch(/token=/);
  });

  it("rejects a duplicate email with 409", async () => {
    repos.user.findByEmail.mockResolvedValue(fakeUser());

    const res = await request(app).post("/api/auth/register").send({
      name: "Alice",
      email: "alice@example.com",
      password: "Password123!",
    });

    expect(res.status).toBe(409);
    expect(res.body.status).toBe("error");
    expect(repos.user.create).not.toHaveBeenCalled();
  });

  it("returns 400 with per-field errors on invalid registration", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "",
      email: "not-an-email",
      password: "short",
    });

    expect(res.status).toBe(400);
    expect(res.body.status).toBe("error");
    // The validate middleware collects one message per bad field.
    expect(res.body.errors).toHaveProperty("email");
    expect(res.body.errors).toHaveProperty("password");
    // It never reached the database.
    expect(repos.user.findByEmail).not.toHaveBeenCalled();
  });

  it("logs in with correct credentials and sets the cookie", async () => {
    const passwordHash = await argon2.hash("Password123!");
    repos.user.findByEmail.mockResolvedValue(fakeUser({ passwordHash }));

    const res = await request(app).post("/api/auth/login").send({
      email: "alice@example.com",
      password: "Password123!",
    });

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ email: "alice@example.com" });
    const setCookie = res.headers["set-cookie"] as unknown as string[];
    expect(setCookie.join(";")).toMatch(/token=/);
  });

  it("rejects a wrong password with 401", async () => {
    const passwordHash = await argon2.hash("Password123!");
    repos.user.findByEmail.mockResolvedValue(fakeUser({ passwordHash }));

    const res = await request(app).post("/api/auth/login").send({
      email: "alice@example.com",
      password: "wrong-password",
    });

    expect(res.status).toBe(401);
    expect(res.body.status).toBe("error");
  });
});

// Authentication failures — no token, bad token, wrong password — return 401
// (NotAuthenticatedError). *Authorization* failures — logged in but not allowed
// — return 403 (see the RBAC case in "Boards CRUD"). Keeping the two distinct is
// the standard HTTP contract.
describe("Protected routes", () => {
  it("returns 401 for /auth/me without a cookie", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
    expect(res.body.status).toBe("error");
  });

  it("returns 401 for /boards without a cookie", async () => {
    const res = await request(app).get("/api/boards");
    expect(res.status).toBe(401);
  });

  it("returns 401 when the cookie is a garbage token", async () => {
    const res = await request(app)
      .get("/api/boards")
      .set("Cookie", "token=not.a.real.jwt");
    expect(res.status).toBe(401);
  });

  it("returns the current user for /auth/me with a valid cookie", async () => {
    repos.user.findById.mockResolvedValue(fakeUser());

    const res = await request(app)
      .get("/api/auth/me")
      .set("Cookie", await authCookie());

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      id: USER_ID,
      email: "alice@example.com",
    });
  });
});

describe("Boards CRUD", () => {
  it("creates a board (201) and returns the board DTO", async () => {
    repos.board.create.mockImplementation(async (b: Board) => b);

    const res = await request(app)
      .post("/api/boards")
      .set("Cookie", await authCookie())
      .send({ name: "Product Roadmap" });

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({
      ownerId: USER_ID,
      name: "Product Roadmap",
      collaborators: [],
    });
    expect(res.body.data.id).toBeTruthy();
  });

  it("returns 400 when creating a board with an empty name", async () => {
    const res = await request(app)
      .post("/api/boards")
      .set("Cookie", await authCookie())
      .send({ name: "" });

    expect(res.status).toBe(400);
    expect(res.body.errors).toHaveProperty("name");
    expect(repos.board.create).not.toHaveBeenCalled();
  });

  it("lists only the boards the user can access", async () => {
    const board = new Board({
      id: "b0000000-0000-0000-0000-000000000001",
      ownerId: USER_ID,
      name: "Product Roadmap",
      collaborators: [],
    });
    repos.board.findAccessibleByUserId.mockResolvedValue([board]);

    const res = await request(app)
      .get("/api/boards")
      .set("Cookie", await authCookie());

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].name).toBe("Product Roadmap");
    expect(repos.board.findAccessibleByUserId).toHaveBeenCalledWith(USER_ID);
  });

  it("returns 404 for a board that does not exist", async () => {
    repos.board.findById.mockResolvedValue(null);

    const res = await request(app)
      .get("/api/boards/b0000000-0000-0000-0000-000000000001")
      .set("Cookie", await authCookie());

    expect(res.status).toBe(404);
  });

  it("returns 403 when a stranger reads a board they have no access to (RBAC)", async () => {
    const someoneElsesBoard = new Board({
      id: "b0000000-0000-0000-0000-000000000001",
      ownerId: OTHER_ID,
      name: "Not yours",
      collaborators: [],
    });
    repos.board.findById.mockResolvedValue(someoneElsesBoard);

    const res = await request(app)
      .get("/api/boards/b0000000-0000-0000-0000-000000000001")
      .set("Cookie", await authCookie());

    expect(res.status).toBe(403);
    expect(res.body.status).toBe("error");
  });
});

describe("Activity feed", () => {
  it("returns the board's activity for a member", async () => {
    const board = new Board({
      id: "board-1",
      ownerId: USER_ID,
      name: "Product Roadmap",
      collaborators: [],
    });
    repos.board.findById.mockResolvedValue(board);
    repos.activity.findByBoardId.mockResolvedValue([
      new Activity({
        id: "a1",
        boardId: "board-1",
        actorId: USER_ID,
        type: "TASK_MOVED",
        details: { taskTitle: "Design the landing page", toColumn: "Done" },
        createdAt: new Date("2026-01-01T00:00:00Z"),
      }),
    ]);

    const res = await request(app)
      .get("/api/boards/board-1/activity")
      .set("Cookie", await authCookie());

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].type).toBe("TASK_MOVED");
    expect(res.body.data[0].createdAt).toBe("2026-01-01T00:00:00.000Z");
    expect(repos.activity.findByBoardId).toHaveBeenCalledWith("board-1");
  });

  it("returns 403 when a stranger asks for the feed", async () => {
    const board = new Board({
      id: "board-1",
      ownerId: OTHER_ID,
      name: "Not yours",
      collaborators: [],
    });
    repos.board.findById.mockResolvedValue(board);

    const res = await request(app)
      .get("/api/boards/board-1/activity")
      .set("Cookie", await authCookie());

    expect(res.status).toBe(403);
  });
});

describe("Comments", () => {
  beforeEach(() => {
    repos.task.findById.mockResolvedValue(
      new Task({
        id: "task-1",
        columnId: "col-1",
        title: "A task",
        position: 1000,
      })
    );
    repos.column.findById.mockResolvedValue(
      new Column({
        id: "col-1",
        boardId: "board-1",
        name: "Todo",
        position: 1000,
      })
    );
    repos.board.findById.mockResolvedValue(
      new Board({
        id: "board-1",
        ownerId: USER_ID,
        name: "Product Roadmap",
        collaborators: [],
      })
    );
  });

  it("adds a comment (201)", async () => {
    repos.comment.create.mockImplementation(async (c: Comment) => c);

    const res = await request(app)
      .post("/api/tasks/task-1/comments")
      .set("Cookie", await authCookie())
      .send({ body: "Nice work" });

    expect(res.status).toBe(201);
    expect(res.body.data.body).toBe("Nice work");
  });

  it("rejects an empty comment with 400", async () => {
    const res = await request(app)
      .post("/api/tasks/task-1/comments")
      .set("Cookie", await authCookie())
      .send({ body: "" });

    expect(res.status).toBe(400);
    expect(repos.comment.create).not.toHaveBeenCalled();
  });

  it("lists a task's comments", async () => {
    repos.comment.findByTaskId.mockResolvedValue([
      new Comment({
        id: "c1",
        taskId: "task-1",
        authorId: USER_ID,
        body: "Hello",
        createdAt: new Date("2026-01-01T00:00:00Z"),
      }),
    ]);

    const res = await request(app)
      .get("/api/tasks/task-1/comments")
      .set("Cookie", await authCookie());

    expect(res.status).toBe(200);
    expect(res.body.data[0].body).toBe("Hello");
  });
});

describe("Notifications", () => {
  it("returns 401 without a cookie", async () => {
    const res = await request(app).get("/api/notifications");
    expect(res.status).toBe(401);
  });

  it("lists the current user's notifications", async () => {
    repos.notification.findByUserId.mockResolvedValue([
      new Notification({
        id: "n1",
        userId: USER_ID,
        actorId: OTHER_ID,
        type: "TASK_ASSIGNED",
        boardId: "board-1",
        details: { taskTitle: "Design the landing page" },
        read: false,
        createdAt: new Date("2026-01-01T00:00:00Z"),
      }),
    ]);

    const res = await request(app)
      .get("/api/notifications")
      .set("Cookie", await authCookie());

    expect(res.status).toBe(200);
    expect(res.body.data[0].type).toBe("TASK_ASSIGNED");
    expect(res.body.data[0].read).toBe(false);
    expect(repos.notification.findByUserId).toHaveBeenCalledWith(USER_ID);
  });
});
