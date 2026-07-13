import type { RequestHandler } from "express";
import { verifyAuthToken } from "@/utils/jwt.js";
import { AUTH_COOKIE } from "@/config/cookies.js";
import { NotAuthenticatedError } from "@/errors/AppError.js";

export const authenticate: RequestHandler = async (req, _res, next) => {
  const token = req.cookies?.[AUTH_COOKIE];
  if (!token) {
    return next(new NotAuthenticatedError("Authentication required"));
  }

  try {
    req.userId = await verifyAuthToken(token);
    next();
  } catch {
    next(new NotAuthenticatedError("Invalid or expired session"));
  }
};
