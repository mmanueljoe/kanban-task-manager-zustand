import type { CookieOptions } from "express";
import { env } from "@/config/env.js";

export const AUTH_COOKIE = "token";

export const authCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: env.isProduction,
  sameSite: env.isProduction ? "none" : "lax",
  maxAge: 24 * 60 * 60 * 1000, // 1 day — matches the JWT's expiry
  path: "/",
};
