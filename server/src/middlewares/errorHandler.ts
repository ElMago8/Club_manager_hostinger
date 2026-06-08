import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { ApiError } from "../utils/ApiError.js";

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof ApiError) {
    return res.status(error.statusCode).json({
      error: error.message,
      details: error.details,
    });
  }

  if (error instanceof ZodError) {
    return res.status(400).json({
      error: "Validation error",
      details: error.flatten(),
    });
  }

  if (typeof error === "object" && error !== null && "code" in error) {
    const prismaError = error as { code?: string; meta?: unknown };
    if (prismaError.code === "P2002") {
      return res.status(409).json({ error: "Unique constraint violation", details: prismaError.meta });
    }
    if (prismaError.code === "P2025") {
      return res.status(404).json({ error: "Record not found" });
    }
    if (prismaError.code === "P2003") {
      return res.status(409).json({
        error: "No se puede eliminar el registro porque tiene datos relacionados. Borra o reasigna esos datos antes de eliminarlo.",
        details: prismaError.meta,
      });
    }
  }

  console.error(error);
  return res.status(500).json({ error: "Internal server error" });
};
