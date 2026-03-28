import { z } from "zod";

export const contentTypeSchema = z.enum(["social", "blog"]);

/** JSON clients often send `null` for unset optional fields; treat like omitted. */
const optionalIdString = z.preprocess(
  (val) => (val === null ? undefined : val),
  z.string().optional(),
);

export const generateRequestSchema = z.object({
  prompt: z.string().min(1),
  contentType: contentTypeSchema,
  context: z.string().optional().default(""),
  conversationId: optionalIdString,
  userId: optionalIdString,
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

export const streamDeltaDataSchema = z.object({
  type: z.literal("text"),
  value: z.string(),
});

export const streamBlockDataSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("paragraph_start") }),
  z.object({ type: z.literal("paragraph_end") }),
  z.object({ type: z.literal("heading_start"), level: z.number().int().min(1).max(6) }),
  z.object({ type: z.literal("heading_end") }),
  z.object({ type: z.literal("bullet_list_start") }),
  z.object({ type: z.literal("bullet_list_end") }),
  z.object({ type: z.literal("ordered_list_start") }),
  z.object({ type: z.literal("ordered_list_end") }),
  z.object({ type: z.literal("list_item_start") }),
  z.object({ type: z.literal("list_item_end") }),
  z.object({
    type: z.literal("image"),
    src: z.string().url(),
    alt: z.string().optional().default(""),
  }),
]);

export type StreamDeltaData = z.infer<typeof streamDeltaDataSchema>;
export type StreamBlockData = z.infer<typeof streamBlockDataSchema>;

export type StreamEvent =
  | { event: "delta"; data: StreamDeltaData }
  | { event: "block"; data: StreamBlockData }
  | { event: "done"; data: { ok: true; conversationId: string } }
  | { event: "error"; data: { message: string } };