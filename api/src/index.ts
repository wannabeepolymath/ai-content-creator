import { getAIProviderSummary } from "./ai/providers/config.js";
import { createApp } from "./app.js";

const app = createApp();

export default app;

if (!process.env.VERCEL) {
  const port = Number(process.env.PORT ?? 4000);

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
}
