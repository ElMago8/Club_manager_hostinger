import { Router } from "express";
import { plantController } from "./plant.controller.js";

export const plantRoutes = Router();

plantRoutes.get("/", plantController.list);
plantRoutes.post("/", plantController.create);
plantRoutes.post("/bulk", plantController.bulkCreate);
plantRoutes.get("/:id", plantController.getById);
plantRoutes.put("/:id", plantController.update);
plantRoutes.patch("/:id/stage", plantController.updateStage);
plantRoutes.patch("/:id/status", plantController.updateStatus);
