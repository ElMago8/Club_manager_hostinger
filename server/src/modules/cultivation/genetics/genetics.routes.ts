import { Router } from "express";
import { geneticsController } from "./genetics.controller.js";

export const geneticsRoutes = Router();

geneticsRoutes.get("/", geneticsController.list);
geneticsRoutes.post("/", geneticsController.create);
geneticsRoutes.get("/:id", geneticsController.getById);
geneticsRoutes.put("/:id", geneticsController.update);
