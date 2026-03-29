import { EditorContent, type Editor } from "@tiptap/react";
import type { ReactNode } from "react";
import type { ContentType, ToolbarPosition } from "../types";
import { LinkedInPostPreview } from "./LinkedInPostPreview";

type EditorWorkspaceProps = {
  toolbarPosition: ToolbarPosition;
  toolbar: ReactNode;
  editor: Editor | null;
  contentType: ContentType;
};

export function EditorWorkspace({ toolbarPosition, toolbar, editor, contentType }: EditorWorkspaceProps) {
  const isTopToolbar = toolbarPosition === "top";
  const isLinkedInPreview = contentType === "social";

  return (
    <section className={`editor-layout ${isTopToolbar ? "is-top" : "is-side"}`}>
      <aside className={`editor-toolbar-float ${isTopToolbar ? "is-top" : "is-side"}`} aria-label="Editor formatting toolbar">
        {toolbar}
      </aside>

      <div className={`editor-workspace ${isLinkedInPreview ? "editor-workspace--linkedin" : ""}`}>
        <div className={`editor-surface ${isLinkedInPreview ? "editor-surface--linkedin" : ""}`}>
          {isLinkedInPreview ? <LinkedInPostPreview editor={editor} /> : <EditorContent editor={editor} />}
        </div>
      </div>
    </section>
  );
}
