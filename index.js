const { execSync } = require("child_process");
const { app } = require("./src/app.js");

try {
  execSync("npx prisma db push --skip-generate --accept-data-loss=false", {
    stdio: "pipe",
    cwd: __dirname,
  });
  console.log("DB schema synced");
} catch (e) {
  console.warn("DB push warning:", (e.stderr || e.stdout || "").toString().slice(0, 300));
}

const port = process.env.PORT || 3000;
const host = "0.0.0.0";

console.log("Starting CCM API...");
console.log("PORT:", port);
console.log("NODE_ENV:", process.env.NODE_ENV);

app.listen(port, host, () => {
  console.log(`CCM API listening on ${host}:${port}`);
});
