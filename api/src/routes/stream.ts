import type { Express } from "express";
import { APIUserAbortError } from "openai";
import { streamDocEvents } from "../ai-service.js";
import { tiptapDocToText } from "../ai/tiptap-text.js";
import {
  appendConversationMessage,
  getOrCreateConversation,
  getLatestSnapshot,
  saveSnapshot,
} from "../conversation-store.js";
import { setSseHeaders, writeSseEvent } from "../http/sse.js";
import { generateRequestSchema } from "../types.js";

export function registerStreamRoute(app: Express) {
  app.post("/api/stream", async (req, res) => {
    const parsed = generateRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      console.log("[/api/stream] validation failed", parsed.error.flatten());
      return res.status(400).json({ error: "Invalid payload", details: parsed.error.flatten() });
    }

    const { conversationId: bodyConversationId, userId, prompt } = parsed.data;
    console.log("[/api/stream] start", {
      conversationId: bodyConversationId ?? "(new)",
      userId: userId ?? "anonymous",
      promptLength: prompt.length,
    });

    setSseHeaders(res);

    const abortController = new AbortController();
    // Use `res` (outgoing SSE), not `req`: `req` "close" can fire during normal POST handling and
    // abort the OpenAI call even though the client is still waiting for the stream.
    res.on("close", () => {
      if (res.writableEnded) {
        return;
      }
      console.log("[/api/stream] client disconnected, aborting stream");
      abortController.abort();
    });

    try {
      const conversation = await getOrCreateConversation(parsed.data.conversationId, parsed.data.userId);
      console.log("[/api/stream] conversation", {
        conversationId: conversation.conversationId,
      });
      await appendConversationMessage(conversation.conversationId, "user", parsed.data.prompt);
      const latestSnapshot = await getLatestSnapshot(conversation.conversationId);
      const latestDocumentText = latestSnapshot ? tiptapDocToText(latestSnapshot.tiptapJson) : "";

      if (abortController.signal.aborted) {
        console.log("[/api/stream] client gone before OpenAI call; skipping generation");
        return res.end();
      }

      const streamed = await streamDocEvents(
        parsed.data,
        {
          onDelta(value) {
            writeSseEvent(res, "delta", { type: "text", value });
          },
          onBlock(value) {
            writeSseEvent(res, "block", value);
          },
        },
        { signal: abortController.signal, documentText: latestDocumentText },
      );

      await appendConversationMessage(conversation.conversationId, "assistant", streamed.assistantText);
      await saveSnapshot(conversation.conversationId, streamed.doc, 1);
      console.log("[/api/stream] done", {
        conversationId: conversation.conversationId,
        assistantTextLength: streamed.assistantText.length,
        docContentNodes: streamed.doc.content?.length ?? 0,
      });
      writeSseEvent(res, "done", { ok: true, conversationId: conversation.conversationId });
      return res.end();
    } catch (error) {
      if (error instanceof APIUserAbortError || (error instanceof Error && error.name === "AbortError")) {
        console.log("[/api/stream] generation aborted (client disconnected or cancelled)");
        return res.end();
      }
      const message = error instanceof Error ? error.message : "Generation failed";
      console.error("[/api/stream] error", error);
      try {
        writeSseEvent(res, "error", { message });
      } catch {
        // Response may already be closed
      }
      return res.end();
    }
  });
}
