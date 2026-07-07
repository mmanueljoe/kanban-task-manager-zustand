import type { ErrorRequestHandler } from "express";
import { AppError } from "@/errors/AppError.js";
import { failure } from "@/utils/apiResponse.js";
import { logger } from "@/config/logger.js";

// The single translation point (CLAUDE.md §5). Every error thrown anywhere in a
// route ends up here. If it's one of ours, it already knows its status; anything
// else is an unexpected bug → generic 500, logged in full but never leaked.
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json(failure(err.message));
    return;
  }

  logger.error({ err }, "Unexpected error");
  res.status(500).json(failure("Something went wrong"));
};
