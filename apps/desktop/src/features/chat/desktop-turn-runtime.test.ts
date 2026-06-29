import { beforeEach, describe, expect, it } from "vitest";
import { abortDesktopChatTurn, startDesktopChatTurn } from "./desktop-turn-runtime";
import { useChatStore } from "./chat.store";

function resetGenerationState() {
  useChatStore.setState({
    sending: false,
    sendingChatId: null,
    streamingMessageId: null,
    generationPhase: null,
    activeGenerations: {},
    generationErrors: {},
  });
}

describe("desktop turn runtime", () => {
  beforeEach(() => {
    resetGenerationState();
  });

  it("wraps a chat turn with begin and finish state", async () => {
    const snapshots: boolean[] = [];

    const result = await startDesktopChatTurn("chat-1", async () => {
      snapshots.push(!!useChatStore.getState().activeGenerations["chat-1"]);
      return "done";
    });

    expect(result).toBe("done");
    expect(snapshots).toEqual([true]);
    expect(useChatStore.getState().activeGenerations["chat-1"]).toBeUndefined();
  });

  it("aborts the active chat turn and clears generation state", async () => {
    let observedAbort = false;
    const run = startDesktopChatTurn(
      "chat-1",
      (context) =>
        new Promise<void>((resolve) => {
          context.signal.addEventListener("abort", () => {
            observedAbort = true;
            resolve();
          });
        }),
    );
    await Promise.resolve();

    expect(useChatStore.getState().activeGenerations["chat-1"]).toBeTruthy();
    abortDesktopChatTurn("chat-1");
    await run;

    expect(observedAbort).toBe(true);
    expect(useChatStore.getState().activeGenerations["chat-1"]).toBeUndefined();
  });
});
