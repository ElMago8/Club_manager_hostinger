import type { Request, Response, NextFunction } from "express";
import { createMotherSchema, updateMotherSchema, updateMotherStatusSchema } from "./mother.schema.js";
import { motherService } from "./mother.service.js";

export const motherController = {
  async list(_req: Request, res: Response, next: NextFunction) {
    try {
      res.json(await motherService.list());
    } catch (error) {
      next(error);
    }
  },
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      res.status(201).json(await motherService.create(createMotherSchema.parse(req.body)));
    } catch (error) {
      next(error);
    }
  },
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      res.json(await motherService.getById(String(req.params.id)));
    } catch (error) {
      next(error);
    }
  },
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      res.json(await motherService.update(String(req.params.id), updateMotherSchema.parse(req.body)));
    } catch (error) {
      next(error);
    }
  },
  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      res.json(await motherService.updateStatus(String(req.params.id), updateMotherStatusSchema.parse(req.body)));
    } catch (error) {
      next(error);
    }
  },
};
