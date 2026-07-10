const { Router } = require("express");

const router = Router();

router.get("/health", (_req, res) => {
  res.json({ ok: true, service: "cannabis-club-manager-api", timestamp: new Date().toISOString() });
});

module.exports = { healthRouter: router };
