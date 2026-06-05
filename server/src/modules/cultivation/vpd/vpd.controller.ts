import type { Request, Response, NextFunction } from "express";
import { vpdPreviewSchema, vpdTableQuerySchema } from "./vpd.schema.js";
import { vpdService } from "./vpd.service.js";

export const vpdController = {
  preview(req: Request, res: Response, next: NextFunction) {
    try {
      res.json(vpdService.preview(vpdPreviewSchema.parse(req.body)));
    } catch (error) {
      next(error);
    }
  },
  table(req: Request, res: Response, next: NextFunction) {
    try {
      res.json(vpdService.table(vpdTableQuerySchema.parse(req.query)));
    } catch (error) {
      next(error);
    }
  },
};
