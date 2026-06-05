import { Router } from "express";
import { motherController } from "./mother.controller.js";

export const motherRoutes = Router();

motherRoutes.get("/", motherController.list);
motherRoutes.post("/", motherController.create);
motherRoutes.get("/:id", motherController.getById);
motherRoutes.put("/:id", motherController.update);
motherRoutes.patch("/:id/status", motherController.updateStatus);
