import { Router } from "express";
import { vpdController } from "./vpd.controller.js";

export const vpdRoutes = Router();

vpdRoutes.post("/preview", vpdController.preview);
vpdRoutes.get("/table", vpdController.table);
