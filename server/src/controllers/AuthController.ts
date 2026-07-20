import type { RequestHandler } from "express";
import { z } from "zod";
import { UserService } from "@/services/UserService.js";
import { signAuthToken } from "@/utils/jwt.js";
import { AUTH_COOKIE, authCookieOptions } from "@/config/cookies.js";
import { NotAuthenticatedError } from "@/errors/AppError.js";
import { success } from "@/utils/apiResponse.js";

export const registerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.email("A valid email is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const loginSchema = z.object({
  email: z.email("A valid email is required"),
  password: z.string().min(1, "Password is required"),
});

export class AuthController {
  constructor(private readonly users: UserService) {}

  register: RequestHandler = async (req, res) => {
    const user = await this.users.register(req.body);
    const token = await signAuthToken(user.id);
    res.cookie(AUTH_COOKIE, token, authCookieOptions);
    res.status(201).json(success(user.toPublicProfile()));
  };

  login: RequestHandler = async (req, res) => {
    const user = await this.users.login(req.body);
    const token = await signAuthToken(user.id);
    res.cookie(AUTH_COOKIE, token, authCookieOptions);
    res.status(200).json(success(user.toPublicProfile()));
  };

  logout: RequestHandler = (_req, res) => {
    res.clearCookie(AUTH_COOKIE, authCookieOptions);
    res.status(200).json(success(null));
  };

  me: RequestHandler = async (req, res) => {
    if (!req.userId) {
      throw new NotAuthenticatedError("Authentication required");
    }
    const user = await this.users.getById(req.userId);
    res.status(200).json(success(user.toPublicProfile()));
  };
}
