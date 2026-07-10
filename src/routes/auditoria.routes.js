const { Router } = require("express");
const { auditoria } = require("../data/demoData.js");

const router = Router();

router.get("/auditoria", (_req, res) => {
  res.json({ ok: true, total: auditoria.length, data: auditoria });
});

module.exports = { auditoriaRouter: router };
