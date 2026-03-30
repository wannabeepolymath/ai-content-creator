import { useMemo, useRef, useState, type ChangeEvent, type KeyboardEvent } from "react";
import { useEditor, type Editor } from "@tiptap/react";
import { editorDefaultContent, editorExtensions } from "./editor/extensions";
import { normalizeLinkHref, restoreLinkSelection } from "./lib/link";
import { parseSseFrames } from "./lib/parse-sse";
import { postConversationSnapshot, postStream } from "./lib/conversation-api";
import {
  applyBlock,
  type DraftState,
  pushText,
  renderDraftDoc,
  resetDraftDoc,
} from "./stream/draft";
import type { ContentType, ReferenceFileDraft, StreamBlock, StreamDelta, TipTapDoc, ToolbarPosition } from "./types";
import { EditorToolbar } from "./components/EditorToolbar";
import { PromptPanel } from "./components/PromptPanel";
import { AppShell } from "./components/AppShell";
import { EditorWorkspace } from "./components/EditorWorkspace";
import { useEditorDirtyTracking } from "./hooks/useEditorDirtyTracking";
import { useToolbarTransactionRevision } from "./hooks/useToolbarTransactionRevision";
import { useImageFloatGestures, type ImageFloatGesture } from "./hooks/useImageFloatGestures";
import { useOverlayDismiss } from "./hooks/useOverlayDismiss";
import { useLinkPopoverFocus } from "./hooks/useLinkPopoverFocus";
import { useEditorToolbarCapabilities } from "./hooks/useEditorToolbarCapabilities";

const SUPPORTED_REFERENCE_EXTENSIONS = new Set(["txt", "md", "mdx", "markdown", "pdf"]);

function isSupportedReferenceFile(file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  return SUPPORTED_REFERENCE_EXTENSIONS.has(extension);
}

