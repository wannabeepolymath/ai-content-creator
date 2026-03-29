import { GoogleGenAI } from "@google/genai";
import type {
  GenerateImageOptions,
  ImageGenerationProvider,
  ProviderMessage,
  StreamTextOptions,
  TextGenerationProvider,
} from "./types.js";

type GeminiProviderOptions = {
  apiKey: string;
  textModel: string;
  imageModel: string;
};

function buildUserContents(messages: ProviderMessage[]) {
  return messages
    .filter((message) => message.role === "user")
    .map((message) => ({
      role: "user" as const,
      parts: [{ text: message.content }],
    }));
}

export function createGeminiTextProvider(options: GeminiProviderOptions): TextGenerationProvider {
  const client = new GoogleGenAI({ apiKey: options.apiKey });

  return {
    name: "gemini",
    model: options.textModel,
    async streamText(messages: ProviderMessage[], streamOptions: StreamTextOptions = {}) {
      const systemInstruction = messages.find((message) => message.role === "system")?.content;
      const response = await client.models.generateContentStream({
        model: options.textModel,
        contents: buildUserContents(messages),
        config: {
          abortSignal: streamOptions.signal,
          temperature: streamOptions.temperature ?? 0.5,
          responseMimeType: "text/plain",
          systemInstruction,
        },
      });

      return {
        async *[Symbol.asyncIterator]() {
          for await (const chunk of response) {
            if (chunk.text) {
              yield chunk.text;
            }
          }
        },
      };
    },
  };
}

export function createGeminiImageProvider(options: GeminiProviderOptions): ImageGenerationProvider {
  const client = new GoogleGenAI({ apiKey: options.apiKey });

  return {
    name: "gemini",
    model: options.imageModel,
    async generateImage(imageOptions: GenerateImageOptions) {
      const response = await client.models.generateContent({
        model: options.imageModel,
        contents: imageOptions.prompt,
        config: {
          abortSignal: imageOptions.signal,
          responseModalities: ["IMAGE"],
        },
      });

      const parts = response.candidates?.[0]?.content?.parts ?? [];
      for (const part of parts) {
        const inlineData = part.inlineData;
        if (!inlineData?.data || !inlineData.mimeType) {
          continue;
        }
        return {
          src: `data:${inlineData.mimeType};base64,${inlineData.data}`,
          alt: imageOptions.alt?.trim() || "Generated image",
        };
      }

      throw new Error("Gemini image generation returned no image data");
    },
  };
}
