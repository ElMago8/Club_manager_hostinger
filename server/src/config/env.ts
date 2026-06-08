import dotenv from "dotenv";

dotenv.config();

function requiredEnv(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 4000),
  databaseUrl: requiredEnv("DATABASE_URL", "file:./dev.db"),
  frontendOrigins: (
    process.env.FRONTEND_ORIGIN ??
    "http://localhost:5173,http://127.0.0.1:5173,http://localhost:8080,http://localhost:8081,http://localhost:8082"
  )
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
};
