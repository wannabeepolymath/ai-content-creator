import type { ChangeEvent, Dispatch, KeyboardEvent, MutableRefObject, RefObject, SetStateAction } from "react";
import type { Editor } from "@tiptap/react";
import {
  IconAlignCenter,
  IconAlignJustify,
  IconAlignLeft,
  IconAlignRight,
  IconBlockquote,
  IconBold,
  IconChevronDown,
  IconClearFormat,
  IconCodeBlock,
  IconCodeInline,
  IconColMinus,
  IconColPlus,
  IconExternalLink,
  IconHighlight,
  IconHighlightNone,
  IconHorizontalRule,
  IconImageAdd,
  IconItalic,
  IconLink,
  IconLinkApply,
  IconListBulleted,
  IconListNumbered,
  IconListTask,
  IconRedo,
  IconRowMinus,
  IconRowPlus,
  IconStrikethrough,
  IconSubscript,
  IconSuperscript,
  IconTable,
  IconTrash,
  IconUnderline,
  IconUndo,
} from "../toolbar-icons";
import { HIGHLIGHT_COLORS } from "../constants";
import { restoreLinkSelection } from "../lib/link";

const headingLevels = [1, 2, 3, 4] as const;

export type EditorToolbarProps = {
  editor: Editor | null;
  isTopToolbar: boolean;
  toggleToolbarPosition: () => void;
  canUndo: boolean;
  canRedo: boolean;
  headingMenuRef: RefObject<HTMLDivElement | null>;
  listMenuRef: RefObject<HTMLDivElement | null>;
  highlightMenuRef: RefObject<HTMLDivElement | null>;
  tableMenuRef: RefObject<HTMLDivElement | null>;
  linkPopoverRef: RefObject<HTMLDivElement | null>;
  headingMenuOpen: boolean;
  setHeadingMenuOpen: Dispatch<SetStateAction<boolean>>;
  listMenuOpen: boolean;
  setListMenuOpen: Dispatch<SetStateAction<boolean>>;
  highlightMenuOpen: boolean;
  setHighlightMenuOpen: Dispatch<SetStateAction<boolean>>;
  tableMenuOpen: boolean;
  setTableMenuOpen: Dispatch<SetStateAction<boolean>>;
  linkPopoverOpen: boolean;
  setLinkPopoverOpen: Dispatch<SetStateAction<boolean>>;
  linkInputRef: RefObject<HTMLInputElement | null>;
  imageFileInputRef: RefObject<HTMLInputElement | null>;
  linkUrlDraft: string;
  setLinkUrlDraft: Dispatch<SetStateAction<string>>;
  handleLinkInputKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  canInsertTable: boolean;
  canAddRow: boolean;
  canDeleteRow: boolean;
  canAddColumn: boolean;
  canDeleteColumn: boolean;
  canDeleteTable: boolean;
  canToggleBold: boolean;
  canToggleItalic: boolean;
  canToggleUnderline: boolean;
  canToggleStrike: boolean;
  canToggleCode: boolean;
  canToggleSuperscript: boolean;
  canToggleSubscript: boolean;
  isLinkActive: boolean;
  insertTable: () => void;
  toggleLinkPopover: () => void;
  applyLinkFromPopover: () => void;
  openLinkFromPopover: () => void;
  clearLinkFromPopover: () => void;
  openImageFilePicker: () => void;
  handleImageFileSelected: (event: ChangeEvent<HTMLInputElement>) => void;
  highlightSelectionRef: MutableRefObject<{ from: number; to: number } | null>;
  linkSelectionRef: MutableRefObject<{ from: number; to: number } | null>;
};

