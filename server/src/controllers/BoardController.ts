import type { RequestHandler } from "express";
import { z } from "zod";
import { BoardService } from "@/services/BoardService.js";
import { ColumnService } from "@/services/ColumnService.js";
import { TaskService } from "@/services/TaskService.js";
import { requireUserId } from "@/utils/requireUserId.js";
import {
  serializeBoard,
  serializeColumn,
  serializeTask,
} from "@/utils/serialize.js";
import { success } from "@/utils/apiResponse.js";

const boardService = new BoardService();
const columnService = new ColumnService();
const taskService = new TaskService();

export const createBoardSchema = z.object({
  name: z.string().min(1, "Board name is required"),
});

export const renameBoardSchema = z.object({
  name: z.string().min(1, "Board name is required"),
});

export const inviteSchema = z.object({
  userId: z.string().min(1, "userId is required"),
  role: z.enum(["EDITOR", "VIEWER"]),
});

export const changeRoleSchema = z.object({
  role: z.enum(["EDITOR", "VIEWER"]),
});

export const transferSchema = z.object({
  newOwnerId: z.string().min(1, "newOwnerId is required"),
});

export const createBoard: RequestHandler = async (req, res) => {
  const board = await boardService.createBoard(
    requireUserId(req),
    req.body.name
  );
  res.status(201).json(success(serializeBoard(board)));
};

export const listBoards: RequestHandler = async (req, res) => {
  const boards = await boardService.listMyBoards(requireUserId(req));
  res.status(200).json(success(boards.map(serializeBoard)));
};

export const getBoard: RequestHandler = async (req, res) => {
  const { boardId } = req.params as { boardId: string };
  const board = await boardService.getBoard(requireUserId(req), boardId);
  res.status(200).json(success(serializeBoard(board)));
};

// The whole board in one request: board + columns + all tasks.
export const getBoardContents: RequestHandler = async (req, res) => {
  const { boardId } = req.params as { boardId: string };
  const userId = requireUserId(req);
  const board = await boardService.getBoard(userId, boardId);
  const columns = await columnService.listColumns(userId, boardId);
  const tasks = await taskService.listTasksByBoard(userId, boardId);
  res.status(200).json(
    success({
      board: serializeBoard(board),
      columns: columns.map(serializeColumn),
      tasks: tasks.map(serializeTask),
    })
  );
};

export const renameBoard: RequestHandler = async (req, res) => {
  const { boardId } = req.params as { boardId: string };
  const board = await boardService.renameBoard(
    requireUserId(req),
    boardId,
    req.body.name
  );
  res.status(200).json(success(serializeBoard(board)));
};

export const deleteBoard: RequestHandler = async (req, res) => {
  const { boardId } = req.params as { boardId: string };
  await boardService.deleteBoard(requireUserId(req), boardId);
  res.status(200).json(success(null));
};

export const inviteCollaborator: RequestHandler = async (req, res) => {
  const { boardId } = req.params as { boardId: string };
  await boardService.inviteCollaborator(
    requireUserId(req),
    boardId,
    req.body.userId,
    req.body.role
  );
  res.status(201).json(success(null));
};

export const changeCollaboratorRole: RequestHandler = async (req, res) => {
  const { boardId, userId } = req.params as {
    boardId: string;
    userId: string;
  };
  await boardService.changeCollaboratorRole(
    requireUserId(req),
    boardId,
    userId,
    req.body.role
  );
  res.status(200).json(success(null));
};

export const removeCollaborator: RequestHandler = async (req, res) => {
  const { boardId, userId } = req.params as {
    boardId: string;
    userId: string;
  };
  await boardService.removeCollaborator(requireUserId(req), boardId, userId);
  res.status(200).json(success(null));
};

export const transferOwnership: RequestHandler = async (req, res) => {
  const { boardId } = req.params as { boardId: string };
  await boardService.transferOwnership(
    requireUserId(req),
    boardId,
    req.body.newOwnerId
  );
  res.status(200).json(success(null));
};
