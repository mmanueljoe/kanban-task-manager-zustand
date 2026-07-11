import type { ErrorRequestHandler } from "express";
import { AppError, ValidationError } from "@/errors/AppError.js";
import { failure } from "@/utils/apiResponse.js";
import { logger } from "@/config/logger.js";

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    const fieldErrors =
      err instanceof ValidationError ? err.fieldErrors : undefined;
    res.status(err.statusCode).json(failure(err.message, fieldErrors));
    return;
  }

  logger.error({ err }, "Unexpected error");
  res.status(500).json(failure("Something went wrong"));
};
