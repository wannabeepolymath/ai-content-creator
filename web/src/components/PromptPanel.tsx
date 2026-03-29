import type { Dispatch, RefObject, SetStateAction } from "react";
import { IconChevronDown } from "../toolbar-icons";
import { CONTENT_TYPE_OPTIONS, type ContentType } from "../types";

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
  revealContext: () => void;
  removeContext: () => void;
  canSave: boolean;
  saveSnapshot: () => void | Promise<unknown>;
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
  revealContext,
  removeContext,
  canSave,
  saveSnapshot,
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

            <button type="button" className="secondary-button save-button-inline" onClick={() => void saveSnapshot()} disabled={!canSave}>
              Save
            </button>
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
