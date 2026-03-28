import type { TipTapDoc, TipTapNode } from "../types.js";

function inlineText(node: TipTapNode): string {
  if (node.type === "text") {
    return node.text ?? "";
  }
  if (!node.content) {
    return "";
  }
  return node.content.map(inlineText).join("");
}

export function tiptapDocToText(doc: TipTapDoc): string {
  const lines: string[] = [];

  function walk(node: TipTapNode) {
    switch (node.type) {
      case "doc":
        node.content?.forEach(walk);
        return;
      case "paragraph":
      case "heading": {
        const text = inlineText(node).trim();
        if (text) {
          lines.push(text);
        }
        return;
      }
      case "listItem": {
        const text = inlineText(node).trim();
        if (text) {
          lines.push(`- ${text}`);
        }
        return;
      }
      case "bulletList":
      case "orderedList":
        node.content?.forEach(walk);
        return;
      case "image": {
        const alt = typeof node.attrs?.alt === "string" ? node.attrs.alt : "";
        const src = typeof node.attrs?.src === "string" ? node.attrs.src : "";
        const label = [alt, src].filter(Boolean).join(" ");
        lines.push(`[Image: ${label || "untitled"}]`);
        return;
      }
      default:
        node.content?.forEach(walk);
        return;
    }
  }

  walk(doc);
  return lines.join("\n");
}
