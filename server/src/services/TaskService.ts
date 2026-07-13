import { randomUUID } from "node:crypto";
import { Task } from "@/domain/Task.js";
import type { Column } from "@/domain/Column.js";
import { TaskRepository } from "@/repositories/TaskRepository.js";
import { ColumnRepository } from "@/repositories/ColumnRepository.js";
import { BoardRepository } from "@/repositories/BoardRepository.js";
import {
  NotAuthorizedError,
  NotFoundError,
  ValidationError,
} from "@/errors/AppError.js";
import { placeByLocator } from "@/utils/positioning.js";
import { eventBus, type EventPublisher } from "@/events/eventBus.js";

// Tasks (and their subtasks) are content, so every change needs owner/editor
// access to the board — reached by walking task → column → board.
export class TaskService {
  constructor(
    private readonly tasks: TaskRepository = new TaskRepository(),
    private readonly columns: ColumnRepository = new ColumnRepository(),
    private readonly boards: BoardRepository = new BoardRepository(),
    private readonly events: EventPublisher = eventBus
  ) {}

  async createTask(
    userId: string,
    columnId: string,
    input: { title: string; description?: string }
  ): Promise<Task> {
    const column = await this.requireCanModifyColumn(userId, columnId);
    const position = (await this.tasks.maxPosition(columnId)) + 1000;
    const task = new Task({
      id: randomUUID(),
      columnId,
      title: input.title,
      description: input.description,
      position,
    });
    const created = await this.tasks.create(task);
    await this.events.publish({
      type: "TASK_CREATED",
      boardId: column.boardId,
      actorId: userId,
      details: { taskTitle: created.title, column: column.name },
    });
    return created;
  }

  // Any access level may read every task on a board (for the composite fetch).
  async listTasksByBoard(userId: string, boardId: string): Promise<Task[]> {
    const board = await this.boards.findById(boardId);
    if (!board) {
      throw new NotFoundError("Board not found");
    }
    if (board.getAccessLevel(userId) === null) {
      throw new NotAuthorizedError("You don't have access to this board");
    }
    return this.tasks.findByBoardId(boardId);
  }

  // Any access level may read a column's tasks.
  async listTasks(userId: string, columnId: string): Promise<Task[]> {
    const column = await this.columns.findById(columnId);
    if (!column) {
      throw new NotFoundError("Column not found");
    }
    const board = await this.boards.findById(column.boardId);
    if (!board) {
      throw new NotFoundError("Board not found");
    }
    if (board.getAccessLevel(userId) === null) {
      throw new NotAuthorizedError("You don't have access to this board");
    }
    return this.tasks.findByColumnId(columnId);
  }

  async editTask(
    userId: string,
    taskId: string,
    input: { title?: string; description?: string }
  ): Promise<Task> {
    const task = await this.requireTask(taskId);
    const column = await this.requireCanModifyColumn(userId, task.columnId);
    if (input.title !== undefined) {
      task.rename(input.title);
    }
    if (input.description !== undefined) {
      task.editDescription(input.description);
    }
    await this.tasks.update(task);
    await this.events.publish({
      type: "TASK_UPDATED",
      boardId: column.boardId,
      actorId: userId,
      details: { taskTitle: task.title },
    });
    return task;
  }

  // A drag between columns: change the column (its status) and its slot. The
  // caller must be able to modify both the source and destination boards.
  //
  // `locator` is the client's where-between hint (often fractional); the server
  // turns it into a real integer slot, re-sequencing the destination column when
  // the neighbours have no gap left. See utils/positioning.
  async moveTask(
    userId: string,
    taskId: string,
    toColumnId: string,
    locator: number
  ): Promise<Task> {
    const task = await this.requireTask(taskId);
    await this.requireCanModifyColumn(userId, task.columnId);
    const destColumn = await this.requireCanModifyColumn(userId, toColumnId);

    // Siblings = tasks already in the destination, minus this task itself (a
    // same-column reorder still sees its old slot in the list).
    const destination = (await this.tasks.findByColumnId(toColumnId)).filter(
      (t) => t.id !== taskId
    );
    const placement = placeByLocator(
      destination.map((t) => t.position),
      locator
    );
    task.moveToColumn(toColumnId);

    if (placement.type === "single") {
      task.moveTo(placement.position);
      await this.tasks.update(task);
    } else {
      // No gap left — rewrite the whole destination column in one transaction,
      // with this task spliced into its landing slot.
      const order = [...destination];
      order.splice(placement.movedIndex, 0, task);
      task.moveTo(placement.positions[placement.movedIndex]!);
      await this.tasks.reposition(
        order.map((t, i) => ({
          id: t.id,
          position: placement.positions[i]!,
          columnId: t.id === taskId ? toColumnId : undefined,
        }))
      );
    }

    await this.events.publish({
      type: "TASK_MOVED",
      boardId: destColumn.boardId,
      actorId: userId,
      details: { taskTitle: task.title, toColumn: destColumn.name },
    });
    return task;
  }

  // Assign the task to a board member, or clear it with `null`. The assignee
  // must have access to the board — you can't assign work to a stranger.
  async assignTask(
    userId: string,
    taskId: string,
    assigneeId: string | null
  ): Promise<Task> {
    const task = await this.requireTask(taskId);
    const column = await this.requireCanModifyColumn(userId, task.columnId);
    const board = await this.boards.findById(column.boardId);
    if (!board) {
      throw new NotFoundError("Board not found");
    }
    if (assigneeId !== null && board.getAccessLevel(assigneeId) === null) {
      throw new ValidationError("The assignee must be a member of this board");
    }

    task.assignTo(assigneeId);
    await this.tasks.update(task);

    if (assigneeId !== null) {
      await this.events.publish({
        type: "TASK_ASSIGNED",
        boardId: board.id,
        actorId: userId,
        targetUserId: assigneeId,
        details: { taskTitle: task.title, assigneeId },
      });
    }
    return task;
  }

  async deleteTask(userId: string, taskId: string): Promise<void> {
    const task = await this.requireTask(taskId);
    const column = await this.requireCanModifyColumn(userId, task.columnId);
    const taskTitle = task.title;
    await this.tasks.delete(taskId);
    await this.events.publish({
      type: "TASK_DELETED",
      boardId: column.boardId,
      actorId: userId,
      details: { taskTitle },
    });
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
  ): Promise<Column> {
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
    return column;
  }
}
