import { Router } from "express";
import { environmentalController } from "./environmental.controller.js";

export const environmentalRoutes = Router();

environmentalRoutes.get("/", environmentalController.list);
environmentalRoutes.post("/", environmentalController.create);
environmentalRoutes.get("/:id", environmentalController.getById);
