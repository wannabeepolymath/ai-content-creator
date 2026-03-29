import type { Editor } from "@tiptap/react";

export type EditorToolbarCapabilities = {
  canUndo: boolean;
  canRedo: boolean;
  canInsertTable: boolean;
  canAddRow: boolean;
  canDeleteRow: boolean;
  canAddColumn: boolean;
  canDeleteColumn: boolean;
  canDeleteTable: boolean;
  isLinkActive: boolean;
  canToggleBold: boolean;
  canToggleItalic: boolean;
  canToggleUnderline: boolean;
  canToggleStrike: boolean;
  canToggleCode: boolean;
  canToggleSuperscript: boolean;
  canToggleSubscript: boolean;
};

export function useEditorToolbarCapabilities(editor: Editor | null): EditorToolbarCapabilities {
  const canUndo = editor ? editor.can().chain().focus().undo().run() : false;
  const canRedo = editor ? editor.can().chain().focus().redo().run() : false;
  const canInsertTable = editor
    ? editor.can().chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
    : false;
  const canAddRow = editor ? editor.can().chain().focus().addRowAfter().run() : false;
  const canDeleteRow = editor ? editor.can().chain().focus().deleteRow().run() : false;
  const canAddColumn = editor ? editor.can().chain().focus().addColumnAfter().run() : false;
  const canDeleteColumn = editor ? editor.can().chain().focus().deleteColumn().run() : false;
  const canDeleteTable = editor ? editor.can().chain().focus().deleteTable().run() : false;
  const isLinkActive = editor ? editor.isActive("link") : false;
  const canToggleBold = editor ? editor.can().chain().focus().toggleBold().run() : false;
  const canToggleItalic = editor ? editor.can().chain().focus().toggleItalic().run() : false;
  const canToggleUnderline = editor ? editor.can().chain().focus().toggleUnderline().run() : false;
  const canToggleStrike = editor ? editor.can().chain().focus().toggleStrike().run() : false;
  const canToggleCode = editor ? editor.can().chain().focus().toggleCode().run() : false;
  const canToggleSuperscript = editor ? editor.can().chain().focus().toggleSuperscript().run() : false;
  const canToggleSubscript = editor ? editor.can().chain().focus().toggleSubscript().run() : false;

  return {
    canUndo,
    canRedo,
    canInsertTable,
    canAddRow,
    canDeleteRow,
    canAddColumn,
    canDeleteColumn,
    canDeleteTable,
    isLinkActive,
    canToggleBold,
    canToggleItalic,
    canToggleUnderline,
    canToggleStrike,
    canToggleCode,
    canToggleSuperscript,
    canToggleSubscript,
  };
}
