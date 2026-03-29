import OpenAI from "openai";
import type { ProviderMessage, StreamTextOptions, TextGenerationProvider } from "./types.js";

type OpenAITextProviderOptions = {
  apiKey: string;
  model: string;
};

export function createOpenAITextProvider(options: OpenAITextProviderOptions): TextGenerationProvider {
  const client = new OpenAI({ apiKey: options.apiKey });

  return {
    name: "openai",
    model: options.model,
    async streamText(messages: ProviderMessage[], streamOptions: StreamTextOptions = {}) {
      const stream = await client.chat.completions.create(
        {
          model: options.model,
          temperature: streamOptions.temperature ?? 0.5,
          stream: true,
          messages,
        },
        streamOptions.signal ? { signal: streamOptions.signal } : undefined,
      );

      return {
        async *[Symbol.asyncIterator]() {
          for await (const chunk of stream) {
            const token = chunk.choices[0]?.delta?.content;
            if (token) {
              yield token;
            }
          }
        },
      };
    },
  };
}
