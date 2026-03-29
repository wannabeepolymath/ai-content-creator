import { EditorContent, type Editor } from "@tiptap/react";

type LinkedInPostPreviewProps = {
  editor: Editor | null;
};

export function LinkedInPostPreview({ editor }: LinkedInPostPreviewProps) {
  return (
    <div className="linkedin-preview-shell">
      <div className="linkedin-preview-card">
        <div className="linkedin-preview-header">
          <div className="linkedin-preview-avatar-wrap" aria-hidden="true">
            <div className="linkedin-preview-avatar" />
            <span className="linkedin-preview-badge">in</span>
          </div>

          <div className="linkedin-preview-author">
            <p className="linkedin-preview-name">Daksh Jain</p>
            <p className="linkedin-preview-role">Founder @universe</p>
            <p className="linkedin-preview-time">Now</p>
          </div>
        </div>

        <div className="linkedin-preview-body">
          <EditorContent editor={editor} />
        </div>

        <div className="linkedin-preview-social-proof">
          <div className="linkedin-preview-reactions" aria-hidden="true">
            <span className="linkedin-preview-reaction linkedin-preview-reaction--like" />
            <span className="linkedin-preview-reaction linkedin-preview-reaction--celebrate" />
            <span className="linkedin-preview-reaction linkedin-preview-reaction--support" />
          </div>
          <span className="linkedin-preview-meta-text">John Doe and 169 others</span>
          <span className="linkedin-preview-meta-separator" aria-hidden="true" />
          <span className="linkedin-preview-meta-text">4 comments</span>
          <span className="linkedin-preview-meta-separator" aria-hidden="true" />
          <span className="linkedin-preview-meta-text">1 repost</span>
        </div>

        <div className="linkedin-preview-actions" aria-label="LinkedIn post actions preview">
          <button type="button" className="linkedin-preview-action" tabIndex={-1}>
            Like
          </button>
          <button type="button" className="linkedin-preview-action" tabIndex={-1}>
            Comment
          </button>
          <button type="button" className="linkedin-preview-action" tabIndex={-1}>
            Repost
          </button>
          <button type="button" className="linkedin-preview-action" tabIndex={-1}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
