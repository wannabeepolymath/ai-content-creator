import { getAIProviderConfig, getEffectiveImageProvider } from "./config.js";
import { createGeminiImageProvider, createGeminiTextProvider } from "./gemini-provider.js";
import { createOpenAITextProvider } from "./openai-text-provider.js";

export function getAIProviders() {
  const config = getAIProviderConfig();
  const effectiveImageProvider = getEffectiveImageProvider(config);

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
