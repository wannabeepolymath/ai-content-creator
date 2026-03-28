import type { StreamBlockData, TipTapDoc, TipTapNode } from "../types.js";

function createEmptyDoc(): TipTapDoc {
  return { type: "doc", content: [] };
}

function textNode(value: string): TipTapNode {
  return { type: "text", text: value };
}

export function createStreamDocBuilder() {
  const doc = createEmptyDoc();
  let currentTextNodes: TipTapNode[] | null = null;
  let activeBlock: "paragraph" | "heading" | "list_item" | null = null;
  let currentList: TipTapNode | null = null;

  function appendText(value: string) {
    if (!value) {
      return;
    }
    if (!currentTextNodes) {
      startParagraph();
    }
    const target = currentTextNodes!;
    const lastNode = target[target.length - 1];
    if (lastNode?.type === "text") {
      lastNode.text = `${lastNode.text ?? ""}${value}`;
      return;
    }
    target.push(textNode(value));
  }

  function startParagraph() {
    const node: TipTapNode = { type: "paragraph", content: [] };
    doc.content.push(node);
    currentTextNodes = node.content!;
    activeBlock = "paragraph";
  }

  function startHeading(level: number) {
    const node: TipTapNode = { type: "heading", attrs: { level }, content: [] };
    doc.content.push(node);
    currentTextNodes = node.content!;
    activeBlock = "heading";
  }

  function startList(type: "bulletList" | "orderedList") {
    const node: TipTapNode = { type, content: [] };
    doc.content.push(node);
    currentList = node;
    currentTextNodes = null;
    activeBlock = null;
  }

  function startListItem() {
    if (!currentList) {
      startList("bulletList");
    }
    const paragraph: TipTapNode = { type: "paragraph", content: [] };
    const listItem: TipTapNode = { type: "listItem", content: [paragraph] };
    currentList!.content!.push(listItem);
    currentTextNodes = paragraph.content!;
    activeBlock = "list_item";
  }

  function applyBlock(block: StreamBlockData) {
    switch (block.type) {
      case "paragraph_start":
        startParagraph();
        break;
      case "paragraph_end":
        if (activeBlock === "paragraph") {
          currentTextNodes = null;
          activeBlock = null;
        }
        break;
      case "heading_start":
        startHeading(block.level);
        break;
      case "heading_end":
        if (activeBlock === "heading") {
          currentTextNodes = null;
          activeBlock = null;
        }
        break;
      case "bullet_list_start":
        startList("bulletList");
        break;
      case "bullet_list_end":
      case "ordered_list_end":
        currentList = null;
        currentTextNodes = null;
        activeBlock = null;
        break;
      case "ordered_list_start":
        startList("orderedList");
        break;
      case "list_item_start":
        startListItem();
        break;
      case "list_item_end":
        if (activeBlock === "list_item") {
          currentTextNodes = null;
          activeBlock = null;
        }
        break;
      case "image":
        doc.content.push({ type: "image", attrs: { src: block.src, alt: block.alt ?? "" } });
        currentTextNodes = null;
        activeBlock = null;
        break;
      default:
        break;
    }
  }

  return {
    appendText,
    applyBlock,
    buildDoc: () => doc,
  };
}
