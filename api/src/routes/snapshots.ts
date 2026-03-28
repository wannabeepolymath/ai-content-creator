import type { Express } from "express";
import { z } from "zod";
import { getLatestSnapshot, getOrCreateConversation, saveSnapshot } from "../conversation-store.js";
import type { TipTapDoc } from "../types.js";

const optionalIdString = z.preprocess((val) => (val === null ? undefined : val), z.string().optional());

const snapshotSchema = z.object({
  conversationId: optionalIdString,
  userId: optionalIdString,
  tiptapJson: z.object({
    type: z.literal("doc"),
    content: z.array(z.any()),
  }) as z.ZodType<TipTapDoc>,
  schemaVersion: z.number().int().optional().default(1),
});

export function registerSnapshotRoutes(app: Express) {
  app.post("/api/conversations/snapshot", async (req, res) => {
    const parsed = snapshotSchema.safeParse(req.body);
    if (!parsed.success) {
      console.log("[/api/conversations/snapshot] validation failed", parsed.error.flatten());
      return res.status(400).json({ error: "Invalid payload", details: parsed.error.flatten() });
    }

    const { conversationId, userId, tiptapJson, schemaVersion } = parsed.data;
    const conversation = await getOrCreateConversation(conversationId, userId);
    const snapshot = await saveSnapshot(conversation.conversationId, tiptapJson, schemaVersion);
    return res.json({
      ok: true,
      conversationId: conversation.conversationId,
      snapshotId: snapshot.docId,
    });
  });

  app.get("/api/conversations/:conversationId/snapshot", async (req, res) => {
    const { conversationId } = req.params;
    if (!conversationId) {
      return res.status(400).json({ error: "Conversation id is required" });
    }
    const snapshot = await getLatestSnapshot(conversationId);
    if (!snapshot) {
      return res.status(404).json({ error: "Snapshot not found" });
    }
    return res.json({
      ok: true,
      conversationId,
      snapshot: snapshot.tiptapJson,
      schemaVersion: snapshot.schemaVersion,
      createdAt: snapshot.createdAt,
    });
  });
}
