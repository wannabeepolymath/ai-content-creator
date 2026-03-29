import { useEffect, useMemo, useRef, useState, type ChangeEvent, type KeyboardEvent } from "react";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Highlight from "@tiptap/extension-highlight";
import Image, { type ImageOptions } from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import { Table, TableRow, TableHeader, TableCell } from "@tiptap/extension-table";
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
} from "./toolbar-icons";

type ContentType = "social" | "blog";
type ToolbarPosition = "side" | "top";

type TipTapNode = {
  type: string;
  attrs?: Record<string, unknown>;
  content?: TipTapNode[];
  text?: string;
};

type TipTapDoc = {
  type: "doc";
  content: TipTapNode[];
};

const CONTENT_TYPE_OPTIONS = [
  { value: "blog", label: "Blog Post" },
  { value: "social", label: "Linkedin Post" },
] as const satisfies ReadonlyArray<{ value: ContentType; label: string }>;

type StreamDelta = { type: "text"; value: string };

type StreamBlock =
  | { type: "paragraph_start" }
  | { type: "paragraph_end" }
  | { type: "heading_start"; level: number }
  | { type: "heading_end" }
  | { type: "bullet_list_start" }
  | { type: "bullet_list_end" }
  | { type: "ordered_list_start" }
  | { type: "ordered_list_end" }
  | { type: "list_item_start" }
  | { type: "list_item_end" }
  | { type: "image"; src: string; alt?: string };

const MIN_IMAGE_WIDTH = 120;

/** Horizontal drag on image (not resize handles): left = float left, right = float right. Vertical drag: clear float (block). */
const IMAGE_FLOAT_DRAG_H = 36;
const IMAGE_FLOAT_DRAG_V = 48;

const ResizableImage = Image.extend({
  draggable: false,

  addOptions(): ImageOptions {
    const parent = this.parent?.();
    return {
      inline: parent?.inline ?? false,
      allowBase64: parent?.allowBase64 ?? false,
      HTMLAttributes: parent?.HTMLAttributes ?? {},
      resize: {
        enabled: true,
        minWidth: MIN_IMAGE_WIDTH,
        minHeight: 8,
        alwaysPreserveAspectRatio: true,
      },
    };
  },
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        parseHTML: (element) => {
          const widthAttr = element.getAttribute("width") ?? element.style.width;
          if (!widthAttr) {
            return null;
          }
          const parsed = Number.parseInt(widthAttr, 10);
          return Number.isNaN(parsed) ? null : parsed;
        },
        renderHTML: (attributes) => {
          const styles: string[] = [];
          if (attributes.width) {
            styles.push(`width: ${attributes.width}px`);
          }
          return styles.length ? { style: `${styles.join("; ")};` } : {};
        },
      },
      float: {
        default: null,
        parseHTML: (element) => {
          const floatValue = element.style.cssFloat || element.style.float;
          return floatValue || null;
        },
        renderHTML: () => ({}),
      },
    };
  },

  addNodeView() {
    const parent = this.parent?.();
    if (typeof parent !== "function") {
      return null;
    }
    return (props) => {
      const nodeView = parent(props);
      const dom = nodeView.dom as HTMLElement;
      const img = dom.querySelector("img");
      if (!img) {
        return nodeView;
      }

      const applyFloatLayout = (node: (typeof props)["node"]) => {
        const f = node.attrs.float as string | null | undefined;
        if (f === "left" || f === "right") {
          dom.style.float = f;
          dom.style.display = "block";
          dom.style.width = "max-content";
          dom.style.maxWidth = "100%";
          img.style.float = "none";
        } else {
          dom.style.float = "";
          dom.style.display = "flex";
          dom.style.width = "";
          dom.style.maxWidth = "100%";
          img.style.float = "";
        }
      };

      applyFloatLayout(props.node);

      const origUpdate = nodeView.update;
      if (origUpdate) {
        nodeView.update = (node, decorations, innerDecorations) => {
          const ok = origUpdate.call(nodeView, node, decorations, innerDecorations);
          if (ok) {
            applyFloatLayout(node);
          }
          return ok;
        };
      }

      return nodeView;
    };
  },
});

const apiBase = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";

