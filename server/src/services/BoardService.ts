import { randomUUID } from "node:crypto";
import type { BoardMemberDTO } from "@kanban/shared";
import { Board, type CollaboratorRole } from "@/domain/Board.js";
import { BoardRepository } from "@/repositories/BoardRepository.js";
import { UserRepository } from "@/repositories/UserRepository.js";
import {
  ConflictError,
  NotAuthorizedError,
  NotFoundError,
  ValidationError,
} from "@/errors/AppError.js";

export class BoardService {
  constructor(
    private readonly boards: BoardRepository = new BoardRepository(),
    private readonly users: UserRepository = new UserRepository()
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

  // Every person on the board (owner + collaborators) with display info.
  async listMembers(
    userId: string,
    boardId: string
  ): Promise<BoardMemberDTO[]> {
    const board = await this.requireBoard(boardId);
    if (board.getAccessLevel(userId) === null) {
      throw new NotAuthorizedError("You don't have access to this board");
    }
    const users = await this.users.findByIds([
      board.ownerId,
      ...board.collaborators.map((c) => c.userId),
    ]);
    const byId = new Map(users.map((u) => [u.id, u]));

    const members: BoardMemberDTO[] = [];
    const owner = byId.get(board.ownerId);
    if (owner) {
      members.push({
        userId: owner.id,
        name: owner.name,
        email: owner.email,
        role: "OWNER",
      });
    }
    for (const c of board.collaborators) {
      const u = byId.get(c.userId);
      if (u) {
        members.push({
          userId: u.id,
          name: u.name,
          email: u.email,
          role: c.role,
        });
      }
    }
    return members;
  }

  // Invite by email — users don't know each other's ids. Resolves the email to
  // a user, then applies the owner/duplicate rules.
  async inviteCollaborator(
    actingUserId: string,
    boardId: string,
    email: string,
    role: CollaboratorRole
  ): Promise<void> {
    const board = await this.requireBoard(boardId);
    this.requireOwner(board, actingUserId, "invite collaborators");

    const invitee = await this.users.findByEmail(email);
    if (!invitee) {
      throw new NotFoundError("No user with that email");
    }
    if (invitee.id === board.ownerId) {
      throw new ValidationError("The owner cannot be added as a collaborator");
    }
    if (board.collaborators.some((c) => c.userId === invitee.id)) {
      throw new ConflictError("That user is already a collaborator");
    }
    // Entity re-validates as defense-in-depth; our checks above give the right
    // HTTP status first.
    board.addCollaborator(actingUserId, { userId: invitee.id, role });
    await this.boards.addCollaborator(boardId, { userId: invitee.id, role });
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
