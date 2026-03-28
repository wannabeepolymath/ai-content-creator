import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import { Table, TableRow, TableHeader, TableCell } from "@tiptap/extension-table";
const apiBase = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";

export function App() {
    const [prompt, setPrompt] = useState("");
    const [context, setContext] = useState("");
    const [contentType, setContentType] = useState("blog");
    const [isGenerating, setIsGenerating] = useState(false);
    const [status, setStatus] = useState("Ready.");
    const [abortController, setAbortController] = useState(null);
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
                    if (!line.trim())
                        continue;
                    const evt = JSON.parse(line);
                    if (evt.type === "chunk") {
                        editor.chain().focus().insertContent(evt.node).run();
                    }
                    if (evt.type === "error") {
                        setStatus(evt.message);
                    }
                    if (evt.type === "done") {
                        setStatus("Done.");
                    }
                }
            }
        }
        catch (error) {
            if (error instanceof DOMException && error.name === "AbortError") {
                setStatus("Generation stopped.");
            }
            else {
                setStatus("Generation failed.");
            }
        }
        finally {
            setAbortController(null);
            setIsGenerating(false);
        }
    }
    function stopGeneration() {
        abortController?.abort();
    }
    return (_jsxs("main", { className: "app", children: [_jsxs("section", { className: "controls", children: [_jsx("h1", { children: "Magi AI Content Editor" }), _jsx("p", { children: "Create structured social and blog content with progressive rendering." }), _jsxs("label", { children: ["Content type", _jsxs("select", { value: contentType, onChange: (event) => setContentType(event.target.value), children: [_jsx("option", { value: "blog", children: "Blog Post" }), _jsx("option", { value: "social", children: "Social Post" })] })] }), _jsxs("label", { children: ["Prompt", _jsx("textarea", { rows: 4, value: prompt, onChange: (event) => setPrompt(event.target.value), placeholder: "Example: Write a blog post about adopting progressive rendering in AI editors." })] }), _jsxs("label", { children: ["Optional reference context", _jsx("textarea", { rows: 3, value: context, onChange: (event) => setContext(event.target.value), placeholder: "Paste notes, facts, or source snippets here." })] }), _jsxs("div", { className: "actions", children: [_jsx("button", { onClick: generateStream, disabled: !canGenerate, children: "Generate" }), _jsx("button", { onClick: stopGeneration, disabled: !isGenerating, children: "Stop" })] }), _jsx("p", { className: "status", children: status })] }), _jsx("section", { className: "editor-shell", children: _jsx(EditorContent, { editor: editor }) })] }));
}