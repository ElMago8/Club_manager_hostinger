import type { Request, Response, NextFunction } from "express";
import { bedService } from "./bed.service.js";
import { createBedSchema, updateBedCapacitySchema, updateBedSchema, updateBedStatusSchema } from "./bed.schema.js";

export const bedController = {
  async list(_req: Request, res: Response, next: NextFunction) {
    try {
      res.json(await bedService.list());
    } catch (error) {
      next(error);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      res.status(201).json(await bedService.create(createBedSchema.parse(req.body)));
    } catch (error) {
      next(error);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      res.json(await bedService.getById(String(req.params.id)));
    } catch (error) {
      next(error);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      res.json(await bedService.update(String(req.params.id), updateBedSchema.parse(req.body)));
    } catch (error) {
      next(error);
    }
  },

  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      res.json(await bedService.updateStatus(String(req.params.id), updateBedStatusSchema.parse(req.body)));
    } catch (error) {
      next(error);
    }
  },

  async getOccupancy(req: Request, res: Response, next: NextFunction) {
    try {
      res.json(await bedService.getBedOccupancy(String(req.params.id)));
    } catch (error) {
      next(error);
    }
  },

  async updateCapacity(req: Request, res: Response, next: NextFunction) {
    try {
      res.json(await bedService.updateCapacity(String(req.params.id), updateBedCapacitySchema.parse(req.body)));
    } catch (error) {
      next(error);
    }
  },
};
