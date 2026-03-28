import type { GenerateRequest } from "./types.js";

export function buildSystemPrompt() {
  return [
    "You generate content as streaming events for a TipTap editor.",
    "Return ONLY JSON lines (one JSON object per line).",
    "Never use markdown fences and never output prose outside JSON lines.",
    "always send unsplash image URLs in .jpg format",
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
    '{"kind":"block","block":"image","src":"https://example.com/image.jpg","alt":"description"}',
    '{"kind":"delta","text":"Text chunk"}',
    "Emit many delta lines so text appears progressively.",
    "Use only valid https image URLs.",
    "Supported live blocks are paragraphs, headings, lists, and images.",
  ].join("\n");
}

export function buildUserPrompt(input: GenerateRequest, historyText: string, documentText?: string) {
  const details =
    input.contentType === "social"
      ? "Create one strong LinkedIn-style post with a hook, 3-5 concise points, and a CTA."
      : "Create a blog post with title, intro, 3-5 sections, and practical conclusion.";

  const contextText = input.context?.trim()
    ? `\nReference context:\n${input.context}`
    : "";

  return [
    `Content type: ${input.contentType}`,
    historyText ? `Conversation history:\n${historyText}` : "",
    documentText?.trim() ? `Current document:\n${documentText.trim()}` : "",
    `User request: ${input.prompt}`,
    details,
    "Include at least one image block when relevant.",
    contextText,
  ].join("\n");
}
