import type { Request, Response, NextFunction } from "express";
import { bulkCreatePlantsSchema, createPlantSchema, plantFiltersSchema, updatePlantSchema, updatePlantStageSchema, updatePlantStatusSchema } from "./plant.schema.js";
import { plantService } from "./plant.service.js";

export const plantController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      res.json(await plantService.list(plantFiltersSchema.parse(req.query)));
    } catch (error) {
      next(error);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      res.status(201).json(await plantService.create(createPlantSchema.parse(req.body)));
    } catch (error) {
      next(error);
    }
  },

  async bulkCreate(req: Request, res: Response, next: NextFunction) {
    try {
      res.status(201).json(await plantService.bulkCreate(bulkCreatePlantsSchema.parse(req.body)));
    } catch (error) {
      next(error);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      res.json(await plantService.getById(String(req.params.id)));
    } catch (error) {
      next(error);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      res.json(await plantService.update(String(req.params.id), updatePlantSchema.parse(req.body)));
    } catch (error) {
      next(error);
    }
  },

  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      res.json(await plantService.updateStatus(String(req.params.id), updatePlantStatusSchema.parse(req.body)));
    } catch (error) {
      next(error);
    }
  },

  async updateStage(req: Request, res: Response, next: NextFunction) {
    try {
      res.json(await plantService.updateStage(String(req.params.id), updatePlantStageSchema.parse(req.body)));
    } catch (error) {
      next(error);
    }
  },
};
