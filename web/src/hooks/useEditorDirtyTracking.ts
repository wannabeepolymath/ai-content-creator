import { useEffect, useRef, useState, type MutableRefObject } from "react";
import type { Editor } from "@tiptap/react";
import { getEditorSnapshot } from "../lib/editor-snapshot";

export type EditorDirtyAutoSaveOptions = {
  delayMs: number;
  onSave: () => void | Promise<void>;
  isBlockedRef: MutableRefObject<boolean>;
};

export function useEditorDirtyTracking(editor: Editor | null, autoSave?: EditorDirtyAutoSaveOptions) {
  const [isDirty, setIsDirty] = useState(false);
  const lastSavedRef = useRef("");
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoSaveOptionsRef = useRef(autoSave);
  autoSaveOptionsRef.current = autoSave;

  function clearAutoSaveTimer() {
    if (autoSaveTimerRef.current !== null) {
      clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
    }
  }

  function markEditorAsSaved(editorInstance: Editor) {
    lastSavedRef.current = getEditorSnapshot(editorInstance);
    setIsDirty(false);
    clearAutoSaveTimer();
  }

  useEffect(() => {
    if (!editor) {
      return;
    }
    lastSavedRef.current = getEditorSnapshot(editor);
    setIsDirty(false);
    clearAutoSaveTimer();
  }, [editor]);

  useEffect(() => {
    if (!editor) {
      return;
    }
    const handleUpdate = () => {
      const snapshot = getEditorSnapshot(editor);
      const dirty = snapshot !== lastSavedRef.current;
      setIsDirty(dirty);

      const opts = autoSaveOptionsRef.current;
      if (!opts) {
        return;
      }
      clearAutoSaveTimer();
      if (!dirty) {
        return;
      }
      autoSaveTimerRef.current = setTimeout(() => {
        autoSaveTimerRef.current = null;
        const latest = autoSaveOptionsRef.current;
        if (!latest) {
          return;
        }
        if (latest.isBlockedRef.current) {
          return;
        }
        const snapNow = getEditorSnapshot(editor);
        if (snapNow === lastSavedRef.current) {
          return;
        }
        void latest.onSave();
      }, opts.delayMs);
    };
    editor.on("update", handleUpdate);
    return () => {
      editor.off("update", handleUpdate);
      clearAutoSaveTimer();
    };
  }, [editor]);

  return { isDirty, setIsDirty, markEditorAsSaved };
}
