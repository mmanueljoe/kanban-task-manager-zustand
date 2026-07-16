import { Router } from "express";
import { authenticate } from "@/middlewares/authenticate.js";
import { validateBody } from "@/middlewares/validate.js";
import * as admin from "@/controllers/AdminController.js";

export const adminRoutes = Router();

// Authenticated; the admin check itself lives in the service (per the layering
// rule — permission decisions belong there, not in a route guard).
adminRoutes.use(authenticate);

adminRoutes.get("/users", admin.listUsers);
adminRoutes.patch(
  "/users/:userId/role",
  validateBody(admin.setRoleSchema),
  admin.setUserRole
);
