// Shared API contract types — the single source of truth for the shapes that
// cross the wire between client/ and server/. Both packages import from here,
// so the shape of a Task, Board, or Column can't silently drift between the
// frontend and the backend.

// The envelope every response is wrapped in, so the client always knows where
// to look: `data` on success, `message` (+ optional per-field `errors`) on
// failure.
export type ApiSuccess<T> = {
  status: "success";
  data: T;
};

export type ApiError = {
  status: "error";
  message: string;
  errors?: Record<string, string>;
};

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// Roles (kept in sync with the server's domain enums).
export type UserRole = "ADMIN" | "USER";
export type CollaboratorRole = "EDITOR" | "VIEWER";

// The wire shapes of each resource — what the server serializes and the client
// consumes. Deliberately flat and free of the domain's private fields.
export type UserDTO = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

export type CollaboratorDTO = {
  userId: string;
  role: CollaboratorRole;
};

export type BoardDTO = {
  id: string;
  ownerId: string;
  name: string;
  collaborators: CollaboratorDTO[];
};

// A person on a board, with the user info the UI needs to display them. The
// owner appears with role "OWNER".
export type BoardMemberDTO = {
  userId: string;
  name: string;
  email: string;
  role: "OWNER" | CollaboratorRole;
};

export type ColumnDTO = {
  id: string;
  boardId: string;
  name: string;
  position: number;
};

export type SubtaskDTO = {
  id: string;
  title: string;
  isCompleted: boolean;
};

export type TaskDTO = {
  id: string;
  columnId: string;
  title: string;
  description: string;
  position: number;
  assignedTo: string | null;
  subtasks: SubtaskDTO[];
};

// The whole board in one payload — board + its columns + all its tasks (flat).
// Lets the client render a board in a single request instead of one call per
// column, then hydrate the per-column task caches from it.
export type BoardContentsDTO = {
  board: BoardDTO;
  columns: ColumnDTO[];
  tasks: TaskDTO[];
};

export type ActivityType =
  | "TASK_CREATED"
  | "TASK_MOVED"
  | "TASK_UPDATED"
  | "TASK_DELETED"
  | "TASK_ASSIGNED"
  | "COLUMN_CREATED"
  | "COLUMN_RENAMED"
  | "COLUMN_DELETED"
  | "BOARD_RENAMED"
  | "MEMBER_INVITED"
  | "MEMBER_ROLE_CHANGED"
  | "MEMBER_REMOVED"
  | "COMMENT_ADDED";

export type CommentDTO = {
  id: string;
  taskId: string;
  authorId: string;
  body: string;
  createdAt: string;
};

export type ActivityDetails = Record<string, string | number | boolean | null>;

export type ActivityDTO = {
  id: string;
  boardId: string;
  actorId: string;
  type: ActivityType;
  details: ActivityDetails;
  createdAt: string;
};

export type NotificationDTO = {
  id: string;
  userId: string;
  actorId: string;
  type: ActivityType;
  boardId: string;
  details: ActivityDetails;
  read: boolean;
  createdAt: string;
};
