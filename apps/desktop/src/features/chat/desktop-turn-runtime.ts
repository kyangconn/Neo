import { generationTaskRunner, type GenerationTaskContext } from "@/app/generation-task-runner";
import { useChatStore } from "./chat.store";

export type DesktopChatTurnContext = GenerationTaskContext;

type DesktopChatTurnRunner<T> = (context: DesktopChatTurnContext) => Promise<T>;

function chatTaskKey(chatId: string) {
  return `chat:${chatId}`;
}

/**
 * Desktop adapter for a long-running chat turn.
 *
 * It owns task exclusivity, abort wiring, and store lifecycle state. Prompt
 * building and generation should keep moving toward core strategies.
 */
export function startDesktopChatTurn<T>(chatId: string, runner: DesktopChatTurnRunner<T>): Promise<T> {
  return generationTaskRunner.startExclusive(chatTaskKey(chatId), async (context) => {
    const store = useChatStore.getState();
    store.beginSending(chatId);
    store.setGenerationError(chatId, null);
    try {
      return await runner(context);
    } finally {
      if (context.isCurrent()) useChatStore.getState().finishSending(chatId);
    }
  });
}

export function abortDesktopChatTurn(chatId: string) {
  generationTaskRunner.abort(chatTaskKey(chatId));
  useChatStore.getState().finishSending(chatId);
}
