import { describe, it, expect, vi } from "vitest";
import { ColumnService } from "@/services/ColumnService.js";
import { ColumnRepository } from "@/repositories/ColumnRepository.js";
import { BoardRepository } from "@/repositories/BoardRepository.js";
import { Board } from "@/domain/Board.js";
import { Column } from "@/domain/Column.js";
import { NotAuthorizedError, NotFoundError } from "@/errors/AppError.js";

const OWNER = "owner-1";
const EDITOR = "editor-1";
const VIEWER = "viewer-1";
const STRANGER = "stranger-1";

function makeBoard(): Board {
  return new Board({
    id: "board-1",
    ownerId: OWNER,
    name: "Roadmap",
    collaborators: [
      { userId: EDITOR, role: "EDITOR" },
      { userId: VIEWER, role: "VIEWER" },
    ],
  });
}

function makeColumn(): Column {
  return new Column({
    id: "col-1",
    boardId: "board-1",
    name: "Todo",
    position: 1000,
  });
}

function fakeBoards(board: Board | null = makeBoard()): BoardRepository {
  return {
    findById: vi.fn().mockResolvedValue(board),
  } as unknown as BoardRepository;
}

function fakeColumns(
  overrides: Partial<ColumnRepository> = {}
): ColumnRepository {
  return {
    findById: vi.fn().mockResolvedValue(makeColumn()),
    create: vi.fn().mockImplementation(async (c: Column) => c),
    update: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(undefined),
    maxPosition: vi.fn().mockResolvedValue(2000),
    findByBoardId: vi.fn().mockResolvedValue([]),
    reposition: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  } as unknown as ColumnRepository;
}

describe("ColumnService", () => {
  describe("addColumn", () => {
    it("lets an editor add a column, appended after the last position", async () => {
      const columns = fakeColumns();
      const column = await new ColumnService(columns, fakeBoards()).addColumn(
        EDITOR,
        "board-1",
        "Todo"
      );
      // maxPosition 2000 + 1000 gap
      expect(column.position).toBe(3000);
      expect(columns.create).toHaveBeenCalledTimes(1);
    });

    it("denies a viewer", async () => {
      const columns = fakeColumns();
      await expect(
        new ColumnService(columns, fakeBoards()).addColumn(
          VIEWER,
          "board-1",
          "Todo"
        )
      ).rejects.toBeInstanceOf(NotAuthorizedError);
      expect(columns.create).not.toHaveBeenCalled();
    });

    it("throws NotFound when the board is missing", async () => {
      await expect(
        new ColumnService(fakeColumns(), fakeBoards(null)).addColumn(
          OWNER,
          "board-1",
          "Todo"
        )
      ).rejects.toBeInstanceOf(NotFoundError);
    });
  });

  describe("renameColumn", () => {
    it("lets an editor rename and persists it", async () => {
      const columns = fakeColumns();
      const column = await new ColumnService(
        columns,
        fakeBoards()
      ).renameColumn(EDITOR, "col-1", "In Progress");
      expect(column.name).toBe("In Progress");
      expect(columns.update).toHaveBeenCalledTimes(1);
    });

    it("denies a viewer", async () => {
      await expect(
        new ColumnService(fakeColumns(), fakeBoards()).renameColumn(
          VIEWER,
          "col-1",
          "Nope"
        )
      ).rejects.toBeInstanceOf(NotAuthorizedError);
    });

    it("throws NotFound when the column is missing", async () => {
      const columns = fakeColumns({
        findById: vi.fn().mockResolvedValue(null),
      });
      await expect(
        new ColumnService(columns, fakeBoards()).renameColumn(
          EDITOR,
          "col-1",
          "x"
        )
      ).rejects.toBeInstanceOf(NotFoundError);
    });
  });

  describe("reorderColumn", () => {
    const other = (id: string, position: number) =>
      new Column({ id, boardId: "board-1", name: id, position });

    it("drops into the integer gap between two neighbours", async () => {
      const columns = fakeColumns({
        findByBoardId: vi
          .fn()
          .mockResolvedValue([
            makeColumn(),
            other("col-x", 2000),
            other("col-y", 3000),
          ]),
      });
      const column = await new ColumnService(
        columns,
        fakeBoards()
      ).reorderColumn(EDITOR, "col-1", 2500);
      expect(column.position).toBe(2500);
      expect(columns.update).toHaveBeenCalledTimes(1);
      expect(columns.reposition).not.toHaveBeenCalled();
    });

    it("re-sequences the board when neighbours are adjacent", async () => {
      const columns = fakeColumns({
        findByBoardId: vi
          .fn()
          .mockResolvedValue([
            makeColumn(),
            other("col-x", 2000),
            other("col-y", 2001),
          ]),
      });
      const column = await new ColumnService(
        columns,
        fakeBoards()
      ).reorderColumn(EDITOR, "col-1", 2000.5);
      expect(column.position).toBe(2000);
      expect(columns.update).not.toHaveBeenCalled();
      expect(columns.reposition).toHaveBeenCalledWith([
        { id: "col-x", position: 1000 },
        { id: "col-1", position: 2000 },
        { id: "col-y", position: 3000 },
      ]);
    });

    it("denies a viewer", async () => {
      await expect(
        new ColumnService(fakeColumns(), fakeBoards()).reorderColumn(
          VIEWER,
          "col-1",
          1500
        )
      ).rejects.toBeInstanceOf(NotAuthorizedError);
    });
  });

  describe("listColumns", () => {
    it("lets a viewer read", async () => {
      const columns = fakeColumns();
      await new ColumnService(columns, fakeBoards()).listColumns(
        VIEWER,
        "board-1"
      );
      expect(columns.findByBoardId).toHaveBeenCalledWith("board-1");
    });

    it("denies a stranger", async () => {
      await expect(
        new ColumnService(fakeColumns(), fakeBoards()).listColumns(
          STRANGER,
          "board-1"
        )
      ).rejects.toBeInstanceOf(NotAuthorizedError);
    });
  });
});
