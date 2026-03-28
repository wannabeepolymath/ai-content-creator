import { useMemo, useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import { Table, TableRow, TableHeader, TableCell } from "@tiptap/extension-table";

type ContentType = "social" | "blog";

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

const apiBase = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";

export function App() {
  const [prompt, setPrompt] = useState("");
  const [context, setContext] = useState("");
  const [contentType, setContentType] = useState<ContentType>("blog");
  const [isGenerating, setIsGenerating] = useState(false);
  const [status, setStatus] = useState("Ready.");
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const draftDocRef = useRef<TipTapDoc>({ type: "doc", content: [] });
  const draftStateRef = useRef<{
    currentTextNodes: TipTapNode[] | null;
    activeBlock: "paragraph" | "heading" | "list_item" | null;
    currentList: TipTapNode | null;
  }>({ currentTextNodes: null, activeBlock: null, currentList: null });

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image,
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: {
      type: "doc",
      content: [{ type: "paragraph", content: [{ type: "text", text: "Describe what you want, then generate." }] }],
    },
    editorProps: {
      attributes: {
        class: "editor-content",
      },
    },
  });

  const canGenerate = useMemo(() => prompt.trim().length > 0 && !isGenerating && !!editor, [prompt, isGenerating, editor]);

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
        draftDocRef.current.content.push({ type: "image", attrs: { src: block.src, alt: block.alt ?? "" } });
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

  async function generateStream() {
    if (!editor || !prompt.trim()) {
      return;
    }

    const controller = new AbortController();
    setAbortController(controller);
    setIsGenerating(true);
    setStatus("Generating...");
    resetDraftDoc();
    renderDraftDoc();

    try {
      const response = await fetch(`${apiBase}/api/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, contentType, context, conversationId }),
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
              pushText(payload.value);
              renderDraftDoc();
            }
          }
          if (evt.event === "block") {
            const payload = evt.data as StreamBlock;
            applyBlock(payload);
            renderDraftDoc();
          }
          if (evt.event === "error") {
            const payload = evt.data as { message?: string };
            setStatus(payload.message ?? "Generation failed.");
          }
          if (evt.event === "done") {
            const payload = evt.data as { ok?: boolean; conversationId?: string };
            if (payload.conversationId) {
              setConversationId(payload.conversationId);
            }
            setStatus("Done.");
          }
        }
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        setStatus("Generation stopped.");
      } else {
        setStatus("Generation failed.");
      }
    } finally {
      setAbortController(null);
      setIsGenerating(false);
    }
  }

  function stopGeneration() {
    abortController?.abort();
  }

  return (
    <main className="app">
      <section className="controls">
        <h1>Magi AI Content Editor</h1>
        <p>Create structured social and blog content with progressive rendering.</p>
        <p>Conversation: {conversationId ?? "new conversation"}</p>

        <label>
          Content type
          <select value={contentType} onChange={(event) => setContentType(event.target.value as ContentType)}>
            <option value="blog">Blog Post</option>
            <option value="social">Social Post</option>
          </select>
        </label>

        <label>
          Prompt
          <textarea
            rows={4}
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder="Example: Write a blog post about adopting progressive rendering in AI editors."
          />
        </label>

        <label>
          Optional reference context
          <textarea
            rows={3}
            value={context}
            onChange={(event) => setContext(event.target.value)}
            placeholder="Paste notes, facts, or source snippets here."
          />
        </label>

        <div className="actions">
          <button onClick={generateStream} disabled={!canGenerate}>
            Generate
          </button>
          <button onClick={stopGeneration} disabled={!isGenerating}>
            Stop
          </button>
        </div>
        <p className="status">{status}</p>
      </section>

      <section className="editor-shell">
        <EditorContent editor={editor} />
      </section>
    </main>
  );
}



//issue: the change done in editor are not saved anywhere as well as the data in editor is not been sent to the server