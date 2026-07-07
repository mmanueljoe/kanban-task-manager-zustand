// Shared API contract types — the single source of truth for the shapes that
// cross the wire between client/ and server/. Both packages import from here,
// so the shape of a Task, Board, or Column can't silently drift between the
// frontend and the backend. Define those types here as the API takes shape.

// The envelope every response is wrapped in, so the client always knows where
// to look: `data` on success, `message` on failure.
export type ApiSuccess<T> = {
  status: "success";
  data: T;
};

export type ApiError = {
  status: "error";
  message: string;
};

export type ApiResponse<T> = ApiSuccess<T> | ApiError;
