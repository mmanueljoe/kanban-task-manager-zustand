import type { RequestHandler } from "express";
import { z } from "zod";
import { UserService } from "@/services/UserService.js";
import { requireUserId } from "@/utils/requireUserId.js";
import { success } from "@/utils/apiResponse.js";

const userService = new UserService();

export const setRoleSchema = z.object({
  role: z.enum(["ADMIN", "USER"]),
});

export const listUsers: RequestHandler = async (req, res) => {
  const users = await userService.listAllUsers(requireUserId(req));
  res.status(200).json(success(users.map((u) => u.toPublicProfile())));
};

export const setUserRole: RequestHandler = async (req, res) => {
  const { userId } = req.params as { userId: string };
  const user = await userService.setUserRole(
    requireUserId(req),
    userId,
    req.body.role
  );
  res.status(200).json(success(user.toPublicProfile()));
};
