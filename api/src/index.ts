import cors from "cors";
import express from "express";
import { getAIProviderSummary } from "./ai/providers/config.js";
import { registerSnapshotRoutes } from "./routes/snapshots.js";
import { registerStreamRoute } from "./routes/stream.js";

const app = express();
const port = Number(process.env.PORT ?? 4000);

app.use(cors({ origin: process.env.WEB_ORIGIN ?? "http://localhost:5173" }));
app.use(express.json({ limit: "5mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

registerStreamRoute(app);
registerSnapshotRoutes(app);

app.listen(port, () => {
  const ai = getAIProviderSummary();
  console.log(`[api] listening on http://localhost:${port}`);
  console.log("[api] AI text provider:", ai.textProvider);
  console.log("[api] AI text model:", ai.textModel);
  console.log("[api] AI image provider:", ai.imageProvider);
  console.log("[api] AI image model:", ai.imageModel ?? "(disabled)");
  for (const warning of ai.warnings) {
    console.warn("[api] warning:", warning);
  }
});
