import { prisma } from "@/config/prisma.js";
import { Task } from "@/domain/Task.js";
import type { TaskModel, SubtaskModel } from "@/generated/prisma/models.js";

type TaskRow = TaskModel & { subtasks: SubtaskModel[] };

function toDomain(row: TaskRow): Task {
  return new Task({
    id: row.id,
    columnId: row.columnId,
    title: row.title,
    description: row.description,
    position: row.position,
    subtasks: row.subtasks.map((s) => ({
      id: s.id,
      title: s.title,
      isCompleted: s.isCompleted,
    })),
  });
}

export class TaskRepository {
  async create(task: Task): Promise<Task> {
    const row = await prisma.task.create({
      data: {
        id: task.id,
        columnId: task.columnId,
        title: task.title,
        description: task.description,
        position: task.position,
      },
    });
    return toDomain({ ...row, subtasks: [] });
  }

  async findById(id: string): Promise<Task | null> {
    const row = await prisma.task.findUnique({
      where: { id },
      include: { subtasks: true },
    });
    return row ? toDomain(row) : null;
  }

  async findByColumnId(columnId: string): Promise<Task[]> {
    const rows = await prisma.task.findMany({
      where: { columnId },
      orderBy: { position: "asc" },
      include: { subtasks: true },
    });
    return rows.map(toDomain);
  }

  // Task's own fields, including columnId — moving a task to another column is
  // just changing that value (the column is the status).
  async update(task: Task): Promise<void> {
    await prisma.task.update({
      where: { id: task.id },
      data: {
        columnId: task.columnId,
        title: task.title,
        description: task.description,
        position: task.position,
      },
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.task.delete({ where: { id } });
  }

  async maxPosition(columnId: string): Promise<number> {
    const result = await prisma.task.aggregate({
      where: { columnId },
      _max: { position: true },
    });
    return result._max.position ?? 0;
  }

  // Subtasks are child rows. The task entity validates the change first (no
  // empty title, no duplicate, must exist); these just persist the one row.
  async addSubtask(
    taskId: string,
    subtask: { id: string; title: string; isCompleted: boolean }
  ): Promise<void> {
    const result = await prisma.subtask.aggregate({
      where: { taskId },
      _max: { position: true },
    });
    const position = (result._max.position ?? 0) + 1000;
    await prisma.subtask.create({
      data: {
        id: subtask.id,
        taskId,
        title: subtask.title,
        isCompleted: subtask.isCompleted,
        position,
      },
    });
  }

  async setSubtaskCompleted(
    subtaskId: string,
    isCompleted: boolean
  ): Promise<void> {
    await prisma.subtask.update({
      where: { id: subtaskId },
      data: { isCompleted },
    });
  }

  async removeSubtask(subtaskId: string): Promise<void> {
    await prisma.subtask.delete({ where: { id: subtaskId } });
  }
}
