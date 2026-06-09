import { Router } from "express";
import { userController } from "./user.controller.js";

export const userRoutes = Router();

userRoutes.get("/",      userController.list);
userRoutes.post("/",     userController.create);
userRoutes.get("/:id",   userController.getById);
userRoutes.patch("/:id", userController.update);
// DELETE es baja lógica (estado → inactivo), no borrado físico
userRoutes.delete("/:id", userController.deactivate);
