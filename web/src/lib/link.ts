import type { Editor } from "@tiptap/react";

export function normalizeLinkHref(raw: string): string {
  const t = raw.trim();
  if (!t) {
    return "";
  }
  if (/^https?:\/\//i.test(t) || /^mailto:/i.test(t) || /^tel:/i.test(t)) {
    return t;
  }
  return `https://${t}`;
}

export function restoreLinkSelection(editor: Editor, saved: { from: number; to: number } | null) {
  if (!saved) {
    return;
  }
  const max = editor.state.doc.content.size;
  let from = Math.min(Math.max(0, saved.from), max);
  let to = Math.min(Math.max(0, saved.to), max);
  if (from > to) {
    [from, to] = [to, from];
  }
  editor.chain().focus().setTextSelection({ from, to }).run();
}
