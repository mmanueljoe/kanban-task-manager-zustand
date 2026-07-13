import type { RequestHandler } from "express";
import { z } from "zod";
import { CommentService } from "@/services/CommentService.js";
import { requireUserId } from "@/utils/requireUserId.js";
import { serializeComment } from "@/utils/serialize.js";
import { success } from "@/utils/apiResponse.js";

const commentService = new CommentService();

export const addCommentSchema = z.object({
  body: z.string().min(1, "Comment can't be empty"),
});

export const addComment: RequestHandler = async (req, res) => {
  const { taskId } = req.params as { taskId: string };
  const comment = await commentService.addComment(
    requireUserId(req),
    taskId,
    req.body.body
  );
  res.status(201).json(success(serializeComment(comment)));
};

export const listComments: RequestHandler = async (req, res) => {
  const { taskId } = req.params as { taskId: string };
  const comments = await commentService.listComments(
    requireUserId(req),
    taskId
  );
  res.status(200).json(success(comments.map(serializeComment)));
};

export const deleteComment: RequestHandler = async (req, res) => {
  const { commentId } = req.params as { commentId: string };
  await commentService.deleteComment(requireUserId(req), commentId);
  res.status(200).json(success(null));
};
