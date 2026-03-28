import { mkdir, readFile, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import type { TipTapDoc } from "./types.js";

type ConversationRecord = {
  conversationId: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
};

type MessageRecord = {
  messageId: string;
  conversationId: string;
  role: "user" | "assistant";
  rawText: string;
  createdAt: string;
};

type SnapshotRecord = {
  docId: string;
  conversationId: string;
  tiptapJson: TipTapDoc;
  schemaVersion: number;
  createdAt: string;
};

type StoreData = {
  conversations: ConversationRecord[];
  messages: MessageRecord[];
  snapshots: SnapshotRecord[];
};

const currentFilePath = fileURLToPath(import.meta.url);
const dataDirectory = join(dirname(currentFilePath), "../data");
const storePath = join(dataDirectory, "conversations.json");

const emptyStore: StoreData = {
  conversations: [],
  messages: [],
  snapshots: [],
};

async function ensureStoreFile() {
  await mkdir(dataDirectory, { recursive: true });
  try {
    await readFile(storePath, "utf-8");
  } catch {
    await writeFile(storePath, JSON.stringify(emptyStore, null, 2), "utf-8");
  }
}

async function readStore(): Promise<StoreData> {
  await ensureStoreFile();
  const raw = await readFile(storePath, "utf-8");
  try {
    return JSON.parse(raw) as StoreData;
  } catch {
    return { ...emptyStore };
  }
}

async function writeStore(store: StoreData) {
  await ensureStoreFile();
  await writeFile(storePath, JSON.stringify(store, null, 2), "utf-8");
}

export async function getOrCreateConversation(conversationId?: string, userId?: string) {
  const now = new Date().toISOString();
  const store = await readStore();
  const existing =
    conversationId && store.conversations.find((conversation) => conversation.conversationId === conversationId);

  if (existing) {
    existing.updatedAt = now;
    await writeStore(store);
    console.log("[conversation-store] getOrCreate: existing", conversationId);
    return existing;
  }

  const conversation: ConversationRecord = {
    conversationId: conversationId ?? randomUUID(),
    userId: userId ?? "anonymous",
    createdAt: now,
    updatedAt: now,
  };
  store.conversations.push(conversation);
  await writeStore(store);
  console.log("[conversation-store] getOrCreate: new", conversation.conversationId);
  return conversation;
}

export async function listConversationMessages(conversationId: string) {
  const store = await readStore();
  return store.messages
    .filter((message) => message.conversationId === conversationId)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

export async function appendConversationMessage(
  conversationId: string,
  role: "user" | "assistant",
  rawText: string,
) {
  const store = await readStore();
  const record: MessageRecord = {
    messageId: randomUUID(),
    conversationId,
    role,
    rawText,
    createdAt: new Date().toISOString(),
  };
  store.messages.push(record);

  const conversation = store.conversations.find((item) => item.conversationId === conversationId);
  if (conversation) {
    conversation.updatedAt = new Date().toISOString();
  }
  await writeStore(store);
  console.log("[conversation-store] appendMessage", { conversationId, role, textLength: rawText.length });
  return record;
}

export async function saveSnapshot(conversationId: string, tiptapJson: TipTapDoc, schemaVersion = 1) {
  const store = await readStore();
  const snapshot: SnapshotRecord = {
    docId: randomUUID(),
    conversationId,
    tiptapJson,
    schemaVersion,
    createdAt: new Date().toISOString(),
  };
  store.snapshots.push(snapshot);
  await writeStore(store);
  console.log("[conversation-store] saveSnapshot", {
    conversationId,
    docId: snapshot.docId,
    schemaVersion,
    nodeCount: tiptapJson.content?.length ?? 0,
  });
  return snapshot;
}
