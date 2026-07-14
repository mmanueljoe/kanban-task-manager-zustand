import type {
  BoardDTO,
  ColumnDTO,
  TaskDTO,
  ActivityDTO,
  CommentDTO,
  NotificationDTO,
} from "@kanban/shared";
import type { Board } from "@/domain/Board.js";
import type { Column } from "@/domain/Column.js";
import type { Task } from "@/domain/Task.js";
import type { Activity } from "@/domain/Activity.js";
import type { Comment } from "@/domain/Comment.js";
import type { Notification } from "@/domain/Notification.js";

// Entity → wire DTO, at the edge. Domain objects have private fields and
// methods; JSON.stringify would leak the `_`-prefixed internals. These map
// through the public getters into the flat shapes @kanban/shared defines.
export function serializeBoard(board: Board): BoardDTO {
  return {
    id: board.id,
    ownerId: board.ownerId,
    name: board.name,
    collaborators: board.collaborators.map((c) => ({
      userId: c.userId,
      role: c.role,
    })),
  };
}

export function serializeColumn(column: Column): ColumnDTO {
  return {
    id: column.id,
    boardId: column.boardId,
    name: column.name,
    position: column.position,
  };
}

export function serializeComment(comment: Comment): CommentDTO {
  return {
    id: comment.id,
    taskId: comment.taskId,
    authorId: comment.authorId,
    body: comment.body,
    createdAt: comment.createdAt.toISOString(),
  };
}

export function serializeNotification(
  notification: Notification
): NotificationDTO {
  return {
    id: notification.id,
    userId: notification.userId,
    actorId: notification.actorId,
    type: notification.type,
    boardId: notification.boardId,
    details: notification.details,
    read: notification.read,
    createdAt: notification.createdAt.toISOString(),
  };
}

export function serializeActivity(activity: Activity): ActivityDTO {
  return {
    id: activity.id,
    boardId: activity.boardId,
    actorId: activity.actorId,
    type: activity.type,
    details: activity.details,
    createdAt: activity.createdAt.toISOString(),
  };
}

export function serializeTask(task: Task): TaskDTO {
  return {
    id: task.id,
    columnId: task.columnId,
    title: task.title,
    description: task.description,
    position: task.position,
    assignedTo: task.assignedToId,
    subtasks: task.subtasks.map((s) => ({
      id: s.id,
      title: s.title,
      isCompleted: s.isCompleted,
    })),
  };
}
