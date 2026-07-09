import { app } from "./app.js";
import { env } from "./config/env.js";

const port = Number(process.env.PORT ?? env.port ?? 4000);
const host = "0.0.0.0";

const server = app.listen(port, host, () => {
    console.log(`CCM API listening on http://${host}:${port}`);
});

server.on("error", (error) => {
    console.error("CCM API failed to start:", error);
    process.exit(1);
});

process.on("unhandledRejection", (reason) => {
    console.error("Unhandled rejection:", reason);
});

process.on("uncaughtException", (error) => {
    console.error("Uncaught exception:", error);
    process.exit(1);
});
