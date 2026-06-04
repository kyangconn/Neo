import { generateId } from "@neo-tavern/shared";
import type { Message, CreateMessageInput } from "@neo-tavern/shared";
const { invoke } = await import("@tauri-apps/api/core");
import { getStorageItem, removeStorageItem, setStorageItem } from "../storage";

const STORAGE_KEY = "neotavern_messages";

let sqliteReady: Promise<boolean> | null = null;

async function loadAll(): Promise<Message[]> {
  try {
    const raw = await getStorageItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
async function saveAll(msgs: Message[]) {
  await setStorageItem(STORAGE_KEY, JSON.stringify(msgs));
}

function makeMessage(input: CreateMessageInput): Message {
  return {
    id: generateId(),
    chatId: input.chatId,
    role: input.role,
    content: input.content,
    reasoningContent: input.reasoningContent,
    generateDuration: input.generateDuration,
    thinkingDuration: input.thinkingDuration,
    usage: input.usage,
    images: input.images,
    agenticOptions: input.agenticOptions,
    createdAt: new Date().toISOString(),
  };
}

function makeRestoredMessages(chatId: string, messages: Message[]): Message[] {
  return messages.map((message) => ({
    ...message,
    id: generateId(),
    chatId,
  }));
}

async function canUseSqliteMessages() {
  if (!sqliteReady) {
    sqliteReady = (async () => {
      try {
        const legacyMessagesJson = await getStorageItem(STORAGE_KEY);
        await invoke("sqlite_init_messages", { legacyMessagesJson });
        if (legacyMessagesJson) {
          await removeStorageItem(STORAGE_KEY);
        }
        return true;
      } catch {
        return false;
      }
    })();
  }

  return sqliteReady;
}

export const messageRepository = {
  async listByChatId(chatId: string): Promise<Message[]> {
    if (await canUseSqliteMessages()) {
      return invoke<Message[]>("sqlite_list_messages_by_chat_id", { chatId });
    }
    return (await loadAll()).filter((m) => m.chatId === chatId).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  },

  async listRecentByChatId(chatId: string, limit: number): Promise<Message[]> {
    const cappedLimit = Math.max(1, Math.min(500, Math.floor(limit || 1)));
    if (await canUseSqliteMessages()) {
      return invoke<Message[]>("sqlite_list_recent_messages_by_chat_id", { chatId, limit: cappedLimit });
    }
    return (await loadAll())
      .filter((m) => m.chatId === chatId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      .slice(-cappedLimit);
  },

  async create(input: CreateMessageInput): Promise<Message> {
    const msg = makeMessage(input);
    if (await canUseSqliteMessages()) {
      return invoke<Message>("sqlite_create_message", { message: msg });
    }
    const all = await loadAll();
    all.push(msg);
    await saveAll(all);
    return msg;
  },

  async deleteByChatId(chatId: string): Promise<void> {
    if (await canUseSqliteMessages()) {
      await invoke("sqlite_delete_messages_by_chat_id", { chatId });
      return;
    }
    await saveAll((await loadAll()).filter((m) => m.chatId !== chatId));
  },

  async replaceByChatId(chatId: string, messages: Message[]): Promise<Message[]> {
    const restored = makeRestoredMessages(chatId, messages);
    if (await canUseSqliteMessages()) {
      const saved = await invoke<Message[]>("sqlite_replace_messages_by_chat_id", { chatId, messages: restored });
      return saved.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    }
    const all = await loadAll();
    await saveAll([...all.filter((m) => m.chatId !== chatId), ...restored]);
    return restored.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  },

  async update(id: string, content: string): Promise<Message> {
    if (await canUseSqliteMessages()) {
      return invoke<Message>("sqlite_update_message", { id, content });
    }
    const all = await loadAll();
    const idx = all.findIndex((m) => m.id === id);
    if (idx === -1) throw new Error(`Message not found: ${id}`);
    all[idx].content = content;
    await saveAll(all);
    return all[idx];
  },

  async patch(
    id: string,
    patch: Partial<
      Pick<
        Message,
        "content" | "reasoningContent" | "generateDuration" | "thinkingDuration" | "usage" | "images" | "agenticOptions"
      >
    >,
  ): Promise<Message> {
    if (await canUseSqliteMessages()) {
      return invoke<Message>("sqlite_patch_message", { id, patch });
    }
    const all = await loadAll();
    const idx = all.findIndex((m) => m.id === id);
    if (idx === -1) throw new Error(`Message not found: ${id}`);
    all[idx] = { ...all[idx], ...patch };
    await saveAll(all);
    return all[idx];
  },

  async deleteMessage(id: string): Promise<void> {
    if (await canUseSqliteMessages()) {
      await invoke("sqlite_delete_message", { id });
      return;
    }
    await saveAll((await loadAll()).filter((m) => m.id !== id));
  },

  async deleteMessages(ids: string[]): Promise<void> {
    if (await canUseSqliteMessages()) {
      await invoke("sqlite_delete_messages", { ids });
      return;
    }
    const idSet = new Set(ids);
    await saveAll((await loadAll()).filter((m) => !idSet.has(m.id)));
  },
};
