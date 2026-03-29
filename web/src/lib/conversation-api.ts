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
};

export function postStream(body: StreamRequestBody, signal: AbortSignal) {
  return fetch(`${apiBase}/api/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });
}
