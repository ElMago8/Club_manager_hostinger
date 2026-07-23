// Garantiza que el cliente Prisma esté generado antes de arrancar,
// independientemente de si Hostinger corrió el build step o no.
const { execSync } = require("child_process");
try {
  require("@prisma/client");
  console.log("Prisma client OK");
} catch {
  console.log("Prisma client not found, generating...");
  execSync("npx prisma generate", { stdio: "inherit", cwd: __dirname });
  console.log("Prisma client generated");
}

const { app } = require("./src/app.js");

const port = process.env.PORT || 3000;
const host = "0.0.0.0";

console.log("Starting CCM API...");
console.log("PORT:", port);
console.log("NODE_ENV:", process.env.NODE_ENV);

app.listen(port, host, () => {
  console.log(`CCM API listening on ${host}:${port}`);
});
