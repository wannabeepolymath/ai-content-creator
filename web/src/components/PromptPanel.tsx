import type { ChangeEvent, Dispatch, RefObject, SetStateAction } from "react";
import { IconChevronDown } from "../toolbar-icons";
import { CONTENT_TYPE_OPTIONS, type ContentType, type ReferenceFileDraft } from "../types";

function formatFileSize(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export type PromptPanelProps = {
  contentType: ContentType;
  setContentType: Dispatch<SetStateAction<ContentType>>;
  contentTypeMenuRef: RefObject<HTMLDivElement | null>;
  contentTypeMenuOpen: boolean;
  setContentTypeMenuOpen: Dispatch<SetStateAction<boolean>>;
  prompt: string;
  setPrompt: Dispatch<SetStateAction<string>>;
  context: string;
  setContext: Dispatch<SetStateAction<string>>;
  isContextVisible: boolean;
  referenceFileInputRef: RefObject<HTMLInputElement | null>;
  referenceFiles: ReferenceFileDraft[];
  openReferenceFilePicker: () => void;
  handleReferenceFilesSelected: (event: ChangeEvent<HTMLInputElement>) => void;
  removeReferenceFile: (id: string) => void;
  revealContext: () => void;
  removeContext: () => void;
  isGenerating: boolean;
  canGenerate: boolean;
  handleGenerateButtonClick: () => void;
  status: string;
};

export function PromptPanel({
  contentType,
  setContentType,
  contentTypeMenuRef,
  contentTypeMenuOpen,
  setContentTypeMenuOpen,
  prompt,
  setPrompt,
  context,
  setContext,
  isContextVisible,
  referenceFileInputRef,
  referenceFiles,
  openReferenceFilePicker,
  handleReferenceFilesSelected,
  removeReferenceFile,
  revealContext,
  removeContext,
  isGenerating,
  canGenerate,
  handleGenerateButtonClick,
  status,
}: PromptPanelProps) {
  return (
    <section className="prompt-section">
      <div className="prompt-card">
        <div className="prompt-card-meta">
          <div className="prompt-card-controls">
            <label className="prompt-select-inline">
              <span className="prompt-select-label">Content type</span>
              <span className="prompt-select-wrap" ref={contentTypeMenuRef}>
                <button
                  type="button"
                  className={`prompt-select-trigger ${contentTypeMenuOpen ? "is-open" : ""}`}
                  onClick={() => setContentTypeMenuOpen((open) => !open)}
                  aria-haspopup="listbox"
                  aria-expanded={contentTypeMenuOpen}
                >
                  <span>{CONTENT_TYPE_OPTIONS.find((option) => option.value === contentType)?.label ?? "Blog Post"}</span>
                  <IconChevronDown className="prompt-select-chevron" />
                </button>
                {contentTypeMenuOpen ? (
                  <div className="prompt-select-dropdown" role="listbox" aria-label="Content type">
                    {CONTENT_TYPE_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        role="option"
                        aria-selected={contentType === option.value}
                        className={`prompt-select-option ${contentType === option.value ? "is-active" : ""}`}
                        onClick={() => {
                          setContentType(option.value);
                          setContentTypeMenuOpen(false);
                        }}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                ) : null}
              </span>
            </label>
          </div>
        </div>

        <label className="prompt-field">
          <span>Prompt</span>
          <textarea
            rows={5}
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder="Describe the content you want to create..."
          />
        </label>

        {referenceFiles.length > 0 ? (
          <div className="reference-files-panel">
            <div className="reference-files-header">
              <span>Reference files</span>
              <span>{referenceFiles.length} attached</span>
            </div>

            <div className="reference-files-list">
              {referenceFiles.map((referenceFile) => (
                <div key={referenceFile.id} className="reference-file-chip">
                  <div className="reference-file-meta">
                    <span className="reference-file-name">{referenceFile.file.name}</span>
                    <span className="reference-file-size">{formatFileSize(referenceFile.file.size)}</span>
                  </div>
                  <button
                    type="button"
                    className="reference-file-remove"
                    onClick={() => removeReferenceFile(referenceFile.id)}
                    aria-label={`Remove ${referenceFile.file.name}`}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div className={`context-panel ${isContextVisible ? "is-visible" : ""}`} aria-hidden={!isContextVisible}>
          <div className="context-panel-inner">
            <div className="context-panel-header">
              <span>Context</span>
              <button type="button" className="context-remove-button" onClick={removeContext}>
                Remove
              </button>
            </div>

            <textarea
              rows={4}
              value={context}
              onChange={(event) => setContext(event.target.value)}
              placeholder="Add context for the AI..."
            />
          </div>
        </div>

        <div className="prompt-footer">
          <div className="prompt-actions-row">
            <input
              ref={referenceFileInputRef}
              className="visually-hidden"
              type="file"
              accept=".txt,.md,.mdx,.markdown,application/pdf,text/plain,text/markdown"
              multiple
              onChange={handleReferenceFilesSelected}
            />
            <button type="button" className="secondary-button context-toggle-button" onClick={openReferenceFilePicker}>
              Attach File
            </button>
            {!isContextVisible ? (
              <button type="button" className="secondary-button context-toggle-button" onClick={revealContext}>
                + Context
              </button>
            ) : (
              <span className="prompt-actions-spacer" aria-hidden />
            )}
            <button
              type="button"
              className={`primary-button generate-button ${isGenerating ? "is-stop" : ""}`}
              onClick={handleGenerateButtonClick}
              disabled={isGenerating ? false : !canGenerate}
            >
              {isGenerating ? "Stop" : "Generate"}
            </button>
          </div>
          <p className="status">{status}</p>
        </div>
      </div>
    </section>
  );
}
