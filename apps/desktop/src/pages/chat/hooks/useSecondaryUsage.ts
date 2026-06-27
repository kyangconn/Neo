import { useEffect, useState } from "react";
import type { Message } from "@neo-tavern/shared";
import type { SecondaryApiUsageRecord } from "@/db/repositories";
import { secondaryApiUsageRepository } from "@/db/repositories";

interface UseSecondaryUsageParams {
  currentChatId: string | undefined;
  tokenDialogOpen: boolean;
  tokenUsageView: "main" | "secondary";
  messages: Message[];
}

/**
 * Loads secondary-API usage rows for the TokenDialog when it opens.
 * Extracted from ChatPage (Phase 1 UI split).
 */
export function useSecondaryUsage({
  currentChatId,
  tokenDialogOpen,
  tokenUsageView,
  messages,
}: UseSecondaryUsageParams) {
  const [secondaryUsageRecords, setSecondaryUsageRecords] = useState<SecondaryApiUsageRecord[]>([]);

  useEffect(() => {
    let cancelled = false;
    if (!currentChatId) {
      setSecondaryUsageRecords([]);
      return;
    }
    if (!tokenDialogOpen) return;
    secondaryApiUsageRepository.listByChatId(currentChatId).then((records) => {
      if (!cancelled) setSecondaryUsageRecords(records);
    });
    return () => {
      cancelled = true;
    };
  }, [currentChatId, tokenDialogOpen, tokenUsageView, messages]);

  return { secondaryUsageRecords, setSecondaryUsageRecords };
}
