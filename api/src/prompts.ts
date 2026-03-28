import type { GenerateRequest } from "./types.js";

export function buildSystemPrompt() {
  return [
    "You generate structured content for a TipTap editor.",
    "Return valid JSON only, no markdown fences.",
    "Output shape:",
    '{"type":"doc","content":[...nodes]}',
    "Allowed node types: heading, paragraph, bulletList, orderedList, listItem, blockquote, horizontalRule, codeBlock, image, table, tableRow, tableHeader, tableCell.",
    "For text-bearing nodes, use ProseMirror text nodes with {type:'text', text:'...'}.",
    "For image node, use attrs.src as a real https URL.",
    "Keep content useful and polished.",
  ].join("\n");
}

export function buildUserPrompt(input: GenerateRequest) {
  const details =
    input.contentType === "social"
      ? "Create one strong LinkedIn-style post with a hook, 3-5 concise points, and a CTA."
      : "Create a blog post with title, intro, 3-5 sections, and practical conclusion.";

  const contextText = input.context?.trim()
    ? `\nReference context:\n${input.context}`
    : "";

  return [
    `Content type: ${input.contentType}`,
    `User request: ${input.prompt}`,
    details,
    "Include at least one richer layout element like table or image.",
    contextText,
  ].join("\n");
}
