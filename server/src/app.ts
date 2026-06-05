import cors from "cors";
import express from "express";
import { env } from "./config/env.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import { bedRoutes } from "./modules/cultivation/beds/bed.routes.js";
import { environmentalRoutes } from "./modules/cultivation/environmental/environmental.routes.js";
import { geneticsRoutes } from "./modules/cultivation/genetics/genetics.routes.js";
import { irrigationRoutes } from "./modules/cultivation/irrigation/irrigation.routes.js";
import { measurementRoutes } from "./modules/cultivation/measurements/measurement.routes.js";
import { motherRoutes } from "./modules/cultivation/mothers/mother.routes.js";
import { calendarRoutes } from "./modules/cultivation/operational-calendar/calendar.routes.js";
import { plantRoutes } from "./modules/cultivation/plants/plant.routes.js";
import { vpdRoutes } from "./modules/cultivation/vpd/vpd.routes.js";

export const app = express();

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || env.frontendOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("CORS origin not allowed"));
    },
  }),
);
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "cannabis-club-manager-server" });
});

app.use("/api/cultivation/beds", bedRoutes);
app.use("/api/cultivation/plants", plantRoutes);
app.use("/api/cultivation/genetics", geneticsRoutes);
app.use("/api/cultivation/mothers", motherRoutes);
app.use("/api/cultivation/environmental-logs", environmentalRoutes);
app.use("/api/cultivation/irrigation-logs", irrigationRoutes);
app.use("/api/cultivation/measurements", measurementRoutes);
app.use("/api/cultivation/operational-tasks", calendarRoutes);
app.use("/api/cultivation/vpd", vpdRoutes);

app.use(errorHandler);
