import { randomUUID } from "node:crypto";
import { Task } from "@/domain/Task.js";
import { TaskRepository } from "@/repositories/TaskRepository.js";
import { ColumnRepository } from "@/repositories/ColumnRepository.js";
import { BoardRepository } from "@/repositories/BoardRepository.js";
import { NotAuthorizedError, NotFoundError } from "@/errors/AppError.js";

// Tasks (and their subtasks) are content, so every change needs owner/editor
// access to the board — reached by walking task → column → board.
export class TaskService {
  constructor(
    private readonly tasks: TaskRepository = new TaskRepository(),
    private readonly columns: ColumnRepository = new ColumnRepository(),
    private readonly boards: BoardRepository = new BoardRepository()
  ) {}

  async createTask(
    userId: string,
    columnId: string,
    input: { title: string; description?: string }
  ): Promise<Task> {
    await this.requireCanModifyColumn(userId, columnId);
    const position = (await this.tasks.maxPosition(columnId)) + 1000;
    const task = new Task({
      id: randomUUID(),
      columnId,
      title: input.title,
      description: input.description,
      position,
    });
    return this.tasks.create(task);
  }

  async editTask(
    userId: string,
    taskId: string,
    input: { title?: string; description?: string }
  ): Promise<Task> {
    const task = await this.requireTask(taskId);
    await this.requireCanModifyColumn(userId, task.columnId);
    if (input.title !== undefined) {
      task.rename(input.title);
    }
    if (input.description !== undefined) {
      task.editDescription(input.description);
    }
    await this.tasks.update(task);
    return task;
  }

  // A drag between columns: change the column (its status) and its slot. The
  // caller must be able to modify both the source and destination boards.
  async moveTask(
    userId: string,
    taskId: string,
    toColumnId: string,
    position: number
  ): Promise<Task> {
    const task = await this.requireTask(taskId);
    await this.requireCanModifyColumn(userId, task.columnId);
    await this.requireCanModifyColumn(userId, toColumnId);
    task.moveToColumn(toColumnId);
    task.moveTo(position);
    await this.tasks.update(task);
    return task;
  }

  async deleteTask(userId: string, taskId: string): Promise<void> {
    const task = await this.requireTask(taskId);
    await this.requireCanModifyColumn(userId, task.columnId);
    await this.tasks.delete(taskId);
  }

  async addSubtask(
    userId: string,
    taskId: string,
    title: string
  ): Promise<Task> {
    const task = await this.requireTask(taskId);
    await this.requireCanModifyColumn(userId, task.columnId);
    const subtask = { id: randomUUID(), title, isCompleted: false };
    task.addSubtask(subtask); // enforces non-empty title + no duplicate id
    await this.tasks.addSubtask(taskId, subtask);
    return task;
  }

  async toggleSubtask(
    userId: string,
    taskId: string,
    subtaskId: string
  ): Promise<Task> {
    const task = await this.requireTask(taskId);
    await this.requireCanModifyColumn(userId, task.columnId);
    task.toggleSubtask(subtaskId); // enforces the subtask exists, flips it
    const toggled = task.subtasks.find((s) => s.id === subtaskId);
    if (toggled) {
      await this.tasks.setSubtaskCompleted(subtaskId, toggled.isCompleted);
    }
    return task;
  }

  async removeSubtask(
    userId: string,
    taskId: string,
    subtaskId: string
  ): Promise<Task> {
    const task = await this.requireTask(taskId);
    await this.requireCanModifyColumn(userId, task.columnId);
    task.removeSubtask(subtaskId); // enforces the subtask exists
    await this.tasks.removeSubtask(subtaskId);
    return task;
  }

  private async requireTask(taskId: string): Promise<Task> {
    const task = await this.tasks.findById(taskId);
    if (!task) {
      throw new NotFoundError("Task not found");
    }
    return task;
  }

  // A task only knows its columnId, so we load the column to find the board,
  // then check access on that board.
  private async requireCanModifyColumn(
    userId: string,
    columnId: string
  ): Promise<void> {
    const column = await this.columns.findById(columnId);
    if (!column) {
      throw new NotFoundError("Column not found");
    }
    const board = await this.boards.findById(column.boardId);
    if (!board) {
      throw new NotFoundError("Board not found");
    }
    if (!board.canModifyContent(userId)) {
      throw new NotAuthorizedError("You can't modify this board");
    }
  }
}
