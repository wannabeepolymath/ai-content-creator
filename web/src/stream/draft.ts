import type { MutableRefObject } from "react";
import type { Editor } from "@tiptap/react";
import type { StreamBlock, TipTapDoc, TipTapNode } from "../types";

export type DraftState = {
  currentTextNodes: TipTapNode[] | null;
  activeBlock: "paragraph" | "heading" | "list_item" | null;
  currentList: TipTapNode | null;
};

export function resetDraftDoc(
  draftDocRef: MutableRefObject<TipTapDoc>,
  draftStateRef: MutableRefObject<DraftState>,
) {
  draftDocRef.current = { type: "doc", content: [] };
  draftStateRef.current = { currentTextNodes: null, activeBlock: null, currentList: null };
}

export function pushText(
  draftDocRef: MutableRefObject<TipTapDoc>,
  draftStateRef: MutableRefObject<DraftState>,
  value: string,
) {
  if (!value) {
    return;
  }
  if (!draftStateRef.current.currentTextNodes) {
    applyBlock(draftDocRef, draftStateRef, { type: "paragraph_start" });
  }
  const target = draftStateRef.current.currentTextNodes!;
  const lastNode = target[target.length - 1];
  if (lastNode?.type === "text") {
    lastNode.text = `${lastNode.text ?? ""}${value}`;
    return;
  }
  target.push({ type: "text", text: value });
}

export function applyBlock(
  draftDocRef: MutableRefObject<TipTapDoc>,
  draftStateRef: MutableRefObject<DraftState>,
  block: StreamBlock,
) {
  switch (block.type) {
    case "paragraph_start": {
      const node: TipTapNode = { type: "paragraph", content: [] };
      draftDocRef.current.content.push(node);
      draftStateRef.current.currentTextNodes = node.content!;
      draftStateRef.current.activeBlock = "paragraph";
      break;
    }
    case "paragraph_end":
      if (draftStateRef.current.activeBlock === "paragraph") {
        draftStateRef.current.currentTextNodes = null;
        draftStateRef.current.activeBlock = null;
      }
      break;
    case "heading_start": {
      const node: TipTapNode = { type: "heading", attrs: { level: block.level }, content: [] };
      draftDocRef.current.content.push(node);
      draftStateRef.current.currentTextNodes = node.content!;
      draftStateRef.current.activeBlock = "heading";
      break;
    }
    case "heading_end":
      if (draftStateRef.current.activeBlock === "heading") {
        draftStateRef.current.currentTextNodes = null;
        draftStateRef.current.activeBlock = null;
      }
      break;
    case "bullet_list_start": {
      const node: TipTapNode = { type: "bulletList", content: [] };
      draftDocRef.current.content.push(node);
      draftStateRef.current.currentList = node;
      draftStateRef.current.currentTextNodes = null;
      draftStateRef.current.activeBlock = null;
      break;
    }
    case "ordered_list_start": {
      const node: TipTapNode = { type: "orderedList", content: [] };
      draftDocRef.current.content.push(node);
      draftStateRef.current.currentList = node;
      draftStateRef.current.currentTextNodes = null;
      draftStateRef.current.activeBlock = null;
      break;
    }
    case "list_item_start": {
      if (!draftStateRef.current.currentList) {
        applyBlock(draftDocRef, draftStateRef, { type: "bullet_list_start" });
      }
      const paragraph: TipTapNode = { type: "paragraph", content: [] };
      const listItem: TipTapNode = { type: "listItem", content: [paragraph] };
      draftStateRef.current.currentList!.content!.push(listItem);
      draftStateRef.current.currentTextNodes = paragraph.content!;
      draftStateRef.current.activeBlock = "list_item";
      break;
    }
    case "list_item_end":
      if (draftStateRef.current.activeBlock === "list_item") {
        draftStateRef.current.currentTextNodes = null;
        draftStateRef.current.activeBlock = null;
      }
      break;
    case "bullet_list_end":
    case "ordered_list_end":
      draftStateRef.current.currentList = null;
      draftStateRef.current.currentTextNodes = null;
      draftStateRef.current.activeBlock = null;
      break;
    case "image":
      draftDocRef.current.content.push({
        type: "image",
        attrs: { src: block.src, alt: block.alt ?? "", float: "left" },
      });
      draftStateRef.current.currentTextNodes = null;
      draftStateRef.current.activeBlock = null;
      break;
    default:
      break;
  }
}

export function renderDraftDoc(editor: Editor | null, draftDocRef: MutableRefObject<TipTapDoc>) {
  if (!editor) {
    return;
  }
  editor.commands.setContent(structuredClone(draftDocRef.current), { emitUpdate: false });
}
