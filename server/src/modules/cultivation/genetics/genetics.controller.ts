import type { Request, Response, NextFunction } from "express";
import { createGeneticsSchema, updateGeneticsSchema } from "./genetics.schema.js";
import { geneticsService } from "./genetics.service.js";

export const geneticsController = {
  async list(_req: Request, res: Response, next: NextFunction) {
    try {
      res.json(await geneticsService.list());
    } catch (error) {
      next(error);
    }
  },
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      res.status(201).json(await geneticsService.create(createGeneticsSchema.parse(req.body)));
    } catch (error) {
      next(error);
    }
  },
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      res.json(await geneticsService.getById(String(req.params.id)));
    } catch (error) {
      next(error);
    }
  },
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      res.json(await geneticsService.update(String(req.params.id), updateGeneticsSchema.parse(req.body)));
    } catch (error) {
      next(error);
    }
  },
};
