import { describe, expect, it } from "vitest";
import type { Character, Message, ModelConfig } from "@neo-tavern/shared";
import { ChatPluginRegistry } from "../plugin-registry";
import { runChatTurn } from "../turn-engine";
import type { ChatStrategy, TurnContext } from "../types";

const character: Character = {
  id: "char-1",
  name: "Luna",
  description: "",
  personality: "",
  scenario: "",
  firstMessage: "",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

const modelConfig: ModelConfig = {
  id: "model-1",
  provider: "openai-compatible",
  name: "Test",
  baseUrl: "https://example.com/v1",
  apiKey: "key",
  model: "test-model",
  temperature: 0.7,
  maxTokens: 1000,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

function createContext(): TurnContext {
  return {
    chatId: "chat-1",
    character,
    messages: [] as Message[],
    userInput: "hello",
    modelConfig,
    personaName: "Player",
    activeRegexRules: [],
    worldbookEntries: [],
    memoryBlock: null,
  };
}

describe("runChatTurn", () => {
  it("runs strategy lifecycle with plugins and phase callbacks", async () => {
    const events: string[] = [];
    const registry = new ChatPluginRegistry();
    registry.register({
      id: "test-plugin",
      onBeforePromptBuild: () => {
        events.push("plugin.before");
      },
      onContextBlocks: (blocks) => {
        events.push("plugin.context");
        return blocks;
      },
      onAfterTurn: () => {
        events.push("plugin.after");
      },
    });

    const strategy: ChatStrategy = {
      mode: "normal",
      buildExtraContextBlocks: () => {
        events.push("strategy.context");
        return [];
      },
      resolvePresetItems: () => {
        events.push("strategy.presets");
        return null;
      },
      generate: async () => {
        events.push("strategy.generate");
        return { content: "ok", sideEffects: {} };
      },
      onTurnComplete: async () => {
        events.push("strategy.complete");
      },
    };

    const phases: string[] = [];
    const result = await runChatTurn(strategy, createContext(), {
      pluginRegistry: registry,
      onPhaseChange: (phase) => phases.push(phase),
    });

    expect(result.content).toBe("ok");
    expect(events).toEqual([
      "plugin.before",
      "strategy.context",
      "plugin.context",
      "strategy.presets",
      "strategy.generate",
      "strategy.complete",
      "plugin.after",
    ]);
    expect(phases).toEqual(["preparing", "streaming", "postprocessing", "idle"]);
  });
});
