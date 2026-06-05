import { Router } from "express";
import { measurementController } from "./measurement.controller.js";

export const measurementRoutes = Router();

measurementRoutes.get("/", measurementController.list);
measurementRoutes.get("/summary", measurementController.summary);
measurementRoutes.post("/", measurementController.create);
measurementRoutes.get("/:id", measurementController.getById);
measurementRoutes.put("/:id", measurementController.update);
measurementRoutes.delete("/:id", measurementController.delete);
