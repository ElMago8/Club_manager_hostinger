import type { Request, Response, NextFunction } from "express";
import { createEnvironmentalLogSchema, environmentalFiltersSchema } from "./environmental.schema.js";
import { environmentalService } from "./environmental.service.js";

export const environmentalController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      res.json(await environmentalService.list(environmentalFiltersSchema.parse(req.query)));
    } catch (error) {
      next(error);
    }
  },
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      res.status(201).json(await environmentalService.create(createEnvironmentalLogSchema.parse(req.body)));
    } catch (error) {
      next(error);
    }
  },
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      res.json(await environmentalService.getById(String(req.params.id)));
    } catch (error) {
      next(error);
    }
  },
};
