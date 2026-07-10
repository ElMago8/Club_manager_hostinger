const { Router } = require("express");
const { socios } = require("../data/demoData.js");

const router = Router();

router.get("/socios", (_req, res) => {
  res.json({ ok: true, total: socios.length, data: socios });
});

router.get("/socios/:id", (req, res) => {
  const socio = socios.find(s => s.id === Number(req.params.id));
  if (!socio) return res.status(404).json({ ok: false, message: "Socio no encontrado" });
  res.json({ ok: true, data: socio });
});

module.exports = { sociosRouter: router };
