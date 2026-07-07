import { randomUUID } from "node:crypto";
import { Board, type CollaboratorRole } from "@/domain/Board.js";
import { BoardRepository } from "@/repositories/BoardRepository.js";
import { NotAuthorizedError, NotFoundError } from "@/errors/AppError.js";

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
    if (board.getAccessLevel(userId) !== "OWNER") {
      throw new NotAuthorizedError("Only the owner can delete this board");
    }
    await this.boards.delete(boardId);
  }

  async inviteCollaborator(
    actingUserId: string,
    boardId: string,
    collaboratorUserId: string,
    role: CollaboratorRole
  ): Promise<void> {
    const board = await this.requireBoard(boardId);
    // The entity enforces the rules (owner-only, not the owner, no duplicate).
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
    board.changeCollaboratorRole(actingUserId, collaboratorUserId, role);
    await this.boards.updateCollaboratorRole(boardId, collaboratorUserId, role);
  }

  async removeCollaborator(
    actingUserId: string,
    boardId: string,
    collaboratorUserId: string
  ): Promise<void> {
    const board = await this.requireBoard(boardId);
    board.removeCollaborator(actingUserId, collaboratorUserId);
    await this.boards.removeCollaborator(boardId, collaboratorUserId);
  }

  async transferOwnership(
    actingUserId: string,
    boardId: string,
    newOwnerId: string
  ): Promise<void> {
    const board = await this.requireBoard(boardId);
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
}
