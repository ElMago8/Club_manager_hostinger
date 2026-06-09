import { Router } from "express";
import { roleController } from "./role.controller.js";

export const permissionRoutes = Router();

permissionRoutes.get("/", roleController.listAllPermissions);
