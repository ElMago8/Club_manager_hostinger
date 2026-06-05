import { Router } from "express";
import { calendarController } from "./calendar.controller.js";

export const calendarRoutes = Router();

calendarRoutes.get("/", calendarController.list);
calendarRoutes.post("/", calendarController.create);
calendarRoutes.get("/:id", calendarController.getById);
calendarRoutes.put("/:id", calendarController.update);
calendarRoutes.patch("/:id/status", calendarController.updateStatus);
calendarRoutes.patch("/:id/complete", calendarController.complete);
calendarRoutes.delete("/:id", calendarController.delete);
