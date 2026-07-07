import type { RequestHandler } from "express";
import { z } from "zod";
import { ColumnService } from "@/services/ColumnService.js";
import { requireUserId } from "@/utils/requireUserId.js";
import { serializeColumn } from "@/utils/serialize.js";
import { success } from "@/utils/apiResponse.js";

const columnService = new ColumnService();

export const createColumnSchema = z.object({
  name: z.string().min(1, "Column name is required"),
});

export const renameColumnSchema = z.object({
  name: z.string().min(1, "Column name is required"),
});

export const reorderColumnSchema = z.object({
  position: z.number(),
});

export const addColumn: RequestHandler = async (req, res) => {
  const { boardId } = req.params as { boardId: string };
  const column = await columnService.addColumn(
    requireUserId(req),
    boardId,
    req.body.name
  );
  res.status(201).json(success(serializeColumn(column)));
};

export const listColumns: RequestHandler = async (req, res) => {
  const { boardId } = req.params as { boardId: string };
  const columns = await columnService.listColumns(requireUserId(req), boardId);
  res.status(200).json(success(columns.map(serializeColumn)));
};

export const renameColumn: RequestHandler = async (req, res) => {
  const { columnId } = req.params as { columnId: string };
  const column = await columnService.renameColumn(
    requireUserId(req),
    columnId,
    req.body.name
  );
  res.status(200).json(success(serializeColumn(column)));
};

export const deleteColumn: RequestHandler = async (req, res) => {
  const { columnId } = req.params as { columnId: string };
  await columnService.deleteColumn(requireUserId(req), columnId);
  res.status(200).json(success(null));
};

export const reorderColumn: RequestHandler = async (req, res) => {
  const { columnId } = req.params as { columnId: string };
  const column = await columnService.reorderColumn(
    requireUserId(req),
    columnId,
    req.body.position
  );
  res.status(200).json(success(serializeColumn(column)));
};
