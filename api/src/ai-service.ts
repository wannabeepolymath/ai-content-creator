import OpenAI from "openai";
import { createStreamDocBuilder } from "./ai/stream-doc-builder.js";
import { mapModelLineToBlock, modelLineSchema } from "./ai/model-line.js";
import { buildSystemPrompt, buildUserPrompt } from "./prompts.js";
import { streamDeltaDataSchema, type GenerateRequest, type StreamBlockData, type TipTapDoc } from "./types.js";

function getClient() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is missing");
  }
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

type StreamCallbacks = {
  onDelta: (value: string) => void;
  onBlock: (value: StreamBlockData) => void;
};

type StreamOptions = {
  signal?: AbortSignal;
  documentText?: string;
};

export async function streamDocEvents(
  input: GenerateRequest,
  callbacks: StreamCallbacks,
  options: StreamOptions = {},
): Promise<{ assistantText: string; doc: TipTapDoc }> {
  const client = getClient();
  const docBuilder = createStreamDocBuilder();
  const documentText = options.documentText?.trim() ?? "";
  const model = process.env.OPENAI_MODEL ?? "gpt-4.1-mini";
  const messages = [
    { role: "system" as const, content: buildSystemPrompt() },
    { role: "user" as const, content: buildUserPrompt(input, documentText) },
  ];
  console.log("[ai-service] streamDocEvents start", {
    model,
    documentChars: documentText.length,
    signal: Boolean(options.signal),
  });
  console.log("[ai-service] final prompt to LLM", JSON.stringify(messages, null, 2));
  const stream = await client.chat.completions.create(
    {
      model,
      temperature: 0.5,
      stream: true,
      messages,
    },
    options.signal ? { signal: options.signal } : undefined,
  );

  let pending = "";
  let assistantText = "";

  function processLine(rawLine: string) {
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
    const block = mapModelLineToBlock(parsed.data);
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
  for await (const chunk of stream) {
    chunkCount += 1;
    const token = chunk.choices[0]?.delta?.content;
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
        processLine(line);
      } catch (err) {
        console.log("[ai-service] processLine error", err, "line:", line.slice(0, 200));
        continue;
      }
    }
  }

  if (pending.trim()) {
    try {
      processLine(pending);
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
