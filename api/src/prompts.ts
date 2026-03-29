import type { GenerateRequest } from "./types.js";

type PromptOptions = {
  imageGenerationMode: "provider_prompt" | "external_url";
  imageProviderName?: string | null;
  allowImages: boolean;
};

export function buildSystemPrompt(options: PromptOptions) {
  const imageBlockInstructions = !options.allowImages
    ? ["Do not emit image blocks for this request."]
    : options.imageGenerationMode === "provider_prompt"
      ? [
          "For image blocks, do not return external URLs.",
          `When an image is relevant, emit {"kind":"block","block":"image","prompt":"concise visual prompt","alt":"accessible description"} so the ${options.imageProviderName ?? "configured"} image provider can render it.`,
        ]
      : [
          "always send unsplash image URLs in .jpg format",
          "Use only valid https image URLs.",
          '{"kind":"block","block":"image","src":"https://example.com/image.jpg","alt":"description"}',
        ];
  const allowedLineObjects = options.allowImages
    ? ['{"kind":"block","block":"image","src":"https://example.com/image.jpg","alt":"description"}']
    : [];
  const supportedBlocks = options.allowImages
    ? "Supported live blocks are paragraphs, headings, lists, and images."
    : "Supported live blocks are paragraphs, headings, and lists.";

  return [
    "You generate content as streaming events for a TipTap editor.",
    "Return ONLY JSON lines (one JSON object per line).",
    "Never use markdown fences and never output prose outside JSON lines.",
    ...imageBlockInstructions,
    "Allowed line objects:",
    '{"kind":"block","block":"paragraph_start"}',
    '{"kind":"block","block":"paragraph_end"}',
    '{"kind":"block","block":"heading_start","level":2}',
    '{"kind":"block","block":"heading_end"}',
    '{"kind":"block","block":"bullet_list_start"}',
    '{"kind":"block","block":"bullet_list_end"}',
    '{"kind":"block","block":"ordered_list_start"}',
    '{"kind":"block","block":"ordered_list_end"}',
    '{"kind":"block","block":"list_item_start"}',
    '{"kind":"block","block":"list_item_end"}',
    ...allowedLineObjects,
    '{"kind":"delta","text":"Text chunk"}',
    "Emit many delta lines so text appears progressively.",
    supportedBlocks,
  ].join("\n");
}

export function buildUserPrompt(input: GenerateRequest, documentText: string | undefined, options: PromptOptions) {
  const details =
    input.contentType === "social"
      ? "Create one strong LinkedIn-style post with a hook, 3-5 concise points, and a CTA."
      : "Create a blog post with title, intro, 3-5 sections, and practical conclusion.";
  const imageGuidance = !options.allowImages
    ? "Do not include image blocks."
    : options.imageGenerationMode === "provider_prompt"
      ? "When an image helps, include one image block with a short visual prompt and clear alt text."
      : "Include at least one image block when relevant.";

  const contextText = input.context?.trim()
    ? `\nReference context:\n${input.context}`
    : "";

  return [
    `Content type: ${input.contentType}`,
    documentText?.trim()
      ? [
          "Current document: ",
          documentText.trim(),
        ].join("\n")
      : "",
    `User request: ${input.prompt}`,
    details,
    imageGuidance,
    contextText,
  ].join("\n");
}
