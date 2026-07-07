import type { ApiSuccess, ApiError } from "@kanban/shared";

export function success<T>(data: T): ApiSuccess<T> {
  return { status: "success", data };
}

export function failure(
  message: string,
  errors?: Record<string, string>
): ApiError {
  return errors
    ? { status: "error", message, errors }
    : { status: "error", message };
}
