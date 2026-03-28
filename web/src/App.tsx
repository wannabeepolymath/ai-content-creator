import { useMemo, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import { Table, TableRow, TableHeader, TableCell } from "@tiptap/extension-table";

type ContentType = "social" | "blog";

type StreamEvent =
  | { type: "chunk"; node: Record<string, unknown> }
  | { type: "done" }
  | { type: "error"; message: string };

const apiBase = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";

export function App() {
  const [prompt, setPrompt] = useState("");
  const [context, setContext] = useState("");
  const [contentType, setContentType] = useState<ContentType>("blog");
  const [isGenerating, setIsGenerating] = useState(false);
  const [status, setStatus] = useState("Ready.");
  const [abortController, setAbortController] = useState<AbortController | null>(null);

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

  async function generateStream() {
    if (!editor || !prompt.trim()) {
      return;
    }

    const controller = new AbortController();
    setAbortController(controller);
    setIsGenerating(true);
    setStatus("Generating...");
    editor.commands.setContent({ type: "doc", content: [] });

    try {
      const response = await fetch(`${apiBase}/api/generate-stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, contentType, context }),
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
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.trim()) continue;
          const evt = JSON.parse(line) as StreamEvent;
          if (evt.type === "chunk") {
            editor.chain().focus().insertContent(evt.node).run();
          }
          if (evt.type === "error") {
            console.error("[/api/generate-stream]", evt.message);
            setStatus(evt.message);
          }
          if (evt.type === "done") {
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