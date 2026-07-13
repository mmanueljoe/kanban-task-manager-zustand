import { randomUUID } from "node:crypto";
import { Column } from "@/domain/Column.js";
import { ColumnRepository } from "@/repositories/ColumnRepository.js";
import { BoardRepository } from "@/repositories/BoardRepository.js";
import { NotAuthorizedError, NotFoundError } from "@/errors/AppError.js";
import { placeByLocator } from "@/utils/positioning.js";
import { eventBus, type EventPublisher } from "@/events/eventBus.js";

export class ColumnService {
  constructor(
    private readonly columns: ColumnRepository = new ColumnRepository(),
    private readonly boards: BoardRepository = new BoardRepository(),
    private readonly events: EventPublisher = eventBus
  ) {}

  async addColumn(
    userId: string,
    boardId: string,
    name: string
  ): Promise<Column> {
    await this.requireCanModify(userId, boardId);
    const position = (await this.columns.maxPosition(boardId)) + 1000;
    const column = new Column({ id: randomUUID(), boardId, name, position });
    const created = await this.columns.create(column);
    await this.events.publish({
      type: "COLUMN_CREATED",
      boardId,
      actorId: userId,
      details: { columnName: created.name },
    });
    return created;
  }

  // Any access level may read a board's columns.
  async listColumns(userId: string, boardId: string): Promise<Column[]> {
    const board = await this.boards.findById(boardId);
    if (!board) {
      throw new NotFoundError("Board not found");
    }
    if (board.getAccessLevel(userId) === null) {
      throw new NotAuthorizedError("You don't have access to this board");
    }
    return this.columns.findByBoardId(boardId);
  }

  async renameColumn(
    userId: string,
    columnId: string,
    name: string
  ): Promise<Column> {
    const column = await this.requireColumn(columnId);
    await this.requireCanModify(userId, column.boardId);
    const previousName = column.name;
    column.rename(name);
    await this.columns.update(column);
    await this.events.publish({
      type: "COLUMN_RENAMED",
      boardId: column.boardId,
      actorId: userId,
      details: { columnName: name, previousName },
    });
    return column;
  }

  async deleteColumn(userId: string, columnId: string): Promise<void> {
    const column = await this.requireColumn(columnId);
    await this.requireCanModify(userId, column.boardId);
    const columnName = column.name;
    const boardId = column.boardId;
    await this.columns.delete(columnId);
    await this.events.publish({
      type: "COLUMN_DELETED",
      boardId,
      actorId: userId,
      details: { columnName },
    });
  }

  // `locator` is the client's where-between hint (often fractional); the server
  // turns it into a real integer slot, re-sequencing the board's columns when
  // the neighbours have no gap left. See utils/positioning.
  async reorderColumn(
    userId: string,
    columnId: string,
    locator: number
  ): Promise<Column> {
    const column = await this.requireColumn(columnId);
    await this.requireCanModify(userId, column.boardId);

    const siblings = (await this.columns.findByBoardId(column.boardId)).filter(
      (c) => c.id !== columnId
    );
    const placement = placeByLocator(
      siblings.map((c) => c.position),
      locator
    );

    if (placement.type === "single") {
      column.moveTo(placement.position);
      await this.columns.update(column);
      return column;
    }

    // No gap left — rewrite the whole board's columns in one transaction, with
    // this column spliced into its landing slot.
    const order = [...siblings];
    order.splice(placement.movedIndex, 0, column);
    column.moveTo(placement.positions[placement.movedIndex]!);
    await this.columns.reposition(
      order.map((c, i) => ({ id: c.id, position: placement.positions[i]! }))
    );
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
