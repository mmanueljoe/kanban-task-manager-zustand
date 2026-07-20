import type { RequestHandler } from "express";
import { z } from "zod";
import { CommentService } from "@/services/CommentService.js";
import { requireUserId } from "@/utils/requireUserId.js";
import { serializeComment } from "@/utils/serialize.js";
import { success } from "@/utils/apiResponse.js";

export const addCommentSchema = z.object({
  body: z.string().min(1, "Comment can't be empty"),
});

export class CommentController {
  constructor(private readonly comments: CommentService) {}

  addComment: RequestHandler = async (req, res) => {
    const { taskId } = req.params as { taskId: string };
    const comment = await this.comments.addComment(
      requireUserId(req),
      taskId,
      req.body.body
    );
    res.status(201).json(success(serializeComment(comment)));
  };

  listComments: RequestHandler = async (req, res) => {
    const { taskId } = req.params as { taskId: string };
    const comments = await this.comments.listComments(
      requireUserId(req),
      taskId
    );
    res.status(200).json(success(comments.map(serializeComment)));
  };

  deleteComment: RequestHandler = async (req, res) => {
    const { commentId } = req.params as { commentId: string };
    await this.comments.deleteComment(requireUserId(req), commentId);
    res.status(200).json(success(null));
  };
}
