import type { ApiResponse } from "@kanban/shared";

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001/api";

// A failed request, carrying the server's message and (for validation) the
// per-field errors so forms can highlight individual inputs.
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly fieldErrors?: Record<string, string>
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// One place that talks to the API. credentials:"include" sends the auth cookie;
// it unwraps the { status, data } envelope and throws ApiError on failure, so
// callers (and TanStack Query) only ever deal with the data or a thrown error.
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...options.headers },
  });

  const body = (await res.json()) as ApiResponse<T>;
  if (body.status === "error") {
    throw new ApiError(body.message, res.status, body.errors);
  }
  return body.data;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, data?: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(data ?? {}) }),
  patch: <T>(path: string, data?: unknown) =>
    request<T>(path, { method: "PATCH", body: JSON.stringify(data ?? {}) }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