export function App() {
  const [prompt, setPrompt] = useState("");
  const [context, setContext] = useState("");
  const [referenceFiles, setReferenceFiles] = useState<ReferenceFileDraft[]>([]);
  const [showContext, setShowContext] = useState(false);
  const [contentType, setContentType] = useState<ContentType>("blog");
  const [toolbarPosition, setToolbarPosition] = useState<ToolbarPosition>("side");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState("Ready.");
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const draftDocRef = useRef<TipTapDoc>({ type: "doc", content: [] });
  const draftStateRef = useRef<DraftState>({ currentTextNodes: null, activeBlock: null, currentList: null });
  const referenceFileInputRef = useRef<HTMLInputElement>(null);
  const imageFileInputRef = useRef<HTMLInputElement>(null);
  const imageFloatGestureRef = useRef<ImageFloatGesture | null>(null);
  const linkPopoverRef = useRef<HTMLDivElement>(null);
  const contentTypeMenuRef = useRef<HTMLDivElement>(null);
  const headingMenuRef = useRef<HTMLDivElement>(null);
  const highlightMenuRef = useRef<HTMLDivElement>(null);
  const listMenuRef = useRef<HTMLDivElement>(null);
  const tableMenuRef = useRef<HTMLDivElement>(null);
  const linkInputRef = useRef<HTMLInputElement>(null);
  const linkSelectionRef = useRef<{ from: number; to: number } | null>(null);
  const highlightSelectionRef = useRef<{ from: number; to: number } | null>(null);
  const [linkPopoverOpen, setLinkPopoverOpen] = useState(false);
  const [contentTypeMenuOpen, setContentTypeMenuOpen] = useState(false);
  const [headingMenuOpen, setHeadingMenuOpen] = useState(false);
  const [highlightMenuOpen, setHighlightMenuOpen] = useState(false);
  const [listMenuOpen, setListMenuOpen] = useState(false);
  const [tableMenuOpen, setTableMenuOpen] = useState(false);
  const [linkUrlDraft, setLinkUrlDraft] = useState("");

  const editor = useEditor({
    extensions: editorExtensions,
    content: editorDefaultContent,
    editorProps: {
      attributes: {
        class: "editor-content",
      },
    },
  });

  const { isDirty, setIsDirty, markEditorAsSaved } = useEditorDirtyTracking(editor);
  useToolbarTransactionRevision(editor);
  useImageFloatGestures(editor, imageFloatGestureRef);
  useLinkPopoverFocus(linkPopoverOpen, linkInputRef);

  useOverlayDismiss(linkPopoverOpen, linkPopoverRef, () => {
    linkSelectionRef.current = null;
    setLinkPopoverOpen(false);
  });
  useOverlayDismiss(contentTypeMenuOpen, contentTypeMenuRef, () => setContentTypeMenuOpen(false), true);
  useOverlayDismiss(headingMenuOpen, headingMenuRef, () => setHeadingMenuOpen(false), true);
  useOverlayDismiss(highlightMenuOpen, highlightMenuRef, () => setHighlightMenuOpen(false), true);
  useOverlayDismiss(listMenuOpen, listMenuRef, () => setListMenuOpen(false), true);
  useOverlayDismiss(tableMenuOpen, tableMenuRef, () => setTableMenuOpen(false), true);

  const toolbarCaps = useEditorToolbarCapabilities(editor);

  const canGenerate = useMemo(
    () => prompt.trim().length > 0 && !isGenerating && !isSaving && !!editor,
    [prompt, isGenerating, isSaving, editor],
  );
  const canSave = useMemo(
    () => !isGenerating && !isSaving && !!editor && isDirty,
    [isGenerating, isSaving, editor, isDirty],
  );
  const isContextVisible = showContext || context.trim().length > 0;
  const isTopToolbar = toolbarPosition === "top";

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
      const response = await postConversationSnapshot({
        conversationId: activeConversationId,
        tiptapJson: activeEditor.getJSON(),
        schemaVersion: 1,
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

  function resetDraftDocLocal() {
    resetDraftDoc(draftDocRef, draftStateRef);
  }

  function pushTextLocal(value: string) {
    pushText(draftDocRef, draftStateRef, value);
  }

  function applyBlockLocal(block: StreamBlock) {
    applyBlock(draftDocRef, draftStateRef, block);
  }

  function renderDraftDocLocal() {
    renderDraftDoc(editor, draftDocRef);
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
    resetDraftDocLocal();
    renderDraftDocLocal();

    let finalStatus = "Done.";
    let generationCompleted = false;
    let receivedDraftContent = false;

    try {
      const response = await postStream(
        {
          prompt,
          contentType,
          context,
          conversationId: activeConversationId,
          referenceFiles: referenceFiles.map((referenceFile) => referenceFile.file),
        },
        controller.signal,
      );

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
              pushTextLocal(payload.value);
              renderDraftDocLocal();
              setIsDirty(true);
            }
          }
          if (evt.event === "block") {
            const payload = evt.data as StreamBlock;
            receivedDraftContent = true;
            applyBlockLocal(payload);
            renderDraftDocLocal();
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

  function openReferenceFilePicker() {
    referenceFileInputRef.current?.click();
  }

  function handleReferenceFilesSelected(event: ChangeEvent<HTMLInputElement>) {
    const selectedFiles = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (selectedFiles.length === 0) {
      return;
    }

    const supportedFiles = selectedFiles.filter(isSupportedReferenceFile);
    const rejectedCount = selectedFiles.length - supportedFiles.length;
    let addedCount = 0;
    let duplicateCount = 0;

    setReferenceFiles((current) => {
      const next = [...current];
      for (const file of supportedFiles) {
        const alreadyAttached = next.some(
          (referenceFile) =>
            referenceFile.file.name === file.name &&
            referenceFile.file.size === file.size &&
            referenceFile.file.lastModified === file.lastModified,
        );
        if (alreadyAttached) {
          duplicateCount += 1;
          continue;
        }

        next.push({
          id: crypto.randomUUID(),
          file,
        });
        addedCount += 1;
      }
      return next;
    });

    if (addedCount > 0) {
      setStatus(`${addedCount} reference file${addedCount === 1 ? "" : "s"} attached.`);
      return;
    }
    if (duplicateCount > 0 && rejectedCount === 0) {
      setStatus("That file is already attached.");
      return;
    }
    if (rejectedCount > 0) {
      setStatus("Only TXT, MD, MDX, MARKDOWN, and PDF files are supported.");
    }
  }

  function removeReferenceFile(id: string) {
    setReferenceFiles((current) => current.filter((referenceFile) => referenceFile.id !== id));
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
    <EditorToolbar
      editor={editor}
      isTopToolbar={isTopToolbar}
      toggleToolbarPosition={toggleToolbarPosition}
      canUndo={toolbarCaps.canUndo}
      canRedo={toolbarCaps.canRedo}
      headingMenuRef={headingMenuRef}
      listMenuRef={listMenuRef}
      highlightMenuRef={highlightMenuRef}
      tableMenuRef={tableMenuRef}
      linkPopoverRef={linkPopoverRef}
      headingMenuOpen={headingMenuOpen}
      setHeadingMenuOpen={setHeadingMenuOpen}
      listMenuOpen={listMenuOpen}
      setListMenuOpen={setListMenuOpen}
      highlightMenuOpen={highlightMenuOpen}
      setHighlightMenuOpen={setHighlightMenuOpen}
      tableMenuOpen={tableMenuOpen}
      setTableMenuOpen={setTableMenuOpen}
      linkPopoverOpen={linkPopoverOpen}
      setLinkPopoverOpen={setLinkPopoverOpen}
      linkInputRef={linkInputRef}
      imageFileInputRef={imageFileInputRef}
      linkUrlDraft={linkUrlDraft}
      setLinkUrlDraft={setLinkUrlDraft}
      handleLinkInputKeyDown={handleLinkInputKeyDown}
      canInsertTable={toolbarCaps.canInsertTable}
      canAddRow={toolbarCaps.canAddRow}
      canDeleteRow={toolbarCaps.canDeleteRow}
      canAddColumn={toolbarCaps.canAddColumn}
      canDeleteColumn={toolbarCaps.canDeleteColumn}
      canDeleteTable={toolbarCaps.canDeleteTable}
      canToggleBold={toolbarCaps.canToggleBold}
      canToggleItalic={toolbarCaps.canToggleItalic}
      canToggleUnderline={toolbarCaps.canToggleUnderline}
      canToggleStrike={toolbarCaps.canToggleStrike}
      canToggleCode={toolbarCaps.canToggleCode}
      canToggleSuperscript={toolbarCaps.canToggleSuperscript}
      canToggleSubscript={toolbarCaps.canToggleSubscript}
      isLinkActive={toolbarCaps.isLinkActive}
      insertTable={insertTable}
      toggleLinkPopover={toggleLinkPopover}
      applyLinkFromPopover={applyLinkFromPopover}
      openLinkFromPopover={openLinkFromPopover}
      clearLinkFromPopover={clearLinkFromPopover}
      openImageFilePicker={openImageFilePicker}
      handleImageFileSelected={handleImageFileSelected}
      highlightSelectionRef={highlightSelectionRef}
      linkSelectionRef={linkSelectionRef}
    />
  );

  return (
    <AppShell>
      <div className="app-body">
        <PromptPanel
          contentType={contentType}
          setContentType={setContentType}
          contentTypeMenuRef={contentTypeMenuRef}
          contentTypeMenuOpen={contentTypeMenuOpen}
          setContentTypeMenuOpen={setContentTypeMenuOpen}
          prompt={prompt}
          setPrompt={setPrompt}
          context={context}
          setContext={setContext}
          isContextVisible={isContextVisible}
          referenceFileInputRef={referenceFileInputRef}
          referenceFiles={referenceFiles}
          openReferenceFilePicker={openReferenceFilePicker}
          handleReferenceFilesSelected={handleReferenceFilesSelected}
          removeReferenceFile={removeReferenceFile}
          revealContext={revealContext}
          removeContext={removeContext}
          canSave={canSave}
          saveSnapshot={saveSnapshot}
          isGenerating={isGenerating}
          canGenerate={canGenerate}
          handleGenerateButtonClick={handleGenerateButtonClick}
          status={status}
        />

        <EditorWorkspace toolbarPosition={toolbarPosition} toolbar={toolbar} editor={editor} contentType={contentType} />
      </div>
    </AppShell>
  );
}
