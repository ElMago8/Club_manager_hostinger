import type { Request, Response, NextFunction } from "express";
import { userService } from "./user.service.js";
import { createUserSchema, updateUserSchema } from "./user.schema.js";

export const userController = {
  async list(_req: Request, res: Response, next: NextFunction) {
    try {
      res.json(await userService.list());
    } catch (error) { next(error); }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      res.json(await userService.getById(Number(req.params.id)));
    } catch (error) { next(error); }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      res.status(201).json(await userService.create(createUserSchema.parse(req.body)));
    } catch (error) { next(error); }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      res.json(await userService.update(Number(req.params.id), updateUserSchema.parse(req.body)));
    } catch (error) { next(error); }
  },

  async deactivate(req: Request, res: Response, next: NextFunction) {
    try {
      res.json(await userService.deactivate(Number(req.params.id)));
    } catch (error) { next(error); }
  },
};
