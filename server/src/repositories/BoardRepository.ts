import { prisma } from "@/config/prisma.js";
import { Board } from "@/domain/Board.js";
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
}
