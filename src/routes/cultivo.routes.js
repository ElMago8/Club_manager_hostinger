const { Router } = require("express");
const { cultivo } = require("../data/demoData.js");

const router = Router();

router.get("/cultivo", (_req, res) => {
  res.json({ ok: true, data: cultivo });
});

router.get("/cultivo/salas", (_req, res) => {
  res.json({ ok: true, total: cultivo.salas.length, data: cultivo.salas });
});

router.get("/cultivo/plantas", (_req, res) => {
  res.json({ ok: true, total: cultivo.plantas.length, data: cultivo.plantas });
});

router.get("/cultivo/cosechas", (_req, res) => {
  res.json({ ok: true, total: cultivo.cosechas.length, data: cultivo.cosechas });
});

module.exports = { cultivoRouter: router };
