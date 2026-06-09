import type { Request, Response, NextFunction } from "express";
import { roleService } from "./role.service.js";
import { createRoleSchema, setRolePermissionsSchema, updateRoleSchema } from "./role.schema.js";

export const roleController = {
  async list(_req: Request, res: Response, next: NextFunction) {
    try {
      res.json(await roleService.list());
    } catch (error) { next(error); }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      res.json(await roleService.getById(Number(req.params.id)));
    } catch (error) { next(error); }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      res.status(201).json(await roleService.create(createRoleSchema.parse(req.body)));
    } catch (error) { next(error); }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      res.json(await roleService.update(Number(req.params.id), updateRoleSchema.parse(req.body)));
    } catch (error) { next(error); }
  },

  async getPermissions(req: Request, res: Response, next: NextFunction) {
    try {
      res.json(await roleService.getPermissions(Number(req.params.id)));
    } catch (error) { next(error); }
  },

  async setPermissions(req: Request, res: Response, next: NextFunction) {
    try {
      const { permissionIds } = setRolePermissionsSchema.parse(req.body);
      res.json(await roleService.setPermissions(Number(req.params.id), permissionIds));
    } catch (error) { next(error); }
  },

  async listAllPermissions(_req: Request, res: Response, next: NextFunction) {
    try {
      res.json(await roleService.listAllPermissions());
    } catch (error) { next(error); }
  },
};
