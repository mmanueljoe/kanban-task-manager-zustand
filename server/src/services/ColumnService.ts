import { randomUUID } from "node:crypto";
import { Column } from "@/domain/Column.js";
import { ColumnRepository } from "@/repositories/ColumnRepository.js";
import { BoardRepository } from "@/repositories/BoardRepository.js";
import { NotAuthorizedError, NotFoundError } from "@/errors/AppError.js";

export class ColumnService {
  constructor(
    private readonly columns: ColumnRepository = new ColumnRepository(),
    private readonly boards: BoardRepository = new BoardRepository()
  ) {}

  async addColumn(
    userId: string,
    boardId: string,
    name: string
  ): Promise<Column> {
    await this.requireCanModify(userId, boardId);
    const position = (await this.columns.maxPosition(boardId)) + 1000;
    const column = new Column({ id: randomUUID(), boardId, name, position });
    return this.columns.create(column);
  }

  async renameColumn(
    userId: string,
    columnId: string,
    name: string
  ): Promise<Column> {
    const column = await this.requireColumn(columnId);
    await this.requireCanModify(userId, column.boardId);
    column.rename(name);
    await this.columns.update(column);
    return column;
  }

  async deleteColumn(userId: string, columnId: string): Promise<void> {
    const column = await this.requireColumn(columnId);
    await this.requireCanModify(userId, column.boardId);
    await this.columns.delete(columnId);
  }

  async reorderColumn(
    userId: string,
    columnId: string,
    position: number
  ): Promise<Column> {
    const column = await this.requireColumn(columnId);
    await this.requireCanModify(userId, column.boardId);
    column.moveTo(position);
    await this.columns.update(column);
    return column;
  }

  private async requireColumn(columnId: string): Promise<Column> {
    const column = await this.columns.findById(columnId);
    if (!column) {
      throw new NotFoundError("Column not found");
    }
    return column;
  }

  private async requireCanModify(
    userId: string,
    boardId: string
  ): Promise<void> {
    const board = await this.boards.findById(boardId);
    if (!board) {
      throw new NotFoundError("Board not found");
    }
    if (!board.canModifyContent(userId)) {
      throw new NotAuthorizedError("You can't modify this board");
    }
  }
}
