import { describe, it, expect } from "vitest";
import { Board, type Collaborator } from "../src/domain/Board.js";

const OWNER = "owner-1";
const EDITOR = "editor-1";
const VIEWER = "viewer-1";
const STRANGER = "stranger-1";

// Builds a board owned by OWNER. Pass collaborators per test; default to none.
function makeBoard(collaborators: Collaborator[] = []) {
  return new Board({
    boardId: "board-1",
    ownerId: OWNER,
    name: "Roadmap",
    collaborators,
  });
}

const editor: Collaborator = { userId: EDITOR, role: "EDITOR" };
const viewer: Collaborator = { userId: VIEWER, role: "VIEWER" };

describe("Board", () => {
  describe("construction", () => {
    it("builds a valid board and exposes it through getters", () => {
      const board = makeBoard();

      expect(board.id).toBe("board-1");
      expect(board.ownerId).toBe(OWNER);
      expect(board.name).toBe("Roadmap");
      expect(board.collaborators).toEqual([]);
    });

    it("keeps the collaborators it was constructed with", () => {
      const board = makeBoard([editor, viewer]);

      expect(board.collaborators).toEqual([editor, viewer]);
    });

    it("rejects an empty name", () => {
      expect(
        () =>
          new Board({
            boardId: "b",
            ownerId: OWNER,
            name: "",
            collaborators: [],
          })
      ).toThrow("Board name can't be empty");
    });

    it("rejects a whitespace-only name", () => {
      expect(
        () =>
          new Board({
            boardId: "b",
            ownerId: OWNER,
            name: "   ",
            collaborators: [],
          })
      ).toThrow("Board name can't be empty");
    });

    it("rejects a missing owner id", () => {
      expect(
        () =>
          new Board({
            boardId: "b",
            ownerId: "  ",
            name: "Roadmap",
            collaborators: [],
          })
      ).toThrow("An owner id is required");
    });
  });

  describe("encapsulation", () => {
    it("returns a copy of the collaborator list, not the internal array", () => {
      const board = makeBoard([editor]);

      const snapshot = board.collaborators as Collaborator[];
      snapshot.push(viewer);

      expect(board.collaborators).toEqual([editor]);
    });
  });

  describe("rename", () => {
    it("updates the name", () => {
      const board = makeBoard();

      board.rename("Backlog");

      expect(board.name).toBe("Backlog");
    });

    it("rejects an empty name", () => {
      const board = makeBoard();

      expect(() => board.rename("")).toThrow("Board name can't be empty");
    });

    it("rejects a whitespace-only name", () => {
      const board = makeBoard();

      expect(() => board.rename("   ")).toThrow("Board name can't be empty");
    });
  });

  describe("addCollaborator", () => {
    it("lets the owner add a collaborator", () => {
      const board = makeBoard();

      board.addCollaborator(OWNER, editor);

      expect(board.collaborators).toEqual([editor]);
    });

    it("blocks anyone who is not the owner", () => {
      const board = makeBoard([editor]);

      expect(() => board.addCollaborator(EDITOR, viewer)).toThrow(
        "Only the owner can invite collaborators"
      );
    });

    it("refuses to add the owner as a collaborator", () => {
      const board = makeBoard();

      expect(() =>
        board.addCollaborator(OWNER, { userId: OWNER, role: "EDITOR" })
      ).toThrow("The owner cannot be added as a collaborator");
    });

    it("refuses to add someone already on the board", () => {
      const board = makeBoard([editor]);

      expect(() => board.addCollaborator(OWNER, editor)).toThrow(
        "Collaborator already exists"
      );
    });
  });

  describe("changeCollaboratorRole", () => {
    it("lets the owner change a collaborator's role", () => {
      const board = makeBoard([viewer]);

      board.changeCollaboratorRole(OWNER, VIEWER, "EDITOR");

      expect(board.getAccessLevel(VIEWER)).toBe("EDITOR");
    });

    it("blocks anyone who is not the owner", () => {
      const board = makeBoard([editor, viewer]);

      expect(() =>
        board.changeCollaboratorRole(EDITOR, VIEWER, "EDITOR")
      ).toThrow("Only the owner can change collaborators role");
    });

    it("throws when the collaborator does not exist", () => {
      const board = makeBoard();

      expect(() =>
        board.changeCollaboratorRole(OWNER, STRANGER, "EDITOR")
      ).toThrow("Collaborator not found");
    });
  });

  describe("removeCollaborator", () => {
    it("lets the owner remove a collaborator", () => {
      const board = makeBoard([editor, viewer]);

      board.removeCollaborator(OWNER, EDITOR);

      expect(board.collaborators).toEqual([viewer]);
    });

    it("blocks anyone who is not the owner", () => {
      const board = makeBoard([editor, viewer]);

      expect(() => board.removeCollaborator(VIEWER, EDITOR)).toThrow(
        "Only the owner can remove a collaborator"
      );
    });

    it("throws when the collaborator does not exist", () => {
      const board = makeBoard();

      expect(() => board.removeCollaborator(OWNER, STRANGER)).toThrow(
        "Collaborator not found"
      );
    });
  });

  describe("changeOwner", () => {
    it("lets the current owner hand ownership to someone else", () => {
      const board = makeBoard([editor]);

      board.changeOwner(OWNER, EDITOR);

      expect(board.ownerId).toBe(EDITOR);
      expect(board.getAccessLevel(EDITOR)).toBe("OWNER");
    });

    it("blocks anyone who is not the current owner", () => {
      const board = makeBoard([editor]);

      expect(() => board.changeOwner(EDITOR, STRANGER)).toThrow(
        "Only an owner can change ownership"
      );
    });
  });

  describe("getAccessLevel", () => {
    it("reports OWNER for the owner", () => {
      const board = makeBoard([editor, viewer]);

      expect(board.getAccessLevel(OWNER)).toBe("OWNER");
    });

    it("reports the collaborator's role", () => {
      const board = makeBoard([editor, viewer]);

      expect(board.getAccessLevel(EDITOR)).toBe("EDITOR");
      expect(board.getAccessLevel(VIEWER)).toBe("VIEWER");
    });

    it("reports null for someone with no access", () => {
      const board = makeBoard([editor]);

      expect(board.getAccessLevel(STRANGER)).toBeNull();
    });
  });

  describe("canModifyContent", () => {
    it("allows the owner", () => {
      const board = makeBoard();

      expect(board.canModifyContent(OWNER)).toBe(true);
    });

    it("allows an editor", () => {
      const board = makeBoard([editor]);

      expect(board.canModifyContent(EDITOR)).toBe(true);
    });

    it("denies a viewer", () => {
      const board = makeBoard([viewer]);

      expect(board.canModifyContent(VIEWER)).toBe(false);
    });

    it("denies someone with no access", () => {
      const board = makeBoard([editor]);

      expect(board.canModifyContent(STRANGER)).toBe(false);
    });
  });
});
