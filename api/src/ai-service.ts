import { createStreamDocBuilder } from "./ai/stream-doc-builder.js";
import { mapModelLineToBlock, modelLineSchema } from "./ai/model-line.js";
import { getAIProviders } from "./ai/providers/index.js";
import { buildSystemPrompt, buildUserPrompt } from "./prompts.js";
import { streamDeltaDataSchema, type GenerateRequest, type ReferenceMaterial, type StreamBlockData, type TipTapDoc } from "./types.js";

type StreamCallbacks = {
  onDelta: (value: string) => void;
  onBlock: (value: StreamBlockData) => void;
};

type StreamOptions = {
  signal?: AbortSignal;
  documentText?: string;
  references?: ReferenceMaterial[];
  /** Overrides server env API key for the active text provider (OpenAI or Gemini). */
  apiKey?: string | null;
};

export async function streamDocEvents(
  input: GenerateRequest,
  callbacks: StreamCallbacks,
  options: StreamOptions = {},
): Promise<{ assistantText: string; doc: TipTapDoc }> {
  const { textProvider, imageProvider } = getAIProviders({ apiKey: options.apiKey });
  const docBuilder = createStreamDocBuilder();
  const documentText = options.documentText?.trim() ?? "";
  const references = options.references ?? [];
  const allowImages = input.contentType !== "blog";
  const imageGenerationMode = allowImages && imageProvider ? "provider_prompt" : "external_url";
  const messages = [
    {
      role: "system" as const,
      content: buildSystemPrompt({
        allowImages,
        imageGenerationMode,
        imageProviderName: imageProvider?.name ?? null,
      }),
    },
    {
      role: "user" as const,
      content: buildUserPrompt(input, documentText, {
        allowImages,
        imageGenerationMode,
        imageProviderName: imageProvider?.name ?? null,
      }, references),
    },
  ];
  console.log("[ai-service] streamDocEvents start", {
    textProvider: textProvider.name,
    textModel: textProvider.model,
    imageProvider: imageProvider?.name ?? "none",
    imageModel: imageProvider?.model ?? null,
    documentChars: documentText.length,
    referenceCount: references.length,
    referenceChars: references.reduce((total, reference) => total + reference.charCount, 0),
    signal: Boolean(options.signal),
  });
  console.log("[ai-service] final prompt to LLM", JSON.stringify(messages, null, 2));
  const stream = await textProvider.streamText(messages, {
    signal: options.signal,
    temperature: 0.5,
  });

  let pending = "";
  let assistantText = "";

  async function processLine(rawLine: string) {
    const line = rawLine.trim();
    if (!line || line === "```" || line.startsWith("```")) {
      return;
    }
    let json: unknown;
    try {
      json = JSON.parse(line);
    } catch {
      console.log("[ai-service] skip non-JSON line:", line.slice(0, 120));
      return;
    }
    const parsed = modelLineSchema.safeParse(json);
    if (!parsed.success) {
      console.log("[ai-service] model line schema mismatch", parsed.error.flatten(), "line:", line.slice(0, 200));
      return;
    }
    if (parsed.data.kind === "delta") {
      const delta = streamDeltaDataSchema.parse({ type: "text", value: parsed.data.text });
      callbacks.onDelta(delta.value);
      docBuilder.appendText(delta.value);
      assistantText += delta.value;
      return;
    }
    const block = await mapModelLineToBlock(parsed.data, {
      resolveImage: async (imageLine) => {
        if (!allowImages) {
          throw new Error("Image blocks are disabled for blog content");
        }
        if (imageLine.src) {
          return { type: "image", src: imageLine.src, alt: imageLine.alt ?? "" };
        }
        if (!imageLine.prompt?.trim()) {
          throw new Error("Image block is missing both src and prompt");
        }
        if (!imageProvider) {
          throw new Error("Image prompt emitted but no image provider is configured");
        }
        const generatedImage = await imageProvider.generateImage({
          prompt: imageLine.prompt,
          alt: imageLine.alt,
          signal: options.signal,
        });
        return { type: "image", src: generatedImage.src, alt: generatedImage.alt };
      },
    });
    if (!block) {
      return;
    }
    callbacks.onBlock(block);
    docBuilder.applyBlock(block);
    if (block.type === "paragraph_end" || block.type === "heading_end" || block.type === "list_item_end") {
      assistantText += "\n";
    }
  }

  let chunkCount = 0;
  for await (const token of stream) {
    chunkCount += 1;
    if (!token) {
      continue;
    }
    pending += token;
    while (true) {
      const newlineIndex = pending.indexOf("\n");
      if (newlineIndex < 0) {
        break;
      }
      const line = pending.slice(0, newlineIndex);
      pending = pending.slice(newlineIndex + 1);
      try {
        await processLine(line);
      } catch (err) {
        console.log("[ai-service] processLine error", err, "line:", line.slice(0, 200));
        continue;
      }
    }
  }

  if (pending.trim()) {
    try {
      await processLine(pending);
    } catch {
      console.log("[ai-service] trailing pending failed to parse:", pending.slice(0, 200));
    }
  }

  const doc = docBuilder.buildDoc();
  console.log("[ai-service] streamDocEvents complete", {
    sseChunks: chunkCount,
    assistantChars: assistantText.trim().length,
    topLevelNodes: doc.content?.length ?? 0,
  });
  return {
    assistantText: assistantText.trim(),
    doc,
  };
}
