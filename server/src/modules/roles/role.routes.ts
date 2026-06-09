import { Router } from "express";
import { roleController } from "./role.controller.js";

export const roleRoutes = Router();

roleRoutes.get("/",                        roleController.list);
roleRoutes.post("/",                       roleController.create);
roleRoutes.get("/:id",                     roleController.getById);
roleRoutes.patch("/:id",                   roleController.update);
roleRoutes.get("/:id/permissions",         roleController.getPermissions);
roleRoutes.put("/:id/permissions",         roleController.setPermissions);
