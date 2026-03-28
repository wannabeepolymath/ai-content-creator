import { z } from "zod";
import { streamBlockDataSchema, type StreamBlockData } from "../types.js";

export const modelLineSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("delta"), text: z.string() }),
  z.object({
    kind: z.literal("block"),
    block: z.enum([
      "paragraph_start",
      "paragraph_end",
      "heading_start",
      "heading_end",
      "bullet_list_start",
      "bullet_list_end",
      "ordered_list_start",
      "ordered_list_end",
      "list_item_start",
      "list_item_end",
      "image",
    ]),
    level: z.number().int().min(1).max(6).optional(),
    src: z.string().url().optional(),
    alt: z.string().optional(),
  }),
]);

export type ModelLine = z.infer<typeof modelLineSchema>;

export function mapModelLineToBlock(line: ModelLine): StreamBlockData | null {
  if (line.kind !== "block") {
    return null;
  }
  if (line.block === "heading_start") {
    return streamBlockDataSchema.parse({ type: line.block, level: line.level ?? 2 });
  }
  if (line.block === "image") {
    return streamBlockDataSchema.parse({
      type: line.block,
      src: line.src ?? "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40",
      alt: line.alt ?? "",
    });
  }
  return streamBlockDataSchema.parse({ type: line.block });
}
