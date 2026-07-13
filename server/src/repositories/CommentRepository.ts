import { prisma } from "@/config/prisma.js";
import { Comment } from "@/domain/Comment.js";
import type { CommentModel } from "@/generated/prisma/models.js";

function toDomain(row: CommentModel): Comment {
  return new Comment({
    id: row.id,
    taskId: row.taskId,
    authorId: row.authorId,
    body: row.body,
    createdAt: row.createdAt,
  });
}

export class CommentRepository {
  async create(comment: Comment): Promise<Comment> {
    const row = await prisma.comment.create({
      data: {
        id: comment.id,
        taskId: comment.taskId,
        authorId: comment.authorId,
        body: comment.body,
        createdAt: comment.createdAt,
      },
    });
    return toDomain(row);
  }

  async findByTaskId(taskId: string): Promise<Comment[]> {
    const rows = await prisma.comment.findMany({
      where: { taskId },
      orderBy: { createdAt: "asc" },
    });
    return rows.map(toDomain);
  }

  async findById(id: string): Promise<Comment | null> {
    const row = await prisma.comment.findUnique({ where: { id } });
    return row ? toDomain(row) : null;
  }

  async delete(id: string): Promise<void> {
    await prisma.comment.delete({ where: { id } });
  }
}
