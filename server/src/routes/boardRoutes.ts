import { Router } from "express";
import { authenticate } from "@/middlewares/authenticate.js";
import { validateBody } from "@/middlewares/validate.js";
import * as board from "@/controllers/BoardController.js";
import * as column from "@/controllers/ColumnController.js";

export const boardRoutes = Router();

// Everything under /boards requires a logged-in user.
boardRoutes.use(authenticate);

boardRoutes.post("/", validateBody(board.createBoardSchema), board.createBoard);
boardRoutes.get("/", board.listBoards);
boardRoutes.get("/:boardId", board.getBoard);
boardRoutes.get("/:boardId/full", board.getBoardContents);
boardRoutes.patch(
  "/:boardId",
  validateBody(board.renameBoardSchema),
  board.renameBoard
);
boardRoutes.delete("/:boardId", board.deleteBoard);

// Columns nested under their board.
boardRoutes.post(
  "/:boardId/columns",
  validateBody(column.createColumnSchema),
  column.addColumn
);
boardRoutes.get("/:boardId/columns", column.listColumns);

// Collaborators.
boardRoutes.post(
  "/:boardId/collaborators",
  validateBody(board.inviteSchema),
  board.inviteCollaborator
);
boardRoutes.patch(
  "/:boardId/collaborators/:userId",
  validateBody(board.changeRoleSchema),
  board.changeCollaboratorRole
);
boardRoutes.delete("/:boardId/collaborators/:userId", board.removeCollaborator);

boardRoutes.post(
  "/:boardId/transfer",
  validateBody(board.transferSchema),
  board.transferOwnership
);
