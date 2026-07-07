import { randomUUID } from "node:crypto";
import { Board, type CollaboratorRole } from "@/domain/Board.js";
import { BoardRepository } from "@/repositories/BoardRepository.js";
import {
  ConflictError,
  NotAuthorizedError,
  NotFoundError,
  ValidationError,
} from "@/errors/AppError.js";

export class BoardService {
  constructor(
    private readonly boards: BoardRepository = new BoardRepository()
  ) {}

  async createBoard(ownerId: string, name: string): Promise<Board> {
    const board = new Board({
      id: randomUUID(),
      ownerId,
      name,
      collaborators: [],
    });
    return this.boards.create(board);
  }

  // Any access level (owner/editor/viewer) may read; a stranger may not.
  async getBoard(userId: string, boardId: string): Promise<Board> {
    const board = await this.requireBoard(boardId);
    if (board.getAccessLevel(userId) === null) {
      throw new NotAuthorizedError("You don't have access to this board");
    }
    return board;
  }

  async listMyBoards(userId: string): Promise<Board[]> {
    return this.boards.findAccessibleByUserId(userId);
  }

  async renameBoard(
    userId: string,
    boardId: string,
    name: string
  ): Promise<Board> {
    const board = await this.requireBoard(boardId);
    if (!board.canModifyContent(userId)) {
      throw new NotAuthorizedError("You can't modify this board");
    }
    board.rename(name);
    await this.boards.update(board);
    return board;
  }

  async deleteBoard(userId: string, boardId: string): Promise<void> {
    const board = await this.requireBoard(boardId);
    this.requireOwner(board, userId, "delete this board");
    await this.boards.delete(boardId);
  }

  async inviteCollaborator(
    actingUserId: string,
    boardId: string,
    collaboratorUserId: string,
    role: CollaboratorRole
  ): Promise<void> {
    const board = await this.requireBoard(boardId);
    this.requireOwner(board, actingUserId, "invite collaborators");
    if (collaboratorUserId === board.ownerId) {
      throw new ValidationError("The owner cannot be added as a collaborator");
    }
    if (board.collaborators.some((c) => c.userId === collaboratorUserId)) {
      throw new ConflictError("That user is already a collaborator");
    }
    // Entity re-validates as defense-in-depth; our checks above give the right
    // HTTP status first.
    board.addCollaborator(actingUserId, { userId: collaboratorUserId, role });
    await this.boards.addCollaborator(boardId, {
      userId: collaboratorUserId,
      role,
    });
  }

  async changeCollaboratorRole(
    actingUserId: string,
    boardId: string,
    collaboratorUserId: string,
    role: CollaboratorRole
  ): Promise<void> {
    const board = await this.requireBoard(boardId);
    this.requireOwner(board, actingUserId, "change collaborator roles");
    this.requireCollaborator(board, collaboratorUserId);
    board.changeCollaboratorRole(actingUserId, collaboratorUserId, role);
    await this.boards.updateCollaboratorRole(boardId, collaboratorUserId, role);
  }

  async removeCollaborator(
    actingUserId: string,
    boardId: string,
    collaboratorUserId: string
  ): Promise<void> {
    const board = await this.requireBoard(boardId);
    this.requireOwner(board, actingUserId, "remove collaborators");
    this.requireCollaborator(board, collaboratorUserId);
    board.removeCollaborator(actingUserId, collaboratorUserId);
    await this.boards.removeCollaborator(boardId, collaboratorUserId);
  }

  async transferOwnership(
    actingUserId: string,
    boardId: string,
    newOwnerId: string
  ): Promise<void> {
    const board = await this.requireBoard(boardId);
    this.requireOwner(board, actingUserId, "transfer ownership");
    board.changeOwner(actingUserId, newOwnerId);
    await this.boards.update(board);
  }

  private async requireBoard(boardId: string): Promise<Board> {
    const board = await this.boards.findById(boardId);
    if (!board) {
      throw new NotFoundError("Board not found");
    }
    return board;
  }

  private requireOwner(
    board: Board,
    actingUserId: string,
    action: string
  ): void {
    if (board.getAccessLevel(actingUserId) !== "OWNER") {
      throw new NotAuthorizedError(`Only the owner can ${action}`);
    }
  }

  private requireCollaborator(board: Board, userId: string): void {
    if (!board.collaborators.some((c) => c.userId === userId)) {
      throw new NotFoundError("Collaborator not found");
    }
  }
}
