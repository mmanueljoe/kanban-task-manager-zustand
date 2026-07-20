import type { RequestHandler } from "express";
import { z } from "zod";
import { ColumnService } from "@/services/ColumnService.js";
import { requireUserId } from "@/utils/requireUserId.js";
import { serializeColumn } from "@/utils/serialize.js";
import { success } from "@/utils/apiResponse.js";

export const createColumnSchema = z.object({
  name: z.string().min(1, "Column name is required"),
});

export const renameColumnSchema = z.object({
  name: z.string().min(1, "Column name is required"),
});

// `position` is a placement *locator*, not a stored value (see the note on
// moveTaskSchema in TaskController). The service turns this finite number into a
// real integer slot, so storage stays Int regardless of what the client sends.
export const reorderColumnSchema = z.object({
  position: z.number().finite(),
});

export class ColumnController {
  constructor(private readonly columns: ColumnService) {}

  addColumn: RequestHandler = async (req, res) => {
    const { boardId } = req.params as { boardId: string };
    const column = await this.columns.addColumn(
      requireUserId(req),
      boardId,
      req.body.name
    );
    res.status(201).json(success(serializeColumn(column)));
  };

  listColumns: RequestHandler = async (req, res) => {
    const { boardId } = req.params as { boardId: string };
    const columns = await this.columns.listColumns(requireUserId(req), boardId);
    res.status(200).json(success(columns.map(serializeColumn)));
  };

  renameColumn: RequestHandler = async (req, res) => {
    const { columnId } = req.params as { columnId: string };
    const column = await this.columns.renameColumn(
      requireUserId(req),
      columnId,
      req.body.name
    );
    res.status(200).json(success(serializeColumn(column)));
  };

  deleteColumn: RequestHandler = async (req, res) => {
    const { columnId } = req.params as { columnId: string };
    await this.columns.deleteColumn(requireUserId(req), columnId);
    res.status(200).json(success(null));
  };

  reorderColumn: RequestHandler = async (req, res) => {
    const { columnId } = req.params as { columnId: string };
    const column = await this.columns.reorderColumn(
      requireUserId(req),
      columnId,
      req.body.position
    );
    res.status(200).json(success(serializeColumn(column)));
  };
}
