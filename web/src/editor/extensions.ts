import StarterKit from "@tiptap/starter-kit";
import Highlight from "@tiptap/extension-highlight";
import Link from "@tiptap/extension-link";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import { Table, TableRow, TableHeader, TableCell } from "@tiptap/extension-table";
import { ResizableImage } from "./resizable-image";

export const editorDefaultContent = {
  type: "doc",
  content: [{ type: "paragraph", content: [{ type: "text", text: "" }] }],
};

export const editorExtensions = [
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
];