/** Pastel highlighter colors (TipTap multicolor highlight). */
const HIGHLIGHT_COLORS = [
  { label: "Green", color: "#bbf7d0" },
  { label: "Blue", color: "#bfdbfe" },
  { label: "Pink", color: "#fbcfe8" },
  { label: "Purple", color: "#e9d5ff" },
  { label: "Yellow", color: "#fef08a" },
] as const;

function normalizeLinkHref(raw: string): string {
  const t = raw.trim();
  if (!t) {
    return "";
  }
  if (/^https?:\/\//i.test(t) || /^mailto:/i.test(t) || /^tel:/i.test(t)) {
    return t;
  }
  return `https://${t}`;
}

function restoreLinkSelection(editor: Editor, saved: { from: number; to: number } | null) {
  if (!saved) {
    return;
  }
  const max = editor.state.doc.content.size;
  let from = Math.min(Math.max(0, saved.from), max);
  let to = Math.min(Math.max(0, saved.to), max);
  if (from > to) {
    [from, to] = [to, from];
  }
  editor.chain().focus().setTextSelection({ from, to }).run();
}

export function App() {
  const [prompt, setPrompt] = useState("");
  const [context, setContext] = useState("");
  const [showContext, setShowContext] = useState(false);
  const [contentType, setContentType] = useState<ContentType>("blog");
  const [toolbarPosition, setToolbarPosition] = useState<ToolbarPosition>("side");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [status, setStatus] = useState("Ready.");
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  /** Bumps on every editor transaction so toolbar isActive / can() stay in sync with selection. */
  const [, setToolbarRevision] = useState(0);
  const draftDocRef = useRef<TipTapDoc>({ type: "doc", content: [] });
  const lastSavedRef = useRef<string>("");
  const draftStateRef = useRef<{
    currentTextNodes: TipTapNode[] | null;
    activeBlock: "paragraph" | "heading" | "list_item" | null;
    currentList: TipTapNode | null;
  }>({ currentTextNodes: null, activeBlock: null, currentList: null });
  const imageFileInputRef = useRef<HTMLInputElement>(null);
  /** Pointer gesture on image body (not resize handles) to set float without toolbar. */
  const imageFloatGestureRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    pos: number;
  } | null>(null);
  const linkPopoverRef = useRef<HTMLDivElement>(null);
  const contentTypeMenuRef = useRef<HTMLDivElement>(null);
  const headingMenuRef = useRef<HTMLDivElement>(null);
  const highlightMenuRef = useRef<HTMLDivElement>(null);
  const listMenuRef = useRef<HTMLDivElement>(null);
  const tableMenuRef = useRef<HTMLDivElement>(null);
  const linkInputRef = useRef<HTMLInputElement>(null);
  /** Selection when the link popover was opened (URL input steals focus). */
  const linkSelectionRef = useRef<{ from: number; to: number } | null>(null);
  /** Selection when the highlight menu was opened (toolbar click blurs the editor). */
  const highlightSelectionRef = useRef<{ from: number; to: number } | null>(null);
  const [linkPopoverOpen, setLinkPopoverOpen] = useState(false);
  const [contentTypeMenuOpen, setContentTypeMenuOpen] = useState(false);
  const [headingMenuOpen, setHeadingMenuOpen] = useState(false);
  const [highlightMenuOpen, setHighlightMenuOpen] = useState(false);
  const [listMenuOpen, setListMenuOpen] = useState(false);
  const [tableMenuOpen, setTableMenuOpen] = useState(false);
  const [linkUrlDraft, setLinkUrlDraft] = useState("");

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4] },
      }),
      Underline,
      Subscript,
      Superscript,
      Link.configure({
        openOnClick: true,
        autolink: true,
        linkOnPaste: true,
        HTMLAttributes: {
          target: "_blank",
          rel: "noopener noreferrer",
        },
      }),
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      ResizableImage.configure({ allowBase64: true }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      TaskList,
      TaskItem.configure({ nested: true }),
    ],
    content: {
      type: "doc",
      content: [{ type: "paragraph", content: [{ type: "text", text: "" }] }],
    },
    editorProps: {
      attributes: {
        class: "editor-content",
      },
    },
  });

  const canGenerate = useMemo(
    () => prompt.trim().length > 0 && !isGenerating && !isSaving && !!editor,
    [prompt, isGenerating, isSaving, editor],
  );
  const canSave = useMemo(
    () => !isGenerating && !isSaving && !!editor && isDirty,
    [isGenerating, isSaving, editor, isDirty],
  );
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
  const headingLevels = [1, 2, 3, 4] as const;
  const isContextVisible = showContext || context.trim().length > 0;
  const isTopToolbar = toolbarPosition === "top";

  function getEditorSnapshot(editorInstance: Editor) {
    return JSON.stringify(editorInstance.getJSON());
  }

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

  useEffect(() => {
    if (!editor) {
      return;
    }
    const dom = editor.view.dom;
    function onPointerDownCapture(event: PointerEvent) {
      if ((event.target as HTMLElement).closest("[data-resize-handle]")) {
        imageFloatGestureRef.current = null;
      }
    }
    function onPointerDown(event: PointerEvent) {
      if (event.button !== 0) {
        return;
      }
      const target = event.target as HTMLElement;
      if (target.closest("[data-resize-handle]")) {
        return;
      }
      const container = target.closest("[data-resize-container]");
      if (!container || !dom.contains(container)) {
        return;
      }
      let pos: number;
      try {
        pos = editor.view.posAtDOM(container as Node, 0);
      } catch {
        return;
      }
      if (pos < 0) {
        return;
      }
      const $pos = editor.state.doc.resolve(pos);
      const node = $pos.nodeAfter;
      if (!node || node.type.name !== "image") {
        return;
      }
      imageFloatGestureRef.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        pos,
      };
    }
    function onPointerUp(event: PointerEvent) {
      const g = imageFloatGestureRef.current;
      if (!g || g.pointerId !== event.pointerId) {
        return;
      }
      imageFloatGestureRef.current = null;
      const dx = event.clientX - g.startX;
      const dy = event.clientY - g.startY;
      const horizontal = Math.abs(dx) > Math.abs(dy) && Math.abs(dx) >= IMAGE_FLOAT_DRAG_H;
      const verticalClear = Math.abs(dy) > Math.abs(dx) && Math.abs(dy) >= IMAGE_FLOAT_DRAG_V && Math.abs(dx) <= 20;
      if (horizontal) {
        editor.chain().focus().setNodeSelection(g.pos).updateAttributes("image", { float: dx > 0 ? "right" : "left" }).run();
      } else if (verticalClear) {
        editor.chain().focus().setNodeSelection(g.pos).updateAttributes("image", { float: null }).run();
      }
    }
    document.addEventListener("pointerdown", onPointerDownCapture, true);
    dom.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("pointerup", onPointerUp);
    return () => {
      document.removeEventListener("pointerdown", onPointerDownCapture, true);
      dom.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("pointerup", onPointerUp);
    };
  }, [editor]);

  useEffect(() => {
    if (!linkPopoverOpen) {
      return;
    }
    const id = requestAnimationFrame(() => {
      linkInputRef.current?.focus();
      linkInputRef.current?.select();
    });
    return () => cancelAnimationFrame(id);
  }, [linkPopoverOpen]);

  useEffect(() => {
    if (!linkPopoverOpen) {
      return;
    }
    function handlePointerDown(event: PointerEvent) {
      const el = linkPopoverRef.current;
      if (!el || el.contains(event.target as Node)) {
        return;
      }
      linkSelectionRef.current = null;
      setLinkPopoverOpen(false);
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [linkPopoverOpen]);

  useEffect(() => {
    if (!contentTypeMenuOpen) {
      return;
    }
    function handlePointerDown(event: PointerEvent) {
      const el = contentTypeMenuRef.current;
      if (!el || el.contains(event.target as Node)) {
        return;
      }
      setContentTypeMenuOpen(false);
    }
    function handleKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") {
        setContentTypeMenuOpen(false);
      }
    }
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [contentTypeMenuOpen]);

  useEffect(() => {
    if (!headingMenuOpen) {
      return;
    }
    function handlePointerDown(event: PointerEvent) {
      const el = headingMenuRef.current;
      if (!el || el.contains(event.target as Node)) {
        return;
      }
      setHeadingMenuOpen(false);
    }
    function handleKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") {
        setHeadingMenuOpen(false);
      }
    }
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [headingMenuOpen]);

  useEffect(() => {
    if (!highlightMenuOpen) {
      return;
    }
    function handlePointerDown(event: PointerEvent) {
      const el = highlightMenuRef.current;
      if (!el || el.contains(event.target as Node)) {
        return;
      }
      setHighlightMenuOpen(false);
    }
    function handleKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") {
        setHighlightMenuOpen(false);
      }
    }
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [highlightMenuOpen]);

  useEffect(() => {
    if (!listMenuOpen) {
      return;
    }
    function handlePointerDown(event: PointerEvent) {
      const el = listMenuRef.current;
      if (!el || el.contains(event.target as Node)) {
        return;
      }
      setListMenuOpen(false);
    }
    function handleKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") {
        setListMenuOpen(false);
      }
    }
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [listMenuOpen]);

  useEffect(() => {
    if (!tableMenuOpen) {
      return;
    }
    function handlePointerDown(event: PointerEvent) {
      const el = tableMenuRef.current;
      if (!el || el.contains(event.target as Node)) {
        return;
      }
      setTableMenuOpen(false);
    }
    function handleKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") {
        setTableMenuOpen(false);
      }
    }
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [tableMenuOpen]);

  async function saveSnapshot(options: {
    silent?: boolean;
    editorInstance?: Editor;
    conversationIdOverride?: string | null;
  } = {}) {
    const activeEditor = options.editorInstance ?? editor;
    if (!activeEditor) {
      return null;
    }
    const activeConversationId = options.conversationIdOverride ?? conversationId;
    setIsSaving(true);
    if (!options.silent) {
      setStatus("Saving...");
    }
    try {
      const response = await fetch(`${apiBase}/api/conversations/snapshot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: activeConversationId,
          tiptapJson: activeEditor.getJSON(),
          schemaVersion: 1,
        }),
      });
      if (!response.ok) {
        throw new Error(`Save failed: ${response.status}`);
      }
      const payload = (await response.json()) as { conversationId?: string };
      if (payload.conversationId) {
        setConversationId(payload.conversationId);
      }
      markEditorAsSaved(activeEditor);
      if (!options.silent) {
        setStatus("Saved.");
      }
      return payload.conversationId ?? activeConversationId;
    } catch (error) {
      if (!options.silent) {
        setStatus("Save failed.");
      }
      return null;
    } finally {
      setIsSaving(false);
    }
  }

  function resetDraftDoc() {
    draftDocRef.current = { type: "doc", content: [] };
    draftStateRef.current = { currentTextNodes: null, activeBlock: null, currentList: null };
  }

  function pushText(value: string) {
    if (!value) {
      return;
    }
    if (!draftStateRef.current.currentTextNodes) {
      applyBlock({ type: "paragraph_start" });
    }
    const target = draftStateRef.current.currentTextNodes!;
    const lastNode = target[target.length - 1];
    if (lastNode?.type === "text") {
      lastNode.text = `${lastNode.text ?? ""}${value}`;
      return;
    }
    target.push({ type: "text", text: value });
  }

  function applyBlock(block: StreamBlock) {
    switch (block.type) {
      case "paragraph_start": {
        const node: TipTapNode = { type: "paragraph", content: [] };
        draftDocRef.current.content.push(node);
        draftStateRef.current.currentTextNodes = node.content!;
        draftStateRef.current.activeBlock = "paragraph";
        break;
      }
      case "paragraph_end":
        if (draftStateRef.current.activeBlock === "paragraph") {
          draftStateRef.current.currentTextNodes = null;
          draftStateRef.current.activeBlock = null;
        }
        break;
      case "heading_start": {
        const node: TipTapNode = { type: "heading", attrs: { level: block.level }, content: [] };
        draftDocRef.current.content.push(node);
        draftStateRef.current.currentTextNodes = node.content!;
        draftStateRef.current.activeBlock = "heading";
        break;
      }
      case "heading_end":
        if (draftStateRef.current.activeBlock === "heading") {
          draftStateRef.current.currentTextNodes = null;
          draftStateRef.current.activeBlock = null;
        }
        break;
      case "bullet_list_start": {
        const node: TipTapNode = { type: "bulletList", content: [] };
        draftDocRef.current.content.push(node);
        draftStateRef.current.currentList = node;
        draftStateRef.current.currentTextNodes = null;
        draftStateRef.current.activeBlock = null;
        break;
      }
      case "ordered_list_start": {
        const node: TipTapNode = { type: "orderedList", content: [] };
        draftDocRef.current.content.push(node);
        draftStateRef.current.currentList = node;
        draftStateRef.current.currentTextNodes = null;
        draftStateRef.current.activeBlock = null;
        break;
      }
      case "list_item_start": {
        if (!draftStateRef.current.currentList) {
          applyBlock({ type: "bullet_list_start" });
        }
        const paragraph: TipTapNode = { type: "paragraph", content: [] };
        const listItem: TipTapNode = { type: "listItem", content: [paragraph] };
        draftStateRef.current.currentList!.content!.push(listItem);
        draftStateRef.current.currentTextNodes = paragraph.content!;
        draftStateRef.current.activeBlock = "list_item";
        break;
      }
      case "list_item_end":
        if (draftStateRef.current.activeBlock === "list_item") {
          draftStateRef.current.currentTextNodes = null;
          draftStateRef.current.activeBlock = null;
        }
        break;
      case "bullet_list_end":
      case "ordered_list_end":
        draftStateRef.current.currentList = null;
        draftStateRef.current.currentTextNodes = null;
        draftStateRef.current.activeBlock = null;
        break;
      case "image":
        draftDocRef.current.content.push({
          type: "image",
          attrs: { src: block.src, alt: block.alt ?? "", float: "left" },
        });
        draftStateRef.current.currentTextNodes = null;
        draftStateRef.current.activeBlock = null;
        break;
      default:
        break;
    }
  }

  function renderDraftDoc() {
    if (!editor) {
      return;
    }
    editor.commands.setContent(structuredClone(draftDocRef.current), { emitUpdate: false });
  }

  function parseSseFrames(buffer: string) {
    const parsed: Array<{ event: string; data: unknown }> = [];
    let nextBuffer = buffer;
    while (true) {
      const separatorIndex = nextBuffer.indexOf("\n\n");
      if (separatorIndex < 0) {
        break;
      }
      const frame = nextBuffer.slice(0, separatorIndex);
      nextBuffer = nextBuffer.slice(separatorIndex + 2);

      const lines = frame.split("\n");
      let eventName = "message";
      const dataLines: string[] = [];
      for (const line of lines) {
        if (line.startsWith("event:")) {
          eventName = line.slice(6).trim();
        }
        if (line.startsWith("data:")) {
          dataLines.push(line.slice(5).trim());
        }
      }

      if (dataLines.length === 0) {
        continue;
      }
      try {
        parsed.push({
          event: eventName,
          data: JSON.parse(dataLines.join("\n")),
        });
      } catch {
        continue;
      }
    }
    return { parsed, nextBuffer };
  }

  async function generateStream(overrideConversationId?: string | null) {
    if (!editor || !prompt.trim()) {
      return;
    }

    const activeConversationId = overrideConversationId ?? conversationId;
    const activeEditor = editor;
    if (overrideConversationId && overrideConversationId !== conversationId) {
      setConversationId(overrideConversationId);
    }

    const controller = new AbortController();
    setAbortController(controller);
    setIsGenerating(true);
    setStatus("Generating...");
    resetDraftDoc();
    renderDraftDoc();

    let finalStatus = "Done.";
    let generationCompleted = false;
    let receivedDraftContent = false;

    try {
      const response = await fetch(`${apiBase}/api/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, contentType, context, conversationId: activeConversationId }),
        signal: controller.signal,
      });

      if (!response.ok || !response.body) {
        throw new Error(`Server error: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const { parsed, nextBuffer } = parseSseFrames(buffer);
        buffer = nextBuffer;

        for (const evt of parsed) {
          if (evt.event === "delta") {
            const payload = evt.data as StreamDelta;
            if (payload.type === "text") {
              receivedDraftContent = true;
              pushText(payload.value);
              renderDraftDoc();
              setIsDirty(true);
            }
          }
          if (evt.event === "block") {
            const payload = evt.data as StreamBlock;
            receivedDraftContent = true;
            applyBlock(payload);
            renderDraftDoc();
            setIsDirty(true);
          }
          if (evt.event === "error") {
            const payload = evt.data as { message?: string };
            finalStatus = payload.message ?? "Generation failed.";
          }
          if (evt.event === "done") {
            const payload = evt.data as { ok?: boolean; conversationId?: string };
            if (payload.conversationId) {
              setConversationId(payload.conversationId);
            }
            generationCompleted = true;
            markEditorAsSaved(activeEditor);
            finalStatus = "Done.";
          }
        }
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        finalStatus = "Generation stopped.";
      } else {
        finalStatus = "Generation failed.";
      }
    } finally {
      if (!generationCompleted && receivedDraftContent) {
        const savedConversationId = await saveSnapshot({
          silent: true,
          editorInstance: activeEditor,
          conversationIdOverride: activeConversationId,
        });
        if (savedConversationId) {
          finalStatus = `${finalStatus} Progress saved.`;
        }
      }
      setAbortController(null);
      setIsGenerating(false);
      setStatus(finalStatus);
    }
  }

  async function saveAndGenerate() {
    const savedConversationId = await saveSnapshot();
    if (!savedConversationId) {
      return;
    }
    await generateStream(savedConversationId);
  }

  function stopGeneration() {
    abortController?.abort();
  }

  function toggleLinkPopover() {
    if (!editor) {
      return;
    }
    setLinkPopoverOpen((open) => {
      if (open) {
        return false;
      }
      const { from, to } = editor.state.selection;
      linkSelectionRef.current = { from, to };
      const href = editor.getAttributes("link").href as string | undefined;
      setLinkUrlDraft(href ?? "");
      return true;
    });
  }

  function applyLinkFromPopover() {
    if (!editor) {
      return;
    }
    restoreLinkSelection(editor, linkSelectionRef.current);
    const trimmed = linkUrlDraft.trim();
    const { from, to } = editor.state.selection;
    const hasTextSelection = from !== to;

    if (!trimmed) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      linkSelectionRef.current = null;
      setLinkPopoverOpen(false);
      return;
    }

    const href = normalizeLinkHref(trimmed);
    if (hasTextSelection) {
      editor.chain().focus().setLink({ href }).run();
    } else if (editor.isActive("link")) {
      editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
    } else {
      editor.chain().focus().insertContent(trimmed).run();
    }
    linkSelectionRef.current = null;
    setLinkPopoverOpen(false);
  }

  function openLinkFromPopover() {
    if (!editor) {
      return;
    }
    const draft = linkUrlDraft.trim();
    const fromMark = editor.getAttributes("link").href as string | undefined;
    const raw = draft || fromMark;
    if (!raw) {
      return;
    }
    window.open(normalizeLinkHref(raw), "_blank", "noopener,noreferrer");
  }

  function clearLinkFromPopover() {
    if (!editor) {
      return;
    }
    restoreLinkSelection(editor, linkSelectionRef.current);
    setLinkUrlDraft("");
    editor.chain().focus().extendMarkRange("link").unsetLink().run();
    linkSelectionRef.current = null;
  }

  function handleLinkInputKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      applyLinkFromPopover();
    }
    if (event.key === "Escape") {
      event.preventDefault();
      linkSelectionRef.current = null;
      setLinkPopoverOpen(false);
    }
  }

  function openImageFilePicker() {
    imageFileInputRef.current?.click();
  }

  function handleImageFileSelected(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!editor || !file) {
      return;
    }
    if (!file.type.startsWith("image/")) {
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        return;
      }
      const baseName = file.name.replace(/\.[^.]+$/, "");
      const alt = baseName.replace(/[-_]/g, " ").trim() || "Uploaded image";
      editor.chain().focus().insertContent({ type: "image", attrs: { src: result, alt, float: "left" } }).run();
    };
    reader.readAsDataURL(file);
  }

  function insertTable() {
    editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  }

  function revealContext() {
    setShowContext(true);
  }

  function removeContext() {
    setContext("");
    setShowContext(false);
  }

  function handleGenerateButtonClick() {
    if (isGenerating) {
      stopGeneration();
      return;
    }
    void saveAndGenerate();
  }

  function toggleToolbarPosition() {
    setToolbarPosition((current) => (current === "side" ? "top" : "side"));
  }

  const toolbar = (
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

  return (
    <main className="app-shell">
      <header className="app-header">
        <div className="app-header-inner">
          <h1>MAGI</h1>
          <p className="app-subtitle">AI Content Creator</p>
        </div>
      </header>

      <div className="app-body">
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
      </div>
    </main>
  );
}