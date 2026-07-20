import type { RequestHandler } from "express";
import { z } from "zod";
import { TaskService } from "@/services/TaskService.js";
import { requireUserId } from "@/utils/requireUserId.js";
import { serializeTask } from "@/utils/serialize.js";
import { success } from "@/utils/apiResponse.js";

export const createTaskSchema = z.object({
  title: z.string().min(1, "Task title is required"),
  description: z.string().optional(),
});

// Edit allows updating either field; both optional, but at least one required.
export const editTaskSchema = z
  .object({
    title: z.string().min(1, "Task title is required").optional(),
    description: z.string().optional(),
  })
  .refine(
    (body) => body.title !== undefined || body.description !== undefined,
    {
      message: "Provide a title or a description to update",
    }
  );

export const moveTaskSchema = z.object({
  toColumnId: z.string().min(1, "toColumnId is required"),
  position: z.number().finite(),
});

// `null` clears the assignee; a string assigns to that board member.
export const assignTaskSchema = z.object({
  assigneeId: z.string().min(1, "assigneeId is required").nullable(),
});

export const addSubtaskSchema = z.object({
  title: z.string().min(1, "Subtask title is required"),
});

export class TaskController {
  constructor(private readonly tasks: TaskService) {}

  createTask: RequestHandler = async (req, res) => {
    const { columnId } = req.params as { columnId: string };
    const task = await this.tasks.createTask(requireUserId(req), columnId, {
      title: req.body.title,
      description: req.body.description,
    });
    res.status(201).json(success(serializeTask(task)));
  };

  listTasks: RequestHandler = async (req, res) => {
    const { columnId } = req.params as { columnId: string };
    const tasks = await this.tasks.listTasks(requireUserId(req), columnId);
    res.status(200).json(success(tasks.map(serializeTask)));
  };

  editTask: RequestHandler = async (req, res) => {
    const { taskId } = req.params as { taskId: string };
    const task = await this.tasks.editTask(requireUserId(req), taskId, {
      title: req.body.title,
      description: req.body.description,
    });
    res.status(200).json(success(serializeTask(task)));
  };

  moveTask: RequestHandler = async (req, res) => {
    const { taskId } = req.params as { taskId: string };
    const task = await this.tasks.moveTask(
      requireUserId(req),
      taskId,
      req.body.toColumnId,
      req.body.position
    );
    res.status(200).json(success(serializeTask(task)));
  };

  assignTask: RequestHandler = async (req, res) => {
    const { taskId } = req.params as { taskId: string };
    const task = await this.tasks.assignTask(
      requireUserId(req),
      taskId,
      req.body.assigneeId
    );
    res.status(200).json(success(serializeTask(task)));
  };

  deleteTask: RequestHandler = async (req, res) => {
    const { taskId } = req.params as { taskId: string };
    await this.tasks.deleteTask(requireUserId(req), taskId);
    res.status(200).json(success(null));
  };

  addSubtask: RequestHandler = async (req, res) => {
    const { taskId } = req.params as { taskId: string };
    const task = await this.tasks.addSubtask(
      requireUserId(req),
      taskId,
      req.body.title
    );
    res.status(201).json(success(serializeTask(task)));
  };

  toggleSubtask: RequestHandler = async (req, res) => {
    const { taskId, subtaskId } = req.params as {
      taskId: string;
      subtaskId: string;
    };
    const task = await this.tasks.toggleSubtask(
      requireUserId(req),
      taskId,
      subtaskId
    );
    res.status(200).json(success(serializeTask(task)));
  };

  removeSubtask: RequestHandler = async (req, res) => {
    const { taskId, subtaskId } = req.params as {
      taskId: string;
      subtaskId: string;
    };
    const task = await this.tasks.removeSubtask(
      requireUserId(req),
      taskId,
      subtaskId
    );
    res.status(200).json(success(serializeTask(task)));
  };
}
