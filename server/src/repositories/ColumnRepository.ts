import { prisma } from "@/config/prisma.js";
import { Column } from "@/domain/Column.js";
import type { ColumnModel } from "@/generated/prisma/models.js";

function toDomain(row: ColumnModel): Column {
  return new Column({
    id: row.id,
    boardId: row.boardId,
    name: row.name,
    position: row.position,
  });
}

export class ColumnRepository {
  async create(column: Column): Promise<Column> {
    const row = await prisma.column.create({
      data: {
        id: column.id,
        boardId: column.boardId,
        name: column.name,
        position: column.position,
      },
    });
    return toDomain(row);
  }

  async findById(id: string): Promise<Column | null> {
    const row = await prisma.column.findUnique({ where: { id } });
    return row ? toDomain(row) : null;
  }

  async findByBoardId(boardId: string): Promise<Column[]> {
    const rows = await prisma.column.findMany({
      where: { boardId },
      orderBy: { position: "asc" },
    });
    return rows.map(toDomain);
  }
}
