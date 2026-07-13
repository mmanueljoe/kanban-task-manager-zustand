import { Router } from "express";
import { authenticate } from "@/middlewares/authenticate.js";
import * as comment from "@/controllers/CommentController.js";

export const commentRoutes = Router();

commentRoutes.use(authenticate);

commentRoutes.delete("/:commentId", comment.deleteComment);
