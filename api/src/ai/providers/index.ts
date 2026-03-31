import { type AIProviderConfig, getAIProviderConfig, getEffectiveImageProvider } from "./config.js";
import { createGeminiImageProvider, createGeminiTextProvider } from "./gemini-provider.js";
import { createOpenAITextProvider } from "./openai-text-provider.js";

function mergeRequestApiKey(config: AIProviderConfig, requestApiKey?: string | null): AIProviderConfig {
  const key = requestApiKey?.trim();
  if (!key) {
    return config;
  }
  if (config.textProvider === "openai") {
    return { ...config, openAiApiKey: key };
  }
  return { ...config, geminiApiKey: key };
}

export function getAIProviders(options?: { apiKey?: string | null }) {
  const config = mergeRequestApiKey(getAIProviderConfig(), options?.apiKey);
  const effectiveImageProvider = getEffectiveImageProvider(config);

  if (config.textProvider === "openai" && !config.openAiApiKey?.trim()) {
    throw new Error("OPENAI_API_KEY is required (set in .env or send X-API-Key from the app)");
  }
  if (config.textProvider === "gemini" && !config.geminiApiKey?.trim()) {
    throw new Error("GEMINI_API_KEY is required (set in .env or send X-API-Key from the app)");
  }

  const textProvider =
    config.textProvider === "gemini"
      ? createGeminiTextProvider({
          apiKey: config.geminiApiKey!,
          textModel: config.geminiTextModel,
          imageModel: config.geminiImageModel,
        })
      : createOpenAITextProvider({
          apiKey: config.openAiApiKey!,
          model: config.openAiModel,
        });

  const imageProvider =
    effectiveImageProvider === "gemini"
      ? createGeminiImageProvider({
          apiKey: config.geminiApiKey!,
          textModel: config.geminiTextModel,
          imageModel: config.geminiImageModel,
        })
      : null;

  return {
    config,
    textProvider,
    imageProvider,
  };
}
