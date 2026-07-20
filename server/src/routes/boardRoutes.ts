import { Router } from "express";
import { authenticate } from "@/middlewares/authenticate.js";
import { validateBody } from "@/middlewares/validate.js";
import {
  createBoardSchema,
  renameBoardSchema,
  inviteSchema,
  changeRoleSchema,
  transferSchema,
} from "@/controllers/BoardController.js";
import { createColumnSchema } from "@/controllers/ColumnController.js";
import {
  boardController,
  columnController,
  activityController,
} from "@/composition.js";

export const boardRoutes = Router();

// Everything under /boards requires a logged-in user.
boardRoutes.use(authenticate);

boardRoutes.post(
  "/",
  validateBody(createBoardSchema),
  boardController.createBoard
);
boardRoutes.get("/", boardController.listBoards);
boardRoutes.get("/:boardId", boardController.getBoard);
boardRoutes.get("/:boardId/full", boardController.getBoardContents);
boardRoutes.patch(
  "/:boardId",
  validateBody(renameBoardSchema),
  boardController.renameBoard
);
boardRoutes.delete("/:boardId", boardController.deleteBoard);

// Columns nested under their board.
boardRoutes.post(
  "/:boardId/columns",
  validateBody(createColumnSchema),
  columnController.addColumn
);
boardRoutes.get("/:boardId/columns", columnController.listColumns);

// Activity feed for the board.
boardRoutes.get("/:boardId/activity", activityController.listActivity);

// Collaborators.
boardRoutes.get("/:boardId/members", boardController.getMembers);
boardRoutes.post(
  "/:boardId/collaborators",
  validateBody(inviteSchema),
  boardController.inviteCollaborator
);
boardRoutes.patch(
  "/:boardId/collaborators/:userId",
  validateBody(changeRoleSchema),
  boardController.changeCollaboratorRole
);
boardRoutes.delete(
  "/:boardId/collaborators/:userId",
  boardController.removeCollaborator
);

boardRoutes.post(
  "/:boardId/transfer",
  validateBody(transferSchema),
  boardController.transferOwnership
);
