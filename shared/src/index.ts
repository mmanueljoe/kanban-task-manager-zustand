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
  subtasks: SubtaskDTO[];
};
