import type { RequestHandler } from "express";
import type { ZodType } from "zod";
import { ValidationError } from "@/errors/AppError.js";

export function validateBody(schema: ZodType): RequestHandler {
  return (req, _res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const message = result.error.issues.map((i) => i.message).join("; ");
      return next(new ValidationError(message));
    }
    req.body = result.data;
    next();
  };
}
