import { apiBase } from "../constants";

export type SnapshotPayload = {
  conversationId: string | null;
  tiptapJson: unknown;
  schemaVersion: number;
};

export async function postConversationSnapshot(payload: SnapshotPayload) {
  return fetch(`${apiBase}/api/conversations/snapshot`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export type StreamRequestBody = {
  prompt: string;
  contentType: string;
  context: string;
  conversationId: string | null;
  referenceFiles: File[];
};

export function postStream(body: StreamRequestBody, signal: AbortSignal) {
  const formData = new FormData();
  formData.append("prompt", body.prompt);
  formData.append("contentType", body.contentType);
  formData.append("context", body.context);
  if (body.conversationId) {
    formData.append("conversationId", body.conversationId);
  }
  for (const file of body.referenceFiles) {
    formData.append("referenceFiles", file);
  }

  return fetch(`${apiBase}/api/stream`, {
    method: "POST",
    body: formData,
    signal,
  });
}
