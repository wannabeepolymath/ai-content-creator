import cors from "cors";
import express from "express";
import { registerSnapshotRoutes } from "./routes/snapshots.js";
import { registerStreamRoute } from "./routes/stream.js";

function parseConfiguredOrigins(rawValue?: string) {
  return (rawValue ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

function isVercelPreviewOrigin(origin: string) {
  try {
    const { protocol, hostname } = new URL(origin);
    return protocol === "https:" && hostname.endsWith(".vercel.app");
  } catch {
    return false;
  }
}

function createCorsOriginHandler() {
  const configuredOrigins = parseConfiguredOrigins(process.env.CORS_ORIGINS ?? process.env.WEB_ORIGIN);
  const allowPreviewOrigins = process.env.ALLOW_VERCEL_PREVIEW_ORIGINS === "true";
  const runningOnVercel = Boolean(process.env.VERCEL);
  const allowAllOrigins = runningOnVercel && configuredOrigins.length === 0;
  const defaultLocalOrigins = ["http://localhost:5173"];
  const allowedOrigins = configuredOrigins.length > 0 ? configuredOrigins : allowAllOrigins ? [] : defaultLocalOrigins;

  return (origin: string | undefined, callback: (error: Error | null, allow?: boolean) => void) => {
    if (!origin) {
      callback(null, true);
      return;
    }
    if (allowAllOrigins) {
      callback(null, true);
      return;
    }
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    if (allowPreviewOrigins && isVercelPreviewOrigin(origin)) {
      callback(null, true);
      return;
    }
    callback(null, false);
  };
}

export function createApp() {
  const app = express();
  const jsonBodyLimit = process.env.VERCEL ? "4mb" : "5mb";

  app.set("trust proxy", true);
  app.use(
    cors({
      origin: createCorsOriginHandler(),
    }),
  );
  app.use(express.json({ limit: jsonBodyLimit }));

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true });
  });

  registerStreamRoute(app);
  registerSnapshotRoutes(app);

  return app;
}

const app = createApp();

export default app;
