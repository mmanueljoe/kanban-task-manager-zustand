export class AppError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number
  ) {
    super(message);
    this.name = new.target.name;
  }
}

// 400 — the input was malformed or broke a rule. Optionally carries per-field
// messages so the client can highlight the exact inputs that failed.
export class ValidationError extends AppError {
  constructor(
    message: string,
    public readonly fieldErrors?: Record<string, string>
  ) {
    super(message, 400);
  }
}

// 401 — we don't know who you are: no credentials, or they're invalid/expired.
export class NotAuthenticatedError extends AppError {
  constructor(message = "Not authenticated") {
    super(message, 401);
  }
}

// 403 — you're known, but not allowed to do this.
export class NotAuthorizedError extends AppError {
  constructor(message = "Not authorized") {
    super(message, 403);
  }
}

// 404 — the thing you asked for doesn't exist.
export class NotFoundError extends AppError {
  constructor(message = "Not found") {
    super(message, 404);
  }
}

// 409 — conflicts with something that already exists (e.g. a taken email).
export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409);
  }
}
