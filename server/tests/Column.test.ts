import { describe, it, expect } from "vitest";
import { Column } from "@/domain/Column.js";

const validParams = {
  id: "col-1",
  boardId: "board-1",
  name: "Todo",
  position: 100,
};

describe("Column", () => {
  describe("construction", () => {
    it("builds a valid column and exposes it through getters", () => {
      const column = new Column(validParams);

      expect(column.id).toBe("col-1");
      expect(column.boardId).toBe("board-1");
      expect(column.name).toBe("Todo");
      expect(column.position).toBe(100);
    });

    it("rejects an empty name", () => {
      expect(() => new Column({ ...validParams, name: "" })).toThrow(
        "Column name can't be empty"
      );
    });

    it("rejects a whitespace-only name", () => {
      expect(() => new Column({ ...validParams, name: "   " })).toThrow(
        "Column name can't be empty"
      );
    });

    it("rejects a missing board id", () => {
      expect(() => new Column({ ...validParams, boardId: "  " })).toThrow(
        "A board id is required"
      );
    });
  });

  describe("rename", () => {
    it("updates the name", () => {
      const column = new Column(validParams);

      column.rename("In Progress");

      expect(column.name).toBe("In Progress");
    });

    it("rejects an empty name", () => {
      const column = new Column(validParams);

      expect(() => column.rename("")).toThrow("Column name can't be empty");
    });

    it("rejects a whitespace-only name", () => {
      const column = new Column(validParams);

      expect(() => column.rename("   ")).toThrow("Column name can't be empty");
    });
  });

  describe("moveTo", () => {
    it("updates the position", () => {
      const column = new Column(validParams);

      column.moveTo(250);

      expect(column.position).toBe(250);
    });
  });
});
