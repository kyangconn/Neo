// ── ChatPage-local types ─────────────────────────────

import type { SplitResult } from "@neo-tavern/core";
import type { Message } from "@neo-tavern/shared";
import type { AgenticActionOption } from "@/features/agentic-play/agentic-play";

export type TokenUsageView = "main" | "secondary";

export type PendingSendItem = {
  chatId: string;
  content: string;
  hiddenUserMessage?: boolean;
  label?: string;
  metadata?: import("@neo-tavern/shared").Message["metadata"];
};

/**
 * Pre-computed per-message rendering data produced by `useChatMessages` and
 * consumed by `MessageList`. Lives here (not in a separate hooks/types file)
 * so the page has a single type surface.
 */
export interface RenderedMessage {
  msg: Message;
  isUser: boolean;
  isFinalAi: boolean;
  split: SplitResult | null;
  displayContent: string;
  agenticOptions: AgenticActionOption[];
  isStreamingAi: boolean;
  hasDisplayContent: boolean;
}

export type { SplitResult as RegexSplitResult };

// ── Re-exports from shared packages ──────────────────
export type { Message, MessageImage } from "@neo-tavern/shared";
