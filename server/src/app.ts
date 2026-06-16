import path from "path";
import cors from "cors";
import express from "express";
import { env } from "./config/env.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import { cultivationRoutes } from "./modules/cultivation/cultivation.routes.js";
import { vpdRoutes } from "./modules/cultivation/vpd/vpd.routes.js";
import { memberRoutes, memberDocumentRoutes } from "./modules/members/member.routes.js";
import { userRoutes } from "./modules/users/user.routes.js";
import { roleRoutes } from "./modules/roles/role.routes.js";
import { permissionRoutes } from "./modules/roles/permission.routes.js";
import { authRoutes } from "./modules/auth/auth.routes.js";
import { billingRoutes } from "./modules/billing/billing.routes.js";
import { productsRoutes, stockLocationsRoutes, productBatchesRoutes } from "./modules/products/products.routes.js";

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
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "cannabis-club-manager-server" });
});

app.use("/api/cultivation", cultivationRoutes);
app.use("/api/cultivation/vpd", vpdRoutes);
app.use("/api/members", memberRoutes);
app.use("/api/member-documents", memberDocumentRoutes);
app.use("/api/users", userRoutes);
app.use("/api/roles", roleRoutes);
app.use("/api/permissions", permissionRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/billing", billingRoutes);
app.use("/api/products", productsRoutes);
app.use("/api/stock/locations", stockLocationsRoutes);
app.use("/api/product-batches", productBatchesRoutes);

app.use(errorHandler);