export function EditorToolbar({
  editor,
  isTopToolbar,
  toggleToolbarPosition,
  canUndo,
  canRedo,
  headingMenuRef,
  listMenuRef,
  highlightMenuRef,
  tableMenuRef,
  linkPopoverRef,
  headingMenuOpen,
  setHeadingMenuOpen,
  listMenuOpen,
  setListMenuOpen,
  highlightMenuOpen,
  setHighlightMenuOpen,
  tableMenuOpen,
  setTableMenuOpen,
  linkPopoverOpen,
  setLinkPopoverOpen,
  linkInputRef,
  imageFileInputRef,
  linkUrlDraft,
  setLinkUrlDraft,
  handleLinkInputKeyDown,
  canInsertTable,
  canAddRow,
  canDeleteRow,
  canAddColumn,
  canDeleteColumn,
  canDeleteTable,
  canToggleBold,
  canToggleItalic,
  canToggleUnderline,
  canToggleStrike,
  canToggleCode,
  canToggleSuperscript,
  canToggleSubscript,
  isLinkActive,
  insertTable,
  toggleLinkPopover,
  applyLinkFromPopover,
  openLinkFromPopover,
  clearLinkFromPopover,
  openImageFilePicker,
  handleImageFileSelected,
  highlightSelectionRef,
  linkSelectionRef,
}: EditorToolbarProps) {
  return (
    <>
      <div className="editor-toolbar">
        <div className="toolbar-group toolbar-group--layout">
          <button
            type="button"
            className="toolbar-button toolbar-layout-toggle"
            onClick={toggleToolbarPosition}
            title={isTopToolbar ? "Move toolbar to the left of the editor" : "Move toolbar above the editor"}
            aria-label={isTopToolbar ? "Move toolbar to the left of the editor" : "Move toolbar above the editor"}
          >
            <span className="toolbar-layout-toggle-label">{isTopToolbar ? "Left" : "Top"}</span>
          </button>
        </div>
        <div className="toolbar-group">
          <button
            type="button"
            className="toolbar-button"
            onClick={() => editor?.chain().focus().undo().run()}
            disabled={!canUndo}
            title="Undo"
          >
            <IconUndo />
          </button>
          <button
            type="button"
            className="toolbar-button"
            onClick={() => editor?.chain().focus().redo().run()}
            disabled={!canRedo}
            title="Redo"
          >
            <IconRedo />
          </button>
        </div>

        <div className="toolbar-group">
          <div className="toolbar-heading-wrap" ref={headingMenuRef}>
            <button
              type="button"
              className={`toolbar-button toolbar-heading-trigger ${editor?.isActive("heading") || headingMenuOpen ? "is-active" : ""}`}
              onClick={() => {
                setListMenuOpen(false);
                setTableMenuOpen(false);
                setHeadingMenuOpen((open) => !open);
              }}
              title="Headings"
              aria-expanded={headingMenuOpen}
              aria-haspopup="listbox"
            >
              <span className="toolbar-heading-trigger-inner" aria-hidden>
                <span className="toolbar-heading-trigger-h">H</span>
                <IconChevronDown className="toolbar-icon toolbar-heading-chevron" />
              </span>
            </button>
            {headingMenuOpen ? (
              <div className="heading-dropdown" role="listbox" aria-label="Heading level">
                {headingLevels.map((level) => (
                  <button
                    key={level}
                    type="button"
                    role="option"
                    aria-selected={editor?.isActive("heading", { level })}
                    className={`heading-dropdown-item ${editor?.isActive("heading", { level }) ? "is-active" : ""}`}
                    onClick={() => {
                      editor?.chain().focus().toggleHeading({ level }).run();
                      setHeadingMenuOpen(false);
                    }}
                  >
                    <span className={`heading-dropdown-badge heading-dropdown-badge--${level}`} aria-hidden>
                      H
                      <sub>{level}</sub>
                    </span>
                    <span className="heading-dropdown-label">Heading {level}</span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          <div className="toolbar-list-wrap" ref={listMenuRef}>
            <button
              type="button"
              className={`toolbar-button toolbar-list-trigger ${editor?.isActive("bulletList") || editor?.isActive("orderedList") || editor?.isActive("taskList") || listMenuOpen ? "is-active" : ""}`}
              onClick={() => {
                setHeadingMenuOpen(false);
                setTableMenuOpen(false);
                setListMenuOpen((open) => !open);
              }}
              title="Lists"
              aria-expanded={listMenuOpen}
              aria-haspopup="listbox"
            >
              <span className="toolbar-list-trigger-inner" aria-hidden>
                <IconListBulleted />
                <IconChevronDown className="toolbar-icon toolbar-list-chevron" />
              </span>
            </button>
            {listMenuOpen ? (
              <div className="list-dropdown" role="listbox" aria-label="List type">
                <button
                  type="button"
                  role="option"
                  aria-selected={editor?.isActive("bulletList")}
                  className={`list-dropdown-item ${editor?.isActive("bulletList") ? "is-active" : ""}`}
                  onClick={() => {
                    editor?.chain().focus().toggleBulletList().run();
                    setListMenuOpen(false);
                  }}
                >
                  <span className="list-dropdown-item-icon">
                    <IconListBulleted />
                  </span>
                  <span className="list-dropdown-item-label">Bullet list</span>
                </button>
                <button
                  type="button"
                  role="option"
                  aria-selected={editor?.isActive("orderedList")}
                  className={`list-dropdown-item ${editor?.isActive("orderedList") ? "is-active" : ""}`}
                  onClick={() => {
                    editor?.chain().focus().toggleOrderedList().run();
                    setListMenuOpen(false);
                  }}
                >
                  <span className="list-dropdown-item-icon">
                    <IconListNumbered />
                  </span>
                  <span className="list-dropdown-item-label">Ordered list</span>
                </button>
                <button
                  type="button"
                  role="option"
                  aria-selected={editor?.isActive("taskList")}
                  className={`list-dropdown-item ${editor?.isActive("taskList") ? "is-active" : ""}`}
                  onClick={() => {
                    editor?.chain().focus().toggleTaskList().run();
                    setListMenuOpen(false);
                  }}
                >
                  <span className="list-dropdown-item-icon">
                    <IconListTask />
                  </span>
                  <span className="list-dropdown-item-label">Task list</span>
                </button>
              </div>
            ) : null}
          </div>
          <button
            type="button"
            className={`toolbar-button ${editor?.isActive("blockquote") ? "is-active" : ""}`}
            onClick={() => editor?.chain().focus().toggleBlockquote().run()}
            title="Blockquote"
          >
            <IconBlockquote />
          </button>
          <button
            type="button"
            className={`toolbar-button ${editor?.isActive("codeBlock") ? "is-active" : ""}`}
            onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
            title="Code block"
          >
            <IconCodeBlock />
          </button>
        </div>

        <div className="toolbar-group">
          <button
            type="button"
            className={`toolbar-button ${editor?.isActive("bold") ? "is-active" : ""}`}
            onClick={() => editor?.chain().focus().toggleBold().run()}
            disabled={!canToggleBold}
            title="Bold"
          >
            <IconBold />
          </button>
          <button
            type="button"
            className={`toolbar-button ${editor?.isActive("italic") ? "is-active" : ""}`}
            onClick={() => editor?.chain().focus().toggleItalic().run()}
            disabled={!canToggleItalic}
            title="Italic"
          >
            <IconItalic />
          </button>
          <button
            type="button"
            className={`toolbar-button ${editor?.isActive("underline") ? "is-active" : ""}`}
            onClick={() => editor?.chain().focus().toggleUnderline().run()}
            disabled={!canToggleUnderline}
            title="Underline"
          >
            <IconUnderline />
          </button>
          <button
            type="button"
            className={`toolbar-button ${editor?.isActive("strike") ? "is-active" : ""}`}
            onClick={() => editor?.chain().focus().toggleStrike().run()}
            disabled={!canToggleStrike}
            title="Strikethrough"
          >
            <IconStrikethrough />
          </button>
          <div className="toolbar-highlight-wrap" ref={highlightMenuRef}>
            <button
              type="button"
              className={`toolbar-button toolbar-highlight-trigger ${editor?.isActive("highlight") || highlightMenuOpen ? "is-active" : ""}`}
              onMouseDown={(event) => {
                if (!editor || event.button !== 0) {
                  return;
                }
                event.preventDefault();
                const { from, to } = editor.state.selection;
                highlightSelectionRef.current = { from, to };
              }}
              onClick={() => {
                setTableMenuOpen(false);
                setHighlightMenuOpen((open) => !open);
              }}
              title="Highlight"
              aria-expanded={highlightMenuOpen}
              aria-haspopup="listbox"
              aria-label="Highlight"
            >
              <span className="toolbar-highlight-trigger-inner" aria-hidden>
                <IconHighlight />
                <IconChevronDown className="toolbar-icon toolbar-highlight-chevron" />
              </span>
            </button>
            {highlightMenuOpen ? (
              <div className="highlight-dropdown" role="listbox" aria-label="Highlight color">
                <div className="highlight-dropdown-swatches" role="presentation">
                  {HIGHLIGHT_COLORS.map(({ label, color }) => (
                    <button
                      key={color}
                      type="button"
                      role="option"
                      aria-selected={editor?.isActive("highlight", { color })}
                      className={`highlight-swatch ${editor?.isActive("highlight", { color }) ? "is-active" : ""}`}
                      style={{ backgroundColor: color }}
                      title={label}
                      onMouseDown={(event) => {
                        event.preventDefault();
                      }}
                      onClick={() => {
                        if (!editor) {
                          return;
                        }
                        restoreLinkSelection(editor, highlightSelectionRef.current);
                        editor.chain().focus().setHighlight({ color }).run();
                        highlightSelectionRef.current = null;
                        setHighlightMenuOpen(false);
                      }}
                    />
                  ))}
                </div>
                <span className="highlight-dropdown-divider" aria-hidden />
                <button
                  type="button"
                  className="highlight-dropdown-clear"
                  title="Remove highlight"
                  onMouseDown={(event) => {
                    event.preventDefault();
                  }}
                  onClick={() => {
                    if (!editor) {
                      return;
                    }
                    restoreLinkSelection(editor, highlightSelectionRef.current);
                    editor.chain().focus().unsetHighlight().run();
                    highlightSelectionRef.current = null;
                    setHighlightMenuOpen(false);
                  }}
                >
                  <IconHighlightNone className="toolbar-icon" />
                </button>
              </div>
            ) : null}
          </div>
          <button
            type="button"
            className={`toolbar-button ${editor?.isActive("code") ? "is-active" : ""}`}
            onClick={() => editor?.chain().focus().toggleCode().run()}
            disabled={!canToggleCode}
            title="Inline code"
          >
            <IconCodeInline />
          </button>
          <span className="toolbar-separator" aria-hidden />
          <button
            type="button"
            className={`toolbar-button ${editor?.isActive("superscript") ? "is-active" : ""}`}
            onClick={() => editor?.chain().focus().toggleSuperscript().run()}
            disabled={!canToggleSuperscript}
            title="Superscript"
          >
            <IconSuperscript />
          </button>
          <button
            type="button"
            className={`toolbar-button ${editor?.isActive("subscript") ? "is-active" : ""}`}
            onClick={() => editor?.chain().focus().toggleSubscript().run()}
            disabled={!canToggleSubscript}
            title="Subscript"
          >
            <IconSubscript />
          </button>
        </div>

        <div className="toolbar-group">
          <button
            type="button"
            className={`toolbar-button ${editor?.isActive({ textAlign: "left" }) ? "is-active" : ""}`}
            onClick={() => editor?.chain().focus().setTextAlign("left").run()}
            title="Align left"
          >
            <IconAlignLeft />
          </button>
          <button
            type="button"
            className={`toolbar-button ${editor?.isActive({ textAlign: "center" }) ? "is-active" : ""}`}
            onClick={() => editor?.chain().focus().setTextAlign("center").run()}
            title="Align center"
          >
            <IconAlignCenter />
          </button>
          <button
            type="button"
            className={`toolbar-button ${editor?.isActive({ textAlign: "right" }) ? "is-active" : ""}`}
            onClick={() => editor?.chain().focus().setTextAlign("right").run()}
            title="Align right"
          >
            <IconAlignRight />
          </button>
          <button
            type="button"
            className={`toolbar-button ${editor?.isActive({ textAlign: "justify" }) ? "is-active" : ""}`}
            onClick={() => editor?.chain().focus().setTextAlign("justify").run()}
            title="Justify"
          >
            <IconAlignJustify />
          </button>
        </div>

        <div className="toolbar-group">
          <div className="toolbar-link-wrap" ref={linkPopoverRef}>
            <button
              type="button"
              className={`toolbar-button ${isLinkActive || linkPopoverOpen ? "is-active" : ""}`}
              onMouseDown={(event) => {
                if (!editor || linkPopoverOpen) {
                  return;
                }
                if (event.button !== 0) {
                  return;
                }
                const { from, to } = editor.state.selection;
                linkSelectionRef.current = { from, to };
              }}
              onClick={toggleLinkPopover}
              title="Link"
              aria-expanded={linkPopoverOpen}
              aria-haspopup="dialog"
            >
              <IconLink />
            </button>
            {linkPopoverOpen ? (
              <div className="link-popover" role="dialog" aria-label="Edit link">
                <input
                  ref={linkInputRef}
                  type="url"
                  className="link-popover-input"
                  placeholder="Paste a link..."
                  value={linkUrlDraft}
                  onChange={(event) => setLinkUrlDraft(event.target.value)}
                  onKeyDown={handleLinkInputKeyDown}
                />
                <span className="link-popover-divider" aria-hidden />
                <div className="link-popover-actions">
                  <button type="button" className="link-popover-icon-btn" onClick={applyLinkFromPopover} title="Apply link">
                    <IconLinkApply className="toolbar-icon" />
                  </button>
                  <button
                    type="button"
                    className="link-popover-icon-btn"
                    onClick={openLinkFromPopover}
                    disabled={!linkUrlDraft.trim() && !isLinkActive}
                    title="Open in new tab"
                  >
                    <IconExternalLink className="toolbar-icon" />
                  </button>
                  <button type="button" className="link-popover-icon-btn" onClick={clearLinkFromPopover} title="Remove link">
                    <IconTrash className="toolbar-icon" />
                  </button>
                </div>
              </div>
            ) : null}
          </div>
          <button type="button" className="toolbar-button" onClick={openImageFilePicker} title="Insert image from file">
            <IconImageAdd />
          </button>
          <div className="toolbar-table-wrap" ref={tableMenuRef}>
            <button
              type="button"
              className={`toolbar-button toolbar-table-trigger ${editor?.isActive("table") || tableMenuOpen ? "is-active" : ""}`}
              onClick={() => {
                setHeadingMenuOpen(false);
                setListMenuOpen(false);
                setHighlightMenuOpen(false);
                setTableMenuOpen((open) => !open);
              }}
              title="Table"
              aria-expanded={tableMenuOpen}
              aria-haspopup="listbox"
              aria-label="Table"
            >
              <span className="toolbar-table-trigger-inner" aria-hidden>
                <IconTable />
                <IconChevronDown className="toolbar-icon toolbar-table-chevron" />
              </span>
            </button>
            {tableMenuOpen ? (
              <div className="table-dropdown" role="listbox" aria-label="Table actions">
                <button
                  type="button"
                  role="option"
                  className="table-dropdown-item"
                  disabled={!canInsertTable}
                  onClick={() => insertTable()}
                >
                  <span className="table-dropdown-item-icon">
                    <IconTable />
                  </span>
                  <span className="table-dropdown-item-label">Insert table</span>
                </button>
                <div className="table-dropdown-divider" role="separator" />
                <button
                  type="button"
                  role="option"
                  className="table-dropdown-item"
                  disabled={!canAddRow}
                  onClick={() => editor?.chain().focus().addRowAfter().run()}
                >
                  <span className="table-dropdown-item-icon">
                    <IconRowPlus />
                  </span>
                  <span className="table-dropdown-item-label">Add row</span>
                </button>
                <button
                  type="button"
                  role="option"
                  className="table-dropdown-item"
                  disabled={!canDeleteRow}
                  onClick={() => editor?.chain().focus().deleteRow().run()}
                >
                  <span className="table-dropdown-item-icon">
                    <IconRowMinus />
                  </span>
                  <span className="table-dropdown-item-label">Delete row</span>
                </button>
                <button
                  type="button"
                  role="option"
                  className="table-dropdown-item"
                  disabled={!canAddColumn}
                  onClick={() => editor?.chain().focus().addColumnAfter().run()}
                >
                  <span className="table-dropdown-item-icon">
                    <IconColPlus />
                  </span>
                  <span className="table-dropdown-item-label">Add column</span>
                </button>
                <button
                  type="button"
                  role="option"
                  className="table-dropdown-item"
                  disabled={!canDeleteColumn}
                  onClick={() => editor?.chain().focus().deleteColumn().run()}
                >
                  <span className="table-dropdown-item-icon">
                    <IconColMinus />
                  </span>
                  <span className="table-dropdown-item-label">Delete column</span>
                </button>
                <button
                  type="button"
                  role="option"
                  className="table-dropdown-item table-dropdown-item--danger"
                  disabled={!canDeleteTable}
                  onClick={() => editor?.chain().focus().deleteTable().run()}
                >
                  <span className="table-dropdown-item-icon">
                    <IconTrash />
                  </span>
                  <span className="table-dropdown-item-label">Delete table</span>
                </button>
              </div>
            ) : null}
          </div>
          <button
            type="button"
            className="toolbar-button"
            onClick={() => editor?.chain().focus().setHorizontalRule().run()}
            title="Horizontal rule"
          >
            <IconHorizontalRule />
          </button>
          <button
            type="button"
            className="toolbar-button"
            onClick={() => editor?.chain().focus().unsetAllMarks().clearNodes().run()}
            title="Clear formatting"
          >
            <IconClearFormat />
          </button>
        </div>
      </div>
      <input
        ref={imageFileInputRef}
        type="file"
        className="visually-hidden"
        accept="image/*"
        aria-hidden
        tabIndex={-1}
        onChange={handleImageFileSelected}
      />
    </>
  );
}
