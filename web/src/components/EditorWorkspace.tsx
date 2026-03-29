import { EditorContent, type Editor } from "@tiptap/react";
import type { ReactNode } from "react";
import type { ToolbarPosition } from "../types";

type EditorWorkspaceProps = {
  toolbarPosition: ToolbarPosition;
  toolbar: ReactNode;
  editor: Editor | null;
};

export function EditorWorkspace({ toolbarPosition, toolbar, editor }: EditorWorkspaceProps) {
  const isTopToolbar = toolbarPosition === "top";

  return (
    <section className={`editor-layout ${isTopToolbar ? "is-top" : "is-side"}`}>
      <aside className={`editor-toolbar-float ${isTopToolbar ? "is-top" : "is-side"}`} aria-label="Editor formatting toolbar">
        {toolbar}
      </aside>

      <div className="editor-workspace">
        <div className="editor-surface">
          <EditorContent editor={editor} />
        </div>
      </div>
    </section>
  );
}
