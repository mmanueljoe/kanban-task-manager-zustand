import type { RequestHandler } from "express";
import type { ZodType } from "zod";
import { ValidationError } from "@/errors/AppError.js";

export function validateBody(schema: ZodType): RequestHandler {
  return (req, _res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        // "email", "subtasks.0.title", or "_" for a whole-body error.
        const key = issue.path.join(".") || "_";
        fieldErrors[key] ??= issue.message;
      }
      return next(new ValidationError("Validation failed", fieldErrors));
    }
    req.body = result.data;
    next();
  };
}
