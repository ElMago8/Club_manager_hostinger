const express = require("express");
const cors = require("cors");
const { socios, cultivo, stock, facturacion, auditoria, dashboard } = require("./data/demoData.js");

const app = express();

const allowedOrigins = [
  "https://demo-ccm.programate.ar",
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:8080",
  "http://localhost:8081",
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("CORS origin not allowed"));
  },
}));

app.use(express.json());

app.get("/", (_req, res) => {
  res.json({ ok: true, service: "cannabis-club-manager-api", message: "CCM API running", version: "1.0.0-demo" });
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "cannabis-club-manager-api", timestamp: new Date().toISOString() });
});

app.get("/api/dashboard", (_req, res) => {
  res.json({ ok: true, data: dashboard });
});

app.get("/api/socios", (_req, res) => {
  res.json({ ok: true, total: socios.length, data: socios });
});

app.get("/api/socios/:id", (req, res) => {
  const socio = socios.find(s => s.id === Number(req.params.id));
  if (!socio) return res.status(404).json({ ok: false, message: "Socio no encontrado" });
  res.json({ ok: true, data: socio });
});

app.get("/api/cultivo", (_req, res) => {
  res.json({ ok: true, data: cultivo });
});

app.get("/api/cultivo/salas", (_req, res) => {
  res.json({ ok: true, total: cultivo.salas.length, data: cultivo.salas });
});

app.get("/api/cultivo/plantas", (_req, res) => {
  res.json({ ok: true, total: cultivo.plantas.length, data: cultivo.plantas });
});

app.get("/api/cultivo/cosechas", (_req, res) => {
  res.json({ ok: true, total: cultivo.cosechas.length, data: cultivo.cosechas });
});

app.get("/api/stock", (_req, res) => {
  res.json({ ok: true, total: stock.length, data: stock });
});

app.get("/api/stock/alertas", (_req, res) => {
  const alertas = stock.filter(s => s.cantidad < s.alertaMinima);
  res.json({ ok: true, total: alertas.length, data: alertas });
});

app.get("/api/facturacion", (_req, res) => {
  res.json({ ok: true, total: facturacion.length, data: facturacion });
});

app.get("/api/facturacion/:id", (req, res) => {
  const mov = facturacion.find(f => f.id === Number(req.params.id));
  if (!mov) return res.status(404).json({ ok: false, message: "Movimiento no encontrado" });
  res.json({ ok: true, data: mov });
});

app.get("/api/auditoria", (_req, res) => {
  res.json({ ok: true, total: auditoria.length, data: auditoria });
});

module.exports = { app };
