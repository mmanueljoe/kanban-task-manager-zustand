import { Router } from "express";
import { validateBody } from "@/middlewares/validate.js";
import { authenticate } from "@/middlewares/authenticate.js";
import { registerSchema, loginSchema } from "@/controllers/AuthController.js";
import { authController } from "@/composition.js";

export const authRoutes = Router();

authRoutes.post(
  "/register",
  validateBody(registerSchema),
  authController.register
);
authRoutes.post("/login", validateBody(loginSchema), authController.login);
authRoutes.post("/logout", authController.logout);
authRoutes.get("/me", authenticate, authController.me);
