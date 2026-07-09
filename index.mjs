import express from "express";

const app = express();

const port = process.env.PORT || 3000;
const host = "0.0.0.0";

app.get("/", (_req, res) => {
  res.json({
    ok: true,
    service: "ccm-api-test",
    message: "API test running on Hostinger"
  });
});

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    health: "ok",
    service: "cannabis-club-manager-api"
  });
});

app.listen(port, host, () => {
  console.log(`CCM test API listening on ${host}:${port}`);
});
