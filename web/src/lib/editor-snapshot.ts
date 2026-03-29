import type { Editor } from "@tiptap/react";

export function getEditorSnapshot(editor: Editor): string {
  return JSON.stringify(editor.getJSON());
}
