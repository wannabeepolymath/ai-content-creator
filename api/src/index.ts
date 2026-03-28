import cors from "cors";
import express from "express";
import { generateDoc } from "./ai-service.js";
import { generateRequestSchema } from "./types.js";

const app = express();
const port = Number(process.env.PORT ?? 4000);

app.use(cors({ origin: process.env.WEB_ORIGIN ?? "http://localhost:5173" }));
app.use(express.json({ limit: "5mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

// app.post("/api/generate", async (req, res) => {
//   const parsed = generateRequestSchema.safeParse(req.body);
//   if (!parsed.success) {
//     return res.status(400).json({ error: "Invalid payload", details: parsed.error.flatten() });
//   }

//   const doc = await generateDoc(parsed.data);
//   return res.json({ doc });
// });

app.post("/api/generate-stream", async (req, res) => {
  const parsed = generateRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid payload", details: parsed.error.flatten() });
  }

  res.setHeader("Content-Type", "application/x-ndjson; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  try {
    const doc = await generateDoc(parsed.data);
    for (const node of doc.content) {
      const chunk = JSON.stringify({ type: "chunk", node });
      res.write(`${chunk}\n`);
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
    res.write(`${JSON.stringify({ type: "done" })}\n`);
    return res.end();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Generation failed";
    console.error("[/api/generate-stream]", error);
    res.write(`${JSON.stringify({ type: "error", message })}\n`);
    return res.end();
  }  
});

app.listen(port, () => {
  console.log(`API running on http://localhost:${port}`);
  console.log(`OPENAI_API_KEY: ${process.env.OPENAI_API_KEY}`);
});
