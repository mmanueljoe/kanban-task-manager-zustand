import { Router } from "express";
import { authenticate } from "@/middlewares/authenticate.js";
import { validateBody } from "@/middlewares/validate.js";
import { setRoleSchema } from "@/controllers/AdminController.js";
import { adminController } from "@/composition.js";

export const adminRoutes = Router();

// Authenticated; the admin check itself lives in the service (per the layering
// rule — permission decisions belong there, not in a route guard).
adminRoutes.use(authenticate);

adminRoutes.get("/users", adminController.listUsers);
adminRoutes.patch(
  "/users/:userId/role",
  validateBody(setRoleSchema),
  adminController.setUserRole
);
