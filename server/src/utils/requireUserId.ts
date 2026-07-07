import type { Request } from "express";
import { NotAuthorizedError } from "@/errors/AppError.js";

// The authenticate middleware sets req.userId, but its type is optional. This
// narrows it to a string for controllers (and guards the case where a route was
// mistakenly mounted without authenticate).
export function requireUserId(req: Request): string {
  if (!req.userId) {
    throw new NotAuthorizedError("Authentication required");
  }
  return req.userId;
}
