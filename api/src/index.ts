import cors from "cors";
import express from "express";
import { registerStreamRoute } from "./routes/stream.js";

const app = express();
const port = Number(process.env.PORT ?? 4000);

app.use(cors({ origin: process.env.WEB_ORIGIN ?? "http://localhost:5173" }));
app.use(express.json({ limit: "5mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

registerStreamRoute(app);

app.listen(port, () => {
  console.log(`[api] listening on http://localhost:${port}`);
  console.log("[api] OPENAI_API_KEY set:", Boolean(process.env.OPENAI_API_KEY));
  console.log("[api] OPENAI_MODEL:", process.env.OPENAI_MODEL ?? "(default gpt-4.1-mini)");
});
