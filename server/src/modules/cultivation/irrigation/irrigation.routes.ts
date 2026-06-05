import { Router } from "express";
import { irrigationController } from "./irrigation.controller.js";

export const irrigationRoutes = Router();

irrigationRoutes.get("/", irrigationController.list);
irrigationRoutes.post("/", irrigationController.create);
irrigationRoutes.get("/:id", irrigationController.getById);
