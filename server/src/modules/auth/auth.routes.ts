import { Router } from "express";
import { authController } from "./auth.controller.js";

export const authRoutes = Router();

authRoutes.post("/login", authController.login);
