import { describe, it, expect } from "vitest";
import { Task, type Subtask } from "@/domain/Task.js";

const validParams = {
  id: "task-1",
  columnId: "col-1",
  title: "Design the logo",
  description: "Use the brand palette",
  position: 100,
};

const subtaskA: Subtask = { id: "sub-a", title: "Sketch", isCompleted: false };
const subtaskB: Subtask = {
  id: "sub-b",
  title: "Vectorize",
  isCompleted: true,
};

describe("Task", () => {
  describe("construction", () => {
    it("builds a valid task and exposes it through getters", () => {
      const task = new Task(validParams);

      expect(task.id).toBe("task-1");
      expect(task.columnId).toBe("col-1");
      expect(task.title).toBe("Design the logo");
      expect(task.description).toBe("Use the brand palette");
      expect(task.position).toBe(100);
      expect(task.subtasks).toEqual([]);
    });

    it("defaults description to an empty string when omitted", () => {
      const task = new Task({ ...validParams, description: undefined });

      expect(task.description).toBe("");
    });

    it("keeps the subtasks it was constructed with", () => {
      const task = new Task({ ...validParams, subtasks: [subtaskA, subtaskB] });

      expect(task.subtasks).toEqual([subtaskA, subtaskB]);
    });

    it("rejects an empty title", () => {
      expect(() => new Task({ ...validParams, title: "" })).toThrow(
        "Task title can't be empty"
      );
    });

    it("rejects a whitespace-only title", () => {
      expect(() => new Task({ ...validParams, title: "   " })).toThrow(
        "Task title can't be empty"
      );
    });

    it("rejects a missing column id", () => {
      expect(() => new Task({ ...validParams, columnId: "  " })).toThrow(
        "A column id is required"
      );
    });
  });

  // Same guarantee the board makes: the list you read back is a copy, so
  // mutating it can't corrupt the task's private state.
  describe("encapsulation", () => {
    it("returns a copy of the subtask list, not the internal array", () => {
      const task = new Task({ ...validParams, subtasks: [subtaskA] });

      const snapshot = task.subtasks as Subtask[];
      snapshot.push(subtaskB);

      expect(task.subtasks).toEqual([subtaskA]);
    });
  });

  describe("rename", () => {
    it("updates the title", () => {
      const task = new Task(validParams);

      task.rename("Design the mark");

      expect(task.title).toBe("Design the mark");
    });

    it("rejects an empty title", () => {
      const task = new Task(validParams);

      expect(() => task.rename("")).toThrow("Task title can't be empty");
    });
  });

  describe("editDescription", () => {
    it("updates the description", () => {
      const task = new Task(validParams);

      task.editDescription("New notes");

      expect(task.description).toBe("New notes");
    });

    it("allows clearing the description to empty", () => {
      const task = new Task(validParams);

      task.editDescription("");

      expect(task.description).toBe("");
    });
  });

  describe("moveTo", () => {
    it("updates the position", () => {
      const task = new Task(validParams);

      task.moveTo(250);

      expect(task.position).toBe(250);
    });
  });

  describe("moveToColumn", () => {
    it("changes which column the task belongs to", () => {
      const task = new Task(validParams);

      task.moveToColumn("col-2");

      expect(task.columnId).toBe("col-2");
    });

    it("rejects a missing column id", () => {
      const task = new Task(validParams);

      expect(() => task.moveToColumn("  ")).toThrow("A column id is required");
    });
  });

  describe("addSubtask", () => {
    it("appends a new subtask", () => {
      const task = new Task(validParams);

      task.addSubtask(subtaskA);

      expect(task.subtasks).toEqual([subtaskA]);
    });

    it("rejects an empty subtask title", () => {
      const task = new Task(validParams);

      expect(() =>
        task.addSubtask({ id: "sub-x", title: "", isCompleted: false })
      ).toThrow("Subtask title can't be empty");
    });

    it("refuses to add a subtask whose id already exists", () => {
      const task = new Task({ ...validParams, subtasks: [subtaskA] });

      expect(() => task.addSubtask(subtaskA)).toThrow("Subtask already exists");
    });
  });

  describe("toggleSubtask", () => {
    it("flips an incomplete subtask to complete", () => {
      const task = new Task({ ...validParams, subtasks: [subtaskA] });

      task.toggleSubtask("sub-a");

      expect(task.subtasks[0]?.isCompleted).toBe(true);
    });

    it("flips a complete subtask back to incomplete", () => {
      const task = new Task({ ...validParams, subtasks: [subtaskB] });

      task.toggleSubtask("sub-b");

      expect(task.subtasks[0]?.isCompleted).toBe(false);
    });

    it("throws when the subtask does not exist", () => {
      const task = new Task(validParams);

      expect(() => task.toggleSubtask("missing")).toThrow("Subtask not found");
    });
  });

  describe("removeSubtask", () => {
    it("removes the subtask", () => {
      const task = new Task({ ...validParams, subtasks: [subtaskA, subtaskB] });

      task.removeSubtask("sub-a");

      expect(task.subtasks).toEqual([subtaskB]);
    });

    it("throws when the subtask does not exist", () => {
      const task = new Task(validParams);

      expect(() => task.removeSubtask("missing")).toThrow("Subtask not found");
    });
  });

  describe("completedCount / totalCount", () => {
    it("counts completed and total subtasks", () => {
      const task = new Task({ ...validParams, subtasks: [subtaskA, subtaskB] });

      expect(task.completedCount()).toBe(1);
      expect(task.totalCount()).toBe(2);
    });

    it("reports zero for a task with no subtasks", () => {
      const task = new Task(validParams);

      expect(task.completedCount()).toBe(0);
      expect(task.totalCount()).toBe(0);
    });
  });
});
