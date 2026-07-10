const { Router } = require("express");
const { dashboard } = require("../data/demoData.js");

const router = Router();

router.get("/dashboard", (_req, res) => {
  res.json({ ok: true, data: dashboard });
});

module.exports = { dashboardRouter: router };
