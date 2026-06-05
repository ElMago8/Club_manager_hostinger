import type { Request, Response, NextFunction } from "express";
import { createMeasurementSchema, measurementFiltersSchema, updateMeasurementSchema } from "./measurement.schema.js";
import { measurementService } from "./measurement.service.js";

export const measurementController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      res.json(await measurementService.list(measurementFiltersSchema.parse(req.query)));
    } catch (error) {
      next(error);
    }
  },

  async summary(req: Request, res: Response, next: NextFunction) {
    try {
      res.json(await measurementService.summary(measurementFiltersSchema.parse(req.query)));
    } catch (error) {
      next(error);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      res.status(201).json(await measurementService.create(createMeasurementSchema.parse(req.body)));
    } catch (error) {
      next(error);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      res.json(await measurementService.getById(String(req.params.id)));
    } catch (error) {
      next(error);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      res.json(await measurementService.update(String(req.params.id), updateMeasurementSchema.parse(req.body)));
    } catch (error) {
      next(error);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      res.json(await measurementService.delete(String(req.params.id)));
    } catch (error) {
      next(error);
    }
  },
};
