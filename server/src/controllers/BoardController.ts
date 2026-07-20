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

export const createBoardSchema = z.object({
  name: z.string().min(1, "Board name is required"),
});

export const renameBoardSchema = z.object({
  name: z.string().min(1, "Board name is required"),
});

export const inviteSchema = z.object({
  email: z.email("A valid email is required"),
  role: z.enum(["EDITOR", "VIEWER"]),
});

export const changeRoleSchema = z.object({
  role: z.enum(["EDITOR", "VIEWER"]),
});

export const transferSchema = z.object({
  newOwnerId: z.string().min(1, "newOwnerId is required"),
});

export class BoardController {
  // Services are injected, not created here — the routes file decides which
  // concrete ones to hand in. Handlers are arrow properties so `this` stays
  // bound when Express calls them as bare functions.
  constructor(
    private readonly boards: BoardService,
    private readonly columns: ColumnService,
    private readonly tasks: TaskService
  ) {}

  createBoard: RequestHandler = async (req, res) => {
    const board = await this.boards.createBoard(
      requireUserId(req),
      req.body.name
    );
    res.status(201).json(success(serializeBoard(board)));
  };

  listBoards: RequestHandler = async (req, res) => {
    const boards = await this.boards.listMyBoards(requireUserId(req));
    res.status(200).json(success(boards.map(serializeBoard)));
  };

  getBoard: RequestHandler = async (req, res) => {
    const { boardId } = req.params as { boardId: string };
    const board = await this.boards.getBoard(requireUserId(req), boardId);
    res.status(200).json(success(serializeBoard(board)));
  };

  // The whole board in one request: board + columns + all tasks.
  getBoardContents: RequestHandler = async (req, res) => {
    const { boardId } = req.params as { boardId: string };
    const userId = requireUserId(req);
    const board = await this.boards.getBoard(userId, boardId);
    const columns = await this.columns.listColumns(userId, boardId);
    const tasks = await this.tasks.listTasksByBoard(userId, boardId);
    res.status(200).json(
      success({
        board: serializeBoard(board),
        columns: columns.map(serializeColumn),
        tasks: tasks.map(serializeTask),
      })
    );
  };

  renameBoard: RequestHandler = async (req, res) => {
    const { boardId } = req.params as { boardId: string };
    const board = await this.boards.renameBoard(
      requireUserId(req),
      boardId,
      req.body.name
    );
    res.status(200).json(success(serializeBoard(board)));
  };

  deleteBoard: RequestHandler = async (req, res) => {
    const { boardId } = req.params as { boardId: string };
    await this.boards.deleteBoard(requireUserId(req), boardId);
    res.status(200).json(success(null));
  };

  getMembers: RequestHandler = async (req, res) => {
    const { boardId } = req.params as { boardId: string };
    const members = await this.boards.listMembers(requireUserId(req), boardId);
    res.status(200).json(success(members));
  };

  inviteCollaborator: RequestHandler = async (req, res) => {
    const { boardId } = req.params as { boardId: string };
    await this.boards.inviteCollaborator(
      requireUserId(req),
      boardId,
      req.body.email,
      req.body.role
    );
    res.status(201).json(success(null));
  };

  changeCollaboratorRole: RequestHandler = async (req, res) => {
    const { boardId, userId } = req.params as {
      boardId: string;
      userId: string;
    };
    await this.boards.changeCollaboratorRole(
      requireUserId(req),
      boardId,
      userId,
      req.body.role
    );
    res.status(200).json(success(null));
  };

  removeCollaborator: RequestHandler = async (req, res) => {
    const { boardId, userId } = req.params as {
      boardId: string;
      userId: string;
    };
    await this.boards.removeCollaborator(requireUserId(req), boardId, userId);
    res.status(200).json(success(null));
  };

  transferOwnership: RequestHandler = async (req, res) => {
    const { boardId } = req.params as { boardId: string };
    await this.boards.transferOwnership(
      requireUserId(req),
      boardId,
      req.body.newOwnerId
    );
    res.status(200).json(success(null));
  };
}
