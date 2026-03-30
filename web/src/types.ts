export type ContentType = "social" | "blog";
export type ToolbarPosition = "side" | "top";

export type ReferenceFileDraft = {
  id: string;
  file: File;
};

export type TipTapNode = {
  type: string;
  attrs?: Record<string, unknown>;
  content?: TipTapNode[];
  text?: string;
};

export type TipTapDoc = {
  type: "doc";
  content: TipTapNode[];
};

export const CONTENT_TYPE_OPTIONS = [
  { value: "blog", label: "Blog Post" },
  { value: "social", label: "Linkedin Post" },
] as const satisfies ReadonlyArray<{ value: ContentType; label: string }>;

export type StreamDelta = { type: "text"; value: string };

export type StreamBlock =
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
