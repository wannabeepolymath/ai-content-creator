import { useEffect, useState } from "react";
import type { Editor } from "@tiptap/react";

/** Bumps on every editor transaction so toolbar isActive / can() stay in sync with selection. */
export function useToolbarTransactionRevision(editor: Editor | null) {
  const [, setToolbarRevision] = useState(0);

  useEffect(() => {
    if (!editor) {
      return;
    }
    const refreshToolbar = () => {
      setToolbarRevision((n) => n + 1);
    };
    editor.on("transaction", refreshToolbar);
    return () => {
      editor.off("transaction", refreshToolbar);
    };
  }, [editor]);
}
