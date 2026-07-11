import { describe, it, expect, vi } from "vitest";
import { BoardService } from "@/services/BoardService.js";
import { BoardRepository } from "@/repositories/BoardRepository.js";
import { UserRepository } from "@/repositories/UserRepository.js";
import { Board } from "@/domain/Board.js";
import { User } from "@/domain/User.js";
import {
  ConflictError,
  NotAuthorizedError,
  NotFoundError,
} from "@/errors/AppError.js";

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

// A fake repository whose findById returns a real Board by default, so the
// service's access checks (getAccessLevel/canModifyContent) run for real.
function fakeRepo(overrides: Partial<BoardRepository> = {}): BoardRepository {
  return {
    findById: vi.fn().mockResolvedValue(makeBoard()),
    create: vi.fn().mockImplementation(async (b: Board) => b),
    update: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(undefined),
    findAccessibleByUserId: vi.fn().mockResolvedValue([]),
    addCollaborator: vi.fn().mockResolvedValue(undefined),
    updateCollaboratorRole: vi.fn().mockResolvedValue(undefined),
    removeCollaborator: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  } as unknown as BoardRepository;
}

function makeUser(id: string, email: string): User {
  return new User({ id, name: id, email, passwordHash: "hash" });
}

function fakeUsers(overrides: Partial<UserRepository> = {}): UserRepository {
  return {
    findByEmail: vi.fn().mockResolvedValue(null),
    findById: vi.fn().mockResolvedValue(null),
    findByIds: vi.fn().mockResolvedValue([]),
    ...overrides,
  } as unknown as UserRepository;
}

describe("BoardService", () => {
  describe("createBoard", () => {
    it("makes the creator the owner and persists it", async () => {
      const repo = fakeRepo();
      const board = await new BoardService(repo).createBoard(
        OWNER,
        "New board"
      );

      expect(repo.create).toHaveBeenCalledTimes(1);
      expect(board.ownerId).toBe(OWNER);
      expect(board.name).toBe("New board");
    });
  });

  describe("getBoard", () => {
    it("lets the owner read it", async () => {
      const board = await new BoardService(fakeRepo()).getBoard(
        OWNER,
        "board-1"
      );
      expect(board.id).toBe("board-1");
    });

    it("lets a collaborator (viewer) read it", async () => {
      const board = await new BoardService(fakeRepo()).getBoard(
        VIEWER,
        "board-1"
      );
      expect(board.id).toBe("board-1");
    });

    it("denies a stranger", async () => {
      await expect(
        new BoardService(fakeRepo()).getBoard(STRANGER, "board-1")
      ).rejects.toBeInstanceOf(NotAuthorizedError);
    });

    it("throws NotFound when the board is missing", async () => {
      const repo = fakeRepo({ findById: vi.fn().mockResolvedValue(null) });
      await expect(
        new BoardService(repo).getBoard(OWNER, "board-1")
      ).rejects.toBeInstanceOf(NotFoundError);
    });
  });

  describe("renameBoard", () => {
    it("lets an editor rename and persists it", async () => {
      const repo = fakeRepo();
      const board = await new BoardService(repo).renameBoard(
        EDITOR,
        "board-1",
        "Renamed"
      );

      expect(board.name).toBe("Renamed");
      expect(repo.update).toHaveBeenCalledTimes(1);
    });

    it("denies a viewer and never persists", async () => {
      const repo = fakeRepo();
      await expect(
        new BoardService(repo).renameBoard(VIEWER, "board-1", "Nope")
      ).rejects.toBeInstanceOf(NotAuthorizedError);
      expect(repo.update).not.toHaveBeenCalled();
    });
  });

  describe("deleteBoard", () => {
    it("lets the owner delete", async () => {
      const repo = fakeRepo();
      await new BoardService(repo).deleteBoard(OWNER, "board-1");
      expect(repo.delete).toHaveBeenCalledWith("board-1");
    });

    it("denies an editor (owner-only) and never deletes", async () => {
      const repo = fakeRepo();
      await expect(
        new BoardService(repo).deleteBoard(EDITOR, "board-1")
      ).rejects.toBeInstanceOf(NotAuthorizedError);
      expect(repo.delete).not.toHaveBeenCalled();
    });
  });

  describe("inviteCollaborator", () => {
    it("resolves the email and persists the collaborator row", async () => {
      const repo = fakeRepo();
      const users = fakeUsers({
        findByEmail: vi
          .fn()
          .mockResolvedValue(makeUser("new-user", "new@example.com")),
      });
      await new BoardService(repo, users).inviteCollaborator(
        OWNER,
        "board-1",
        "new@example.com",
        "EDITOR"
      );
      expect(repo.addCollaborator).toHaveBeenCalledWith("board-1", {
        userId: "new-user",
        role: "EDITOR",
      });
    });

    it("throws NotFound when no user has that email", async () => {
      const repo = fakeRepo();
      await expect(
        new BoardService(repo, fakeUsers()).inviteCollaborator(
          OWNER,
          "board-1",
          "ghost@example.com",
          "EDITOR"
        )
      ).rejects.toBeInstanceOf(NotFoundError);
    });

    it("denies a non-owner (403, not 500) and never persists", async () => {
      const repo = fakeRepo();
      await expect(
        new BoardService(repo, fakeUsers()).inviteCollaborator(
          EDITOR,
          "board-1",
          "new@example.com",
          "EDITOR"
        )
      ).rejects.toBeInstanceOf(NotAuthorizedError);
      expect(repo.addCollaborator).not.toHaveBeenCalled();
    });

    it("rejects an email that's already a collaborator with a conflict", async () => {
      const repo = fakeRepo();
      const users = fakeUsers({
        findByEmail: vi
          .fn()
          .mockResolvedValue(makeUser(EDITOR, "editor@example.com")),
      });
      await expect(
        new BoardService(repo, users).inviteCollaborator(
          OWNER,
          "board-1",
          "editor@example.com",
          "VIEWER"
        )
      ).rejects.toBeInstanceOf(ConflictError);
    });
  });

  describe("changeCollaboratorRole", () => {
    it("throws NotFound for a user who isn't a collaborator", async () => {
      const repo = fakeRepo();
      await expect(
        new BoardService(repo).changeCollaboratorRole(
          OWNER,
          "board-1",
          STRANGER,
          "EDITOR"
        )
      ).rejects.toBeInstanceOf(NotFoundError);
    });

    it("denies a non-owner", async () => {
      const repo = fakeRepo();
      await expect(
        new BoardService(repo).changeCollaboratorRole(
          EDITOR,
          "board-1",
          VIEWER,
          "EDITOR"
        )
      ).rejects.toBeInstanceOf(NotAuthorizedError);
    });
  });

  describe("listMyBoards", () => {
    it("delegates to the accessible-boards query", async () => {
      const repo = fakeRepo();
      await new BoardService(repo).listMyBoards(OWNER);
      expect(repo.findAccessibleByUserId).toHaveBeenCalledWith(OWNER);
    });
  });
});
