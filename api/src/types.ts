import { z } from "zod";

export const contentTypeSchema = z.enum(["social", "blog"]);

export const generateRequestSchema = z.object({
  prompt: z.string().min(1),
  contentType: contentTypeSchema,
  context: z.string().optional().default(""),
});

export type GenerateRequest = z.infer<typeof generateRequestSchema>;

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