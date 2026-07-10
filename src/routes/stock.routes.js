const { Router } = require("express");
const { stock } = require("../data/demoData.js");

const router = Router();

router.get("/stock", (_req, res) => {
  res.json({ ok: true, total: stock.length, data: stock });
});

router.get("/stock/alertas", (_req, res) => {
  const alertas = stock.filter(s => s.cantidad < s.alertaMinima);
  res.json({ ok: true, total: alertas.length, data: alertas });
});

module.exports = { stockRouter: router };
