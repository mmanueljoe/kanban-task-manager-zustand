import type { Server as HttpServer } from "node:http";
import { Server, type Socket } from "socket.io";
import { env } from "@/config/env.js";
import { logger } from "@/config/logger.js";
import { AUTH_COOKIE } from "@/config/cookies.js";
import { verifyAuthToken } from "@/utils/jwt.js";
import { eventBus } from "@/events/eventBus.js";
import { BoardService } from "@/services/BoardService.js";
import { NotAuthenticatedError } from "@/errors/AppError.js";
import { readCookie } from "@/utils/readCookie.js";

export function createSocketServer(httpServer: HttpServer): Server {
  const io = new Server(httpServer, {
    cors: { origin: env.clientOrigin, credentials: true },
  });
  const boards = new BoardService();

  // Handshake auth reuses the same JWT cookie the REST API uses — no separate
  // token scheme. A socket that can't prove who it is never connects.
  io.use(async (socket, next) => {
    try {
      const token = readCookie(socket.handshake.headers.cookie, AUTH_COOKIE);
      if (!token) return next(new NotAuthenticatedError("Not authenticated"));
      socket.data.userId = await verifyAuthToken(token);
      next();
    } catch {
      next(new NotAuthenticatedError("Not authenticated"));
    }
  });

  io.on("connection", (socket: Socket) => {
    const userId = socket.data.userId as string;
    // Personal room, so notifications can reach this user on any board.
    socket.join(`user:${userId}`);

    // A client asks to follow a board; we only let it in if it has access.
    socket.on("subscribe", async (boardId: string) => {
      try {
        await boards.getBoard(userId, boardId);
        socket.join(`board:${boardId}`);
      } catch {
        // No access — silently don't join.
      }
    });
    socket.on("unsubscribe", (boardId: string) => {
      socket.leave(`board:${boardId}`);
    });
  });

  // The realtime broadcaster: a fourth bus listener. It pushes every event to
  // the board's room, and notification-bearing events to the target's room.
  eventBus.subscribe((event) => {
    io.to(`board:${event.boardId}`).emit("board:event", event);
    if (event.targetUserId && event.targetUserId !== event.actorId) {
      io.to(`user:${event.targetUserId}`).emit("notification", event);
    }
  });

  logger.info("Socket.IO server attached");
  return io;
}
