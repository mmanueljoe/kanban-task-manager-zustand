import { describe, it, expect, vi } from "vitest";
import { TaskService } from "@/services/TaskService.js";
import { TaskRepository } from "@/repositories/TaskRepository.js";
import { ColumnRepository } from "@/repositories/ColumnRepository.js";
import { BoardRepository } from "@/repositories/BoardRepository.js";
import { Board } from "@/domain/Board.js";
import { Column } from "@/domain/Column.js";
import { Task, type Subtask } from "@/domain/Task.js";
import { NotAuthorizedError, NotFoundError } from "@/errors/AppError.js";

const OWNER = "owner-1";
const EDITOR = "editor-1";
const VIEWER = "viewer-1";

function makeBoard(): Board {
  return new Board({
    id: "board-1",
    ownerId: OWNER,
    name: "Roadmap",
    collaborators: [
      { userId: EDITOR, role: "EDITOR" },
      { userId: VIEWER, role: "VIEWER" },
    ],
  });
}

function makeColumn(): Column {
  return new Column({
    id: "col-1",
    boardId: "board-1",
    name: "Todo",
    position: 1000,
  });
}

function makeTask(subtasks: Subtask[] = []): Task {
  return new Task({
    id: "task-1",
    columnId: "col-1",
    title: "Design logo",
    position: 1000,
    subtasks,
  });
}

function fakeBoards(): BoardRepository {
  return {
    findById: vi.fn().mockResolvedValue(makeBoard()),
  } as unknown as BoardRepository;
}

function fakeColumns(): ColumnRepository {
  return {
    findById: vi.fn().mockResolvedValue(makeColumn()),
  } as unknown as ColumnRepository;
}

function fakeTasks(overrides: Partial<TaskRepository> = {}): TaskRepository {
  return {
    findById: vi.fn().mockResolvedValue(makeTask()),
    create: vi.fn().mockImplementation(async (t: Task) => t),
    update: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(undefined),
    maxPosition: vi.fn().mockResolvedValue(5000),
    findByColumnId: vi.fn().mockResolvedValue([]),
    reposition: vi.fn().mockResolvedValue(undefined),
    addSubtask: vi.fn().mockResolvedValue(undefined),
    setSubtaskCompleted: vi.fn().mockResolvedValue(undefined),
    removeSubtask: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  } as unknown as TaskRepository;
}

describe("TaskService", () => {
  describe("createTask", () => {
    it("lets an editor create a task, appended after the last position", async () => {
      const tasks = fakeTasks();
      const task = await new TaskService(
        tasks,
        fakeColumns(),
        fakeBoards()
      ).createTask(EDITOR, "col-1", { title: "New task" });
      expect(task.position).toBe(6000); // maxPosition 5000 + gap
      expect(tasks.create).toHaveBeenCalledTimes(1);
    });

    it("denies a viewer", async () => {
      const tasks = fakeTasks();
      await expect(
        new TaskService(tasks, fakeColumns(), fakeBoards()).createTask(
          VIEWER,
          "col-1",
          {
            title: "New task",
          }
        )
      ).rejects.toBeInstanceOf(NotAuthorizedError);
      expect(tasks.create).not.toHaveBeenCalled();
    });

    it("throws NotFound when the column is missing", async () => {
      const columns = {
        findById: vi.fn().mockResolvedValue(null),
      } as unknown as ColumnRepository;
      await expect(
        new TaskService(fakeTasks(), columns, fakeBoards()).createTask(
          EDITOR,
          "col-1",
          {
            title: "x",
          }
        )
      ).rejects.toBeInstanceOf(NotFoundError);
    });
  });

  describe("moveTask", () => {
    it("moves the task to an empty column at the opening gap", async () => {
      const tasks = fakeTasks(); // findByColumnId → [] (empty destination)
      const task = await new TaskService(
        tasks,
        fakeColumns(),
        fakeBoards()
      ).moveTask(EDITOR, "task-1", "col-2", 2500);
      expect(task.columnId).toBe("col-2");
      expect(task.position).toBe(1000); // first slot, not the raw locator
      expect(tasks.update).toHaveBeenCalledTimes(1);
      expect(tasks.reposition).not.toHaveBeenCalled();
    });

    it("drops into the integer gap between two neighbours", async () => {
      const dest = [
        new Task({ id: "t-a", columnId: "col-2", title: "A", position: 1000 }),
        new Task({ id: "t-b", columnId: "col-2", title: "B", position: 2000 }),
      ];
      const tasks = fakeTasks({
        findByColumnId: vi.fn().mockResolvedValue(dest),
      });
      const task = await new TaskService(
        tasks,
        fakeColumns(),
        fakeBoards()
      ).moveTask(EDITOR, "task-1", "col-2", 1500); // client's midpoint locator
      expect(task.position).toBe(1500);
      expect(tasks.update).toHaveBeenCalledTimes(1);
      expect(tasks.reposition).not.toHaveBeenCalled();
    });

    it("re-sequences the destination when neighbours are adjacent", async () => {
      const dest = [
        new Task({ id: "t-a", columnId: "col-2", title: "A", position: 1000 }),
        new Task({ id: "t-b", columnId: "col-2", title: "B", position: 1001 }),
      ];
      const tasks = fakeTasks({
        findByColumnId: vi.fn().mockResolvedValue(dest),
      });
      const task = await new TaskService(
        tasks,
        fakeColumns(),
        fakeBoards()
      ).moveTask(EDITOR, "task-1", "col-2", 1000.5); // no integer gap here
      expect(task.columnId).toBe("col-2");
      expect(task.position).toBe(2000); // spliced between, fresh gaps
      expect(tasks.update).not.toHaveBeenCalled();
      expect(tasks.reposition).toHaveBeenCalledWith([
        { id: "t-a", position: 1000, columnId: undefined },
        { id: "task-1", position: 2000, columnId: "col-2" },
        { id: "t-b", position: 3000, columnId: undefined },
      ]);
    });
  });

  describe("toggleSubtask", () => {
    it("flips the subtask and persists its new state", async () => {
      const subtask: Subtask = {
        id: "s1",
        title: "Sketch",
        isCompleted: false,
      };
      const tasks = fakeTasks({
        findById: vi.fn().mockResolvedValue(makeTask([subtask])),
      });
      await new TaskService(tasks, fakeColumns(), fakeBoards()).toggleSubtask(
        EDITOR,
        "task-1",
        "s1"
      );
      // flipped false → true
      expect(tasks.setSubtaskCompleted).toHaveBeenCalledWith("s1", true);
    });
  });

  describe("listTasks", () => {
    it("lets a viewer read", async () => {
      const tasks = fakeTasks();
      await new TaskService(tasks, fakeColumns(), fakeBoards()).listTasks(
        VIEWER,
        "col-1"
      );
      expect(tasks.findByColumnId).toHaveBeenCalledWith("col-1");
    });
  });
});
