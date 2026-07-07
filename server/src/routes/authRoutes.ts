import { Router } from "express";
import { validateBody } from "@/middlewares/validate.js";
import { authenticate } from "@/middlewares/authenticate.js";
import {
  register,
  login,
  logout,
  me,
  registerSchema,
  loginSchema,
} from "@/controllers/AuthController.js";

export const authRoutes = Router();

authRoutes.post("/register", validateBody(registerSchema), register);
authRoutes.post("/login", validateBody(loginSchema), login);
authRoutes.post("/logout", logout);
authRoutes.get("/me", authenticate, me);
