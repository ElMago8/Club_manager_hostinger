import type { Request, Response, NextFunction } from "express";
import { calendarService } from "./calendar.service.js";
import {
  completeTaskSchema,
  createTaskSchema,
  taskFiltersSchema,
  updateTaskSchema,
  updateTaskStatusSchema,
} from "./calendar.schema.js";

export const calendarController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      res.json(await calendarService.list(taskFiltersSchema.parse(req.query)));
    } catch (error) {
      next(error);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      res.status(201).json(await calendarService.create(createTaskSchema.parse(req.body)));
    } catch (error) {
      next(error);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      res.json(await calendarService.getById(String(req.params.id)));
    } catch (error) {
      next(error);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      res.json(await calendarService.update(String(req.params.id), updateTaskSchema.parse(req.body)));
    } catch (error) {
      next(error);
    }
  },

  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      res.json(await calendarService.updateStatus(String(req.params.id), updateTaskStatusSchema.parse(req.body)));
    } catch (error) {
      next(error);
    }
  },

  async complete(req: Request, res: Response, next: NextFunction) {
    try {
      res.json(await calendarService.complete(String(req.params.id), completeTaskSchema.parse(req.body)));
    } catch (error) {
      next(error);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      res.json(await calendarService.cancel(String(req.params.id)));
    } catch (error) {
      next(error);
    }
  },
};
