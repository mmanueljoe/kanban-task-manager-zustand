import { prisma } from "@/config/prisma.js";
import { Board, type CollaboratorRole } from "@/domain/Board.js";
import type {
  BoardModel,
  BoardCollaboratorModel,
} from "@/generated/prisma/models.js";

type BoardRow = BoardModel & { collaborators: BoardCollaboratorModel[] };

function toDomain(row: BoardRow): Board {
  return new Board({
    id: row.id,
    ownerId: row.ownerId,
    name: row.name,
    collaborators: row.collaborators.map((c) => ({
      userId: c.userId,
      role: c.role,
    })),
  });
}

export class BoardRepository {
  async create(board: Board): Promise<Board> {
    const row = await prisma.board.create({
      data: {
        id: board.id,
        ownerId: board.ownerId,
        name: board.name,
      },
    });
    return toDomain({ ...row, collaborators: [] });
  }

  async findById(id: string): Promise<Board | null> {
    const row = await prisma.board.findUnique({
      where: { id },
      include: { collaborators: true },
    });
    return row ? toDomain(row) : null;
  }

  async findByOwnerId(ownerId: string): Promise<Board[]> {
    const rows = await prisma.board.findMany({
      where: { ownerId },
      include: { collaborators: true },
    });
    return rows.map(toDomain);
  }

  // Every board a user can see: ones they own OR ones they collaborate on.
  async findAccessibleByUserId(userId: string): Promise<Board[]> {
    const rows = await prisma.board.findMany({
      where: {
        OR: [{ ownerId: userId }, { collaborators: { some: { userId } } }],
      },
      include: { collaborators: true },
    });
    return rows.map(toDomain);
  }

  // Only the board's own scalar fields (name, owner). Collaborators are synced
  // through the dedicated methods below.
  async update(board: Board): Promise<void> {
    await prisma.board.update({
      where: { id: board.id },
      data: { name: board.name, ownerId: board.ownerId },
    });
  }

  async delete(id: string): Promise<void> {
    // Cascade deletes (defined in the schema) remove columns, tasks, subtasks
    // and collaborator rows along with the board.
    await prisma.board.delete({ where: { id } });
  }

  async addCollaborator(
    boardId: string,
    collaborator: { userId: string; role: CollaboratorRole }
  ): Promise<void> {
    await prisma.boardCollaborator.create({
      data: {
        boardId,
        userId: collaborator.userId,
        role: collaborator.role,
      },
    });
  }

  async updateCollaboratorRole(
    boardId: string,
    userId: string,
    role: CollaboratorRole
  ): Promise<void> {
    await prisma.boardCollaborator.update({
      where: { boardId_userId: { boardId, userId } },
      data: { role },
    });
  }

  async removeCollaborator(boardId: string, userId: string): Promise<void> {
    await prisma.boardCollaborator.delete({
      where: { boardId_userId: { boardId, userId } },
    });
  }
}
