import type { RequestHandler } from "express";
import { z } from "zod";
import { TaskService } from "@/services/TaskService.js";
import { requireUserId } from "@/utils/requireUserId.js";
import { serializeTask } from "@/utils/serialize.js";
import { success } from "@/utils/apiResponse.js";

const taskService = new TaskService();

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

// `position` is a placement *locator*, not a stored value: the client sends
// where-between-neighbours it dropped the card (frequently fractional). The
// service converts it to a real integer slot, so any finite number is valid
// here — the storage stays Int because the server, not the client, chooses it.
export const moveTaskSchema = z.object({
  toColumnId: z.string().min(1, "toColumnId is required"),
  position: z.number().finite(),
});

export const addSubtaskSchema = z.object({
  title: z.string().min(1, "Subtask title is required"),
});

export const createTask: RequestHandler = async (req, res) => {
  const { columnId } = req.params as { columnId: string };
  const task = await taskService.createTask(requireUserId(req), columnId, {
    title: req.body.title,
    description: req.body.description,
  });
  res.status(201).json(success(serializeTask(task)));
};

export const listTasks: RequestHandler = async (req, res) => {
  const { columnId } = req.params as { columnId: string };
  const tasks = await taskService.listTasks(requireUserId(req), columnId);
  res.status(200).json(success(tasks.map(serializeTask)));
};

export const editTask: RequestHandler = async (req, res) => {
  const { taskId } = req.params as { taskId: string };
  const task = await taskService.editTask(requireUserId(req), taskId, {
    title: req.body.title,
    description: req.body.description,
  });
  res.status(200).json(success(serializeTask(task)));
};

export const moveTask: RequestHandler = async (req, res) => {
  const { taskId } = req.params as { taskId: string };
  const task = await taskService.moveTask(
    requireUserId(req),
    taskId,
    req.body.toColumnId,
    req.body.position
  );
  res.status(200).json(success(serializeTask(task)));
};

export const deleteTask: RequestHandler = async (req, res) => {
  const { taskId } = req.params as { taskId: string };
  await taskService.deleteTask(requireUserId(req), taskId);
  res.status(200).json(success(null));
};

export const addSubtask: RequestHandler = async (req, res) => {
  const { taskId } = req.params as { taskId: string };
  const task = await taskService.addSubtask(
    requireUserId(req),
    taskId,
    req.body.title
  );
  res.status(201).json(success(serializeTask(task)));
};

export const toggleSubtask: RequestHandler = async (req, res) => {
  const { taskId, subtaskId } = req.params as {
    taskId: string;
    subtaskId: string;
  };
  const task = await taskService.toggleSubtask(
    requireUserId(req),
    taskId,
    subtaskId
  );
  res.status(200).json(success(serializeTask(task)));
};

export const removeSubtask: RequestHandler = async (req, res) => {
  const { taskId, subtaskId } = req.params as {
    taskId: string;
    subtaskId: string;
  };
  const task = await taskService.removeSubtask(
    requireUserId(req),
    taskId,
    subtaskId
  );
  res.status(200).json(success(serializeTask(task)));
};
