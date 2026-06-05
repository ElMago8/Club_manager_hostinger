import type { Request, Response, NextFunction } from "express";
import { createIrrigationLogSchema, irrigationFiltersSchema } from "./irrigation.schema.js";
import { irrigationService } from "./irrigation.service.js";

export const irrigationController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      res.json(await irrigationService.list(irrigationFiltersSchema.parse(req.query)));
    } catch (error) {
      next(error);
    }
  },
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      res.status(201).json(await irrigationService.create(createIrrigationLogSchema.parse(req.body)));
    } catch (error) {
      next(error);
    }
  },
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      res.json(await irrigationService.getById(String(req.params.id)));
    } catch (error) {
      next(error);
    }
  },
};
