import type { Express, Request, Response } from "express";
import multer from "multer";
import { isAIAbortError } from "../ai/errors.js";
import { streamDocEvents } from "../ai-service.js";
import { tiptapDocToText } from "../ai/tiptap-text.js";
import {
  appendConversationMessage,
  getOrCreateConversation,
  getLatestSnapshot,
  saveSnapshot,
} from "../conversation-store.js";
import { setSseHeaders, writeSseEvent } from "../http/sse.js";
import { extractReferenceMaterials, getReferenceUploadLimits } from "../reference-material.js";
import { generateRequestSchema, type ReferenceMaterial } from "../types.js";

export function registerStreamRoute(app: Express) {
  const uploadLimits = getReferenceUploadLimits();
  const uploadLimitMb = Math.floor(uploadLimits.maxFileBytes / (1024 * 1024));
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      files: uploadLimits.maxFiles,
      fileSize: uploadLimits.maxFileBytes,
    },
  });

  app.post("/api/stream", (req, res, next) => {
    upload.array("referenceFiles", uploadLimits.maxFiles)(req, res, (error) => {
      if (!error) {
        void handleStreamRequest(req, res);
        return;
      }

      const message =
        error instanceof multer.MulterError
          ? error.code === "LIMIT_FILE_SIZE"
            ? `Each reference file must be ${uploadLimitMb} MB or smaller.`
            : error.code === "LIMIT_FILE_COUNT"
              ? `You can attach up to ${uploadLimits.maxFiles} files per request.`
              : error.message
          : error instanceof Error
            ? error.message
            : "Unable to process uploaded files.";
      res.status(400).json({ error: message });
    });
  });
}

async function handleStreamRequest(req: Request, res: Response) {
  const body = req.body as Record<string, unknown>;
  const parsed = generateRequestSchema.safeParse({
    prompt: body.prompt,
    contentType: body.contentType,
    context: body.context,
    conversationId: body.conversationId,
    userId: body.userId,
  });

  if (!parsed.success) {
    console.log("[/api/stream] validation failed", parsed.error.flatten());
    return res.status(400).json({ error: "Invalid payload", details: parsed.error.flatten() });
  }

  const uploadedFiles = Array.isArray(req.files) ? req.files : [];
  let references: ReferenceMaterial[] = [];
  try {
    references = await extractReferenceMaterials(uploadedFiles);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to process reference files.";
    return res.status(400).json({ error: message });
  }

  const { conversationId: bodyConversationId, userId, prompt } = parsed.data;
  console.log("[/api/stream] start", {
    conversationId: bodyConversationId ?? "(new)",
    userId: userId ?? "anonymous",
    promptLength: prompt.length,
    referenceCount: references.length,
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

    const requestApiKey = req.get("x-api-key")?.trim() || undefined;

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
      {
        signal: abortController.signal,
        documentText: latestDocumentText,
        references,
        apiKey: requestApiKey || undefined,
      },
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
    if (isAIAbortError(error)) {
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
}
