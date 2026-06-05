import { Router } from "express";
import { bedController } from "./bed.controller.js";

export const bedRoutes = Router();

bedRoutes.get("/", bedController.list);
bedRoutes.post("/", bedController.create);
bedRoutes.get("/:id/occupancy", bedController.getOccupancy);
bedRoutes.get("/:id", bedController.getById);
bedRoutes.put("/:id", bedController.update);
bedRoutes.patch("/:id/capacity", bedController.updateCapacity);
bedRoutes.patch("/:id/status", bedController.updateStatus);
