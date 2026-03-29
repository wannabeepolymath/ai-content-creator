import { useEffect, useRef, useState } from "react";
import type { Editor } from "@tiptap/react";
import { getEditorSnapshot } from "../lib/editor-snapshot";

export function useEditorDirtyTracking(editor: Editor | null) {
  const [isDirty, setIsDirty] = useState(false);
  const lastSavedRef = useRef("");

  function markEditorAsSaved(editorInstance: Editor) {
    lastSavedRef.current = getEditorSnapshot(editorInstance);
    setIsDirty(false);
  }

  useEffect(() => {
    if (!editor) {
      return;
    }
    lastSavedRef.current = getEditorSnapshot(editor);
    setIsDirty(false);
  }, [editor]);

  useEffect(() => {
    if (!editor) {
      return;
    }
    const handleUpdate = () => {
      const snapshot = getEditorSnapshot(editor);
      setIsDirty(snapshot !== lastSavedRef.current);
    };
    editor.on("update", handleUpdate);
    return () => {
      editor.off("update", handleUpdate);
    };
  }, [editor]);

  return { isDirty, setIsDirty, markEditorAsSaved };
}
