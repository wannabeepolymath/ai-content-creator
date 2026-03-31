import { z } from "zod";

const textProviderSchema = z.enum(["openai", "gemini"]);
const imageProviderSchema = z.enum(["none", "gemini"]);

export type TextProviderName = z.infer<typeof textProviderSchema>;
export type ImageProviderName = z.infer<typeof imageProviderSchema>;

const configSchema = z.object({
  textProvider: textProviderSchema,
  imageProvider: imageProviderSchema,
  openAiApiKey: z.string().optional(),
  openAiModel: z.string().min(1),
  geminiApiKey: z.string().optional(),
  geminiTextModel: z.string().min(1),
  geminiImageModel: z.string().min(1),
});

export type AIProviderConfig = z.infer<typeof configSchema>;

type AIProviderWarnings = {
  warnings: string[];
};

function inferDefaultTextProvider(): TextProviderName {
  if (process.env.AI_TEXT_PROVIDER === "gemini") {
    return "gemini";
  }
  return "openai";
}

function inferDefaultImageProvider(): ImageProviderName {
  if (process.env.AI_IMAGE_PROVIDER === "none") {
    return "none";
  }
  if (process.env.GEMINI_API_KEY?.trim()) {
    return "gemini";
  }
  return "none";
}

export function getAIProviderConfig(): AIProviderConfig {
  const parsed = configSchema.parse({
    textProvider: process.env.AI_TEXT_PROVIDER ?? inferDefaultTextProvider(),
    imageProvider: process.env.AI_IMAGE_PROVIDER ?? inferDefaultImageProvider(),
    openAiApiKey: process.env.OPENAI_API_KEY?.trim() || undefined,
    openAiModel: process.env.OPENAI_MODEL?.trim() || "gpt-4.1-mini",
    geminiApiKey: process.env.GEMINI_API_KEY?.trim() || undefined,
    geminiTextModel: process.env.GEMINI_TEXT_MODEL?.trim() || "gemini-2.5-flash",
    geminiImageModel: process.env.GEMINI_IMAGE_MODEL?.trim() || "gemini-3.1-flash-image-preview",
  });

  return parsed;
}

export function getEffectiveImageProvider(config: AIProviderConfig): ImageProviderName {
  if (config.imageProvider === "gemini" && !config.geminiApiKey) {
    return "none";
  }
  return config.imageProvider;
}

export function getAIProviderWarnings(config: AIProviderConfig): AIProviderWarnings {
  const warnings: string[] = [];
  if (config.textProvider === "openai" && !config.openAiApiKey?.trim()) {
    warnings.push("OPENAI_API_KEY is not set. Provide it in .env or send X-API-Key from the app.");
  }
  if (config.textProvider === "gemini" && !config.geminiApiKey?.trim()) {
    warnings.push("GEMINI_API_KEY is not set. Provide it in .env or send X-API-Key from the app.");
  }
  if (config.imageProvider === "gemini" && !config.geminiApiKey?.trim()) {
    warnings.push("AI_IMAGE_PROVIDER=gemini is configured, but GEMINI_API_KEY is missing. Image generation is disabled.");
  }
  return { warnings };
}

export function getAIProviderSummary() {
  const config = getAIProviderConfig();
  const effectiveImageProvider = getEffectiveImageProvider(config);
  const { warnings } = getAIProviderWarnings(config);
  return {
    textProvider: config.textProvider,
    textModel: config.textProvider === "openai" ? config.openAiModel : config.geminiTextModel,
    imageProvider: effectiveImageProvider,
    imageModel: effectiveImageProvider === "gemini" ? config.geminiImageModel : null,
    warnings,
  };
}
