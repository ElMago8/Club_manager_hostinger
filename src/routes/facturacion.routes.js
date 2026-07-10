const { Router } = require("express");
const { facturacion } = require("../data/demoData.js");

const router = Router();

router.get("/facturacion", (_req, res) => {
  res.json({ ok: true, total: facturacion.length, data: facturacion });
});

router.get("/facturacion/:id", (req, res) => {
  const mov = facturacion.find(f => f.id === Number(req.params.id));
  if (!mov) return res.status(404).json({ ok: false, message: "Movimiento no encontrado" });
  res.json({ ok: true, data: mov });
});

module.exports = { facturacionRouter: router };
