import { Router } from "express";
import { authenticate } from "@/middlewares/authenticate.js";
import { commentController } from "@/composition.js";

export const commentRoutes = Router();

commentRoutes.use(authenticate);

commentRoutes.delete("/:commentId", commentController.deleteComment);
