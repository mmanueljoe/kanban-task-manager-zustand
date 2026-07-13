import { randomUUID } from "node:crypto";
import { Comment } from "@/domain/Comment.js";
import type { Board } from "@/domain/Board.js";
import type { Task } from "@/domain/Task.js";
import { CommentRepository } from "@/repositories/CommentRepository.js";
import { TaskRepository } from "@/repositories/TaskRepository.js";
import { ColumnRepository } from "@/repositories/ColumnRepository.js";
import { BoardRepository } from "@/repositories/BoardRepository.js";
import { NotAuthorizedError, NotFoundError } from "@/errors/AppError.js";
import { eventBus, type EventPublisher } from "@/events/eventBus.js";

export class CommentService {
  constructor(
    private readonly comments: CommentRepository = new CommentRepository(),
    private readonly tasks: TaskRepository = new TaskRepository(),
    private readonly columns: ColumnRepository = new ColumnRepository(),
    private readonly boards: BoardRepository = new BoardRepository(),
    private readonly events: EventPublisher = eventBus
  ) {}

  async addComment(
    userId: string,
    taskId: string,
    body: string
  ): Promise<Comment> {
    const { task, board } = await this.requireTaskAccess(userId, taskId);
    const comment = new Comment({
      id: randomUUID(),
      taskId,
      authorId: userId,
      body,
    });
    const created = await this.comments.create(comment);

    await this.events.publish({
      type: "COMMENT_ADDED",
      boardId: board.id,
      actorId: userId,
      // Notify the task's assignee (if any); the listener ignores self-comments.
      targetUserId: task.assignedToId ?? undefined,
      details: { taskTitle: task.title },
    });
    return created;
  }

  async listComments(userId: string, taskId: string): Promise<Comment[]> {
    await this.requireTaskAccess(userId, taskId);
    return this.comments.findByTaskId(taskId);
  }

  async deleteComment(userId: string, commentId: string): Promise<void> {
    const comment = await this.comments.findById(commentId);
    if (!comment) {
      throw new NotFoundError("Comment not found");
    }
    const { board } = await this.requireTaskAccess(userId, comment.taskId);
    const isAuthor = comment.authorId === userId;
    const isOwner = board.getAccessLevel(userId) === "OWNER";
    if (!isAuthor && !isOwner) {
      throw new NotAuthorizedError("You can only delete your own comments");
    }
    await this.comments.delete(commentId);
  }

  // Comments are discussion, open to any board member (viewers included). The
  // walk task → column → board is how we reach the access check.
  private async requireTaskAccess(
    userId: string,
    taskId: string
  ): Promise<{ task: Task; board: Board }> {
    const task = await this.tasks.findById(taskId);
    if (!task) {
      throw new NotFoundError("Task not found");
    }
    const column = await this.columns.findById(task.columnId);
    if (!column) {
      throw new NotFoundError("Column not found");
    }
    const board = await this.boards.findById(column.boardId);
    if (!board) {
      throw new NotFoundError("Board not found");
    }
    if (board.getAccessLevel(userId) === null) {
      throw new NotAuthorizedError("You don't have access to this board");
    }
    return { task, board };
  }
}
