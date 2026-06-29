import { getBackend } from "@/platform";
import {
  applyRegexRules,
  createGenerationStreamAccumulator,
  createModelProvider,
  estimateTokens,
  isReasoningCaptureEnabled,
  type GenerationHooks,
} from "@neo-tavern/core";
import type { BuiltPrompt, Character, GenerateMessage, Message, ModelConfig } from "@neo-tavern/shared";
import { agenticPlayStateRepository } from "@/db/repositories";
import { recordUsageCostAndWarn } from "@/features/billing/usage-cost";
import { withDeepSeekUsageCost } from "@/features/billing/deepseek-billing";
import { getChatScopedDeepSeekUserId, shouldOmitTemperatureForModel } from "@/features/settings/model-capabilities";
import {
  generateAgenticPlayTurn,
  type AgenticActionOption,
  type AgenticGameState,
} from "@/features/agentic-play/agentic-play";
import { useSettingsStore } from "@/features/settings/settings.store";
import { useChatStore } from "./chat.store";
import type { GenerationPhase } from "./chat.types";

const EMPTY_ASSISTANT_RETRY_LIMIT = 1;
const EMPTY_ASSISTANT_RETRY_MESSAGE = [
  "上一轮模型回复没有生成可显示的正文，Whale Play 正在自动重试。",
  "请重新生成当前这一轮角色回复，必须包含非空正文。",
  "如果当前预设要求使用 <content></content>，请把完整正文写在这个标签内。",
  "不要解释重试原因，不要输出道歉，只输出符合当前角色与预设格式的回复。",
].join("\n");
const FLOOD_GUARD_STOP_MESSAGE = "检测到模型重复输出，已自动停止生成。";

export type DebugPromptTrigger = "send" | "continue" | "regenerate" | "retry";

export interface DebugPromptContext {
  chatId: string;
  characterId: string;
  characterName: string;
  contextTokens: number;
  round: number;
  assistantMessageId: string;
  baseTrigger: Exclude<DebugPromptTrigger, "retry">;
  hiddenUserMessage: boolean;
}

interface SavedDebugPrompt {
  round: number;
  attempt: number;
  trigger: DebugPromptTrigger;
  baseTrigger: Exclude<DebugPromptTrigger, "retry">;
  folder: string;
  filename: string;
  path: string;
}

type AssistantPatch = Partial<
  Pick<
    Message,
    "content" | "reasoningContent" | "generateDuration" | "thinkingDuration" | "usage" | "images" | "agenticOptions"
  >
>;

export interface DesktopGenerationEffects {
  patchMessage: (id: string, patch: AssistantPatch, options?: { persist?: boolean }) => Promise<void>;
  deleteMessage: (id: string) => Promise<void>;
  setStreamingMessageId: (chatId: string, id: string | null) => void;
  setGenerationPhase: (chatId: string, phase: GenerationPhase) => void;
  onAgenticPlayStateUpdated?: (state: AgenticGameState) => void;
}

interface BaseGenerationParams {
  chatId: string;
  assistantId: string;
  built: BuiltPrompt;
  modelConfig: ModelConfig;
  controller: AbortController;
  debugContext?: DebugPromptContext;
  generationHooks?: Pick<GenerationHooks, "inspectOutput">;
  effects: DesktopGenerationEffects;
}

interface GenerateOnceResult {
  content: string;
  agenticOptions?: AgenticActionOption[];
  reasoningContent: string;
  usage?: Message["usage"];
  generateDuration: number;
  thinkingDuration: number;
}

interface GenerateAgenticOnceResult extends GenerateOnceResult {
  gameState: AgenticGameState;
}

function sanitizeDebugPathPart(value: string, fallback: string) {
  const cleaned = value
    // eslint-disable-next-line no-control-regex
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, "_")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[. ]+$/g, "");
  return cleaned || fallback;
}

function shortDebugId(value: string) {
  return value.replace(/[^a-z0-9]/gi, "").slice(0, 8) || "unknown";
}

export function getNextDebugRound(messages: Message[]) {
  return messages.filter((message) => message.role === "assistant" && message.usage).length + 1;
}

function notifyDebugPromptSaveFailed(error: unknown) {
  const toast = typeof window !== "undefined" ? window.__toast : null;
  const message = (error as Error).message || "Unknown error";
  if (toast) toast("error", `Debug prompt save failed: ${message}`);
}

export function isFloodGuardError(error: unknown) {
  return (error as Error).name === "FloodGuardAbortError";
}

function createFloodGuardError(reason: string) {
  const err = new Error(`${FLOOD_GUARD_STOP_MESSAGE}${reason ? ` ${reason}` : ""}`);
  err.name = "FloodGuardAbortError";
  return err;
}

function inspectGeneratedOutput(
  hooks: Pick<GenerationHooks, "inspectOutput"> | undefined,
  accumulated: string,
  controller: AbortController,
) {
  const result = hooks?.inspectOutput?.(accumulated);
  if (!result || result.pass) return;
  if (result.terminate) controller.abort();
  throw createFloodGuardError(result.reason);
}

function withDebugUsage(
  usage: Message["usage"] | undefined,
  debugPrompt?: SavedDebugPrompt,
): Message["usage"] | undefined {
  if (!debugPrompt) return usage;
  return {
    ...(usage ?? {}),
    debugRound: debugPrompt.round,
    debugAttempt: debugPrompt.attempt,
    debugTrigger: debugPrompt.trigger,
    debugBaseTrigger: debugPrompt.baseTrigger,
    debugPromptFolder: debugPrompt.folder,
    debugPromptFilename: debugPrompt.filename,
    debugPromptPath: debugPrompt.path,
  };
}

async function saveDebugPromptFile(
  debugContext: DebugPromptContext,
  built: BuiltPrompt,
  messages: GenerateMessage[],
  trigger: DebugPromptTrigger,
  attempt: number,
  userId?: string,
): Promise<SavedDebugPrompt> {
  const characterFolder = sanitizeDebugPathPart(debugContext.characterName, "character");
  const folder = `${characterFolder}_${shortDebugId(debugContext.chatId)}`;
  const roundStr = String(debugContext.round).padStart(4, "0");
  const filename = `round_${roundStr}_${trigger}_attempt_${attempt}_${shortDebugId(debugContext.assistantMessageId)}.json`;

  const debugPayload = {
    round: debugContext.round,
    usageRow: debugContext.round,
    trigger,
    baseTrigger: debugContext.baseTrigger,
    attempt,
    hiddenUserMessage: debugContext.hiddenUserMessage,
    assistantMessageId: debugContext.assistantMessageId,
    chatId: debugContext.chatId,
    characterId: debugContext.characterId,
    characterName: debugContext.characterName,
    contextTokens: debugContext.contextTokens,
    deepSeekUserId: userId,
    debugPromptFolder: folder,
    debugPromptFilename: filename,
    timestamp: new Date().toISOString(),
    messageCount: messages.length,
    estimatedTokens: estimateTokens(messages),
    contextBlocks: built.includedContextBlocks.map((block) => ({
      id: block.id,
      source: block.source,
      title: block.title,
      position: block.position,
      priority: block.priority,
      contentLength: block.content.length,
    })),
    messages,
  };

  const path = await getBackend().file.saveDebugPrompt(folder, filename, JSON.stringify(debugPayload, null, 2));

  return {
    round: debugContext.round,
    attempt,
    trigger,
    baseTrigger: debugContext.baseTrigger,
    folder,
    filename,
    path,
  };
}

function isGenerationActive(controller: AbortController) {
  return !controller.signal.aborted;
}

function throwGenerationStopped() {
  const err = new Error("Generation stopped");
  err.name = "AbortError";
  throw err;
}

function getAttemptMessages(built: BuiltPrompt, retrying: boolean) {
  if (!retrying) return built.messages;
  return [...built.messages, { role: "system" as const, content: EMPTY_ASSISTANT_RETRY_MESSAGE }];
}

function hasVisibleAssistantBody(content: string) {
  if (!content.trim()) return false;
  const rules = useSettingsStore.getState().getActiveRegexRules();
  if (!rules || rules.length === 0) return content.trim().length > 0;
  try {
    return applyRegexRules(content, rules).displayContent.trim().length > 0;
  } catch {
    return content.trim().length > 0;
  }
}

async function generateNormalAssistantOnce(
  params: BaseGenerationParams & {
    retrying: boolean;
    attempt: number;
  },
): Promise<GenerateOnceResult> {
  const {
    assistantId,
    built,
    chatId,
    controller,
    debugContext,
    effects,
    generationHooks,
    modelConfig,
    retrying,
    attempt,
  } = params;
  const provider = createModelProvider(modelConfig);
  const genStart = Date.now();
  let nextContent = "";
  let nextReasoningContent = "";
  let nextUsage: Message["usage"] | undefined;
  let thinkingDuration: number | undefined;
  const showLiveText = modelConfig.streamingEnabled !== false;
  const captureReasoning = isReasoningCaptureEnabled(modelConfig);
  const attemptMessages = getAttemptMessages(built, retrying);
  const userId = getChatScopedDeepSeekUserId(modelConfig, chatId);
  let debugPrompt: SavedDebugPrompt | undefined;
  const stream = createGenerationStreamAccumulator({
    reasoningDeltaMode: captureReasoning ? "reasoning" : "content",
    onContentDelta: (_delta, accumulated) => {
      thinkingDuration ??= Date.now() - genStart;
      nextContent = accumulated;
      effects.setGenerationPhase(chatId, "writing");
    },
    onReasoningDelta: (_delta, accumulated) => {
      nextReasoningContent = accumulated;
      if (useChatStore.getState().activeGenerations[chatId]?.generationPhase !== "writing") {
        effects.setGenerationPhase(chatId, retrying ? "retrying" : "thinking");
      }
    },
    onUsage: (usage) => {
      nextUsage = usage;
    },
  });

  if (debugContext) {
    try {
      debugPrompt = await saveDebugPromptFile(
        debugContext,
        built,
        attemptMessages,
        retrying ? "retry" : debugContext.baseTrigger,
        attempt,
        userId,
      );
    } catch (err) {
      notifyDebugPromptSaveFailed(err);
    }
  }

  effects.setGenerationPhase(chatId, retrying ? "retrying" : "thinking");
  await effects.patchMessage(
    assistantId,
    {
      content: "",
      reasoningContent: undefined,
      generateDuration: undefined,
      thinkingDuration: undefined,
      usage: undefined,
      agenticOptions: undefined,
    },
    { persist: false },
  );

  if (provider.streamGenerate) {
    for await (const chunk of provider.streamGenerate({
      messages: attemptMessages,
      model: modelConfig.model,
      omitTemperature: shouldOmitTemperatureForModel(modelConfig),
      temperature: modelConfig.temperature,
      maxTokens: modelConfig.maxTokens,
      reasoningEffort: modelConfig.reasoningEffort || undefined,
      userId,
      signal: controller.signal,
    })) {
      if (!isGenerationActive(controller)) throwGenerationStopped();
      await stream.acceptChunk(chunk);
      inspectGeneratedOutput(generationHooks, stream.content, controller);
      if (chunk.reasoningContentDelta || chunk.contentDelta || chunk.usage) {
        await effects.patchMessage(
          assistantId,
          {
            content: showLiveText ? stream.content : "",
            reasoningContent: stream.reasoningContent || undefined,
            thinkingDuration,
            usage: stream.usage,
          },
          { persist: false },
        );
      }
    }
  } else {
    const result = await provider.generate({
      messages: attemptMessages,
      model: modelConfig.model,
      omitTemperature: shouldOmitTemperatureForModel(modelConfig),
      temperature: modelConfig.temperature,
      maxTokens: modelConfig.maxTokens,
      reasoningEffort: modelConfig.reasoningEffort || undefined,
      userId,
      signal: controller.signal,
    });
    if (!isGenerationActive(controller)) throwGenerationStopped();
    thinkingDuration = Date.now() - genStart;
    effects.setGenerationPhase(chatId, "writing");
    const resultContent =
      !captureReasoning && result.reasoningContent && !result.content.trim() ? result.reasoningContent : result.content;
    const resultReasoningContent = captureReasoning ? (result.reasoningContent ?? "") : "";
    inspectGeneratedOutput(generationHooks, resultContent, controller);
    await effects.patchMessage(
      assistantId,
      {
        content: "",
        reasoningContent: resultReasoningContent || undefined,
        thinkingDuration,
        usage: result.usage,
      },
      { persist: false },
    );
    nextContent = resultContent;
    nextReasoningContent = resultReasoningContent;
    nextUsage = result.usage;
  }

  thinkingDuration ??= Date.now() - genStart;
  return {
    content: nextContent,
    reasoningContent: nextReasoningContent,
    usage: withDebugUsage(withDeepSeekUsageCost(nextUsage, modelConfig), debugPrompt),
    generateDuration: Date.now() - genStart,
    thinkingDuration,
  };
}

async function generateAgenticAssistantOnce(
  params: BaseGenerationParams & {
    character: Character;
    initialGameState: AgenticGameState;
    retrying: boolean;
    attempt: number;
  },
): Promise<GenerateAgenticOnceResult> {
  const {
    assistantId,
    built,
    character,
    chatId,
    controller,
    debugContext,
    effects,
    generationHooks,
    initialGameState,
    modelConfig,
    retrying,
    attempt,
  } = params;
  const provider = createModelProvider(modelConfig);
  const genStart = Date.now();
  const userId = getChatScopedDeepSeekUserId(modelConfig, chatId);
  let thinkingDuration: number | undefined;
  const showLiveText = modelConfig.streamingEnabled !== false;
  const captureReasoning = isReasoningCaptureEnabled(modelConfig);
  let debugPrompt: SavedDebugPrompt | undefined;
  const stream = createGenerationStreamAccumulator({
    reasoningDeltaMode: captureReasoning ? "reasoning" : "content",
    onContentDelta: () => {
      thinkingDuration ??= Date.now() - genStart;
      effects.setGenerationPhase(chatId, "writing");
    },
  });

  if (debugContext) {
    try {
      debugPrompt = await saveDebugPromptFile(
        debugContext,
        built,
        getAttemptMessages(built, retrying),
        retrying ? "retry" : debugContext.baseTrigger,
        attempt,
        userId,
      );
    } catch (err) {
      notifyDebugPromptSaveFailed(err);
    }
  }

  effects.setGenerationPhase(chatId, retrying ? "retrying" : "thinking");
  await effects.patchMessage(
    assistantId,
    {
      content: "",
      reasoningContent: undefined,
      generateDuration: undefined,
      thinkingDuration: undefined,
      usage: undefined,
      agenticOptions: undefined,
    },
    { persist: false },
  );

  const result = await generateAgenticPlayTurn({
    provider,
    modelConfig,
    builtPrompt: {
      ...built,
      messages: getAttemptMessages(built, retrying),
    },
    character,
    gameState: initialGameState,
    userId,
    signal: controller.signal,
    onToolRound: () => {
      effects.setGenerationPhase(chatId, retrying ? "retrying" : "thinking");
    },
    onDiceResult: (result) => {
      useChatStore.getState().setLastDiceResult(result);
    },
    onFinalRound: () => {
      effects.setGenerationPhase(chatId, "writing");
    },
    onContentDelta: async (delta) => {
      if (!isGenerationActive(controller)) throwGenerationStopped();
      await stream.acceptChunk({ contentDelta: delta });
      inspectGeneratedOutput(generationHooks, stream.content, controller);
      await effects.patchMessage(
        assistantId,
        {
          content: showLiveText ? stream.content : "",
          reasoningContent: stream.reasoningContent || undefined,
          thinkingDuration,
        },
        { persist: false },
      );
    },
    onReasoningDelta: async (delta) => {
      if (!isGenerationActive(controller)) throwGenerationStopped();
      await stream.acceptChunk({ reasoningContentDelta: delta });
      await effects.patchMessage(
        assistantId,
        {
          content: showLiveText ? stream.content : "",
          reasoningContent: stream.reasoningContent || undefined,
          thinkingDuration,
        },
        { persist: false },
      );
    },
    onContentReset: async () => {
      stream.resetContent();
      await effects.patchMessage(
        assistantId,
        {
          content: "",
          reasoningContent: stream.reasoningContent || undefined,
          thinkingDuration,
          agenticOptions: undefined,
        },
        { persist: false },
      );
    },
    requirePlayerOptions: true,
    captureReasoning,
  });

  if (!isGenerationActive(controller)) throwGenerationStopped();

  thinkingDuration ??= Date.now() - genStart;
  inspectGeneratedOutput(generationHooks, result.content, controller);
  const usage = withDebugUsage(withDeepSeekUsageCost(result.usage, modelConfig), debugPrompt);
  return {
    content: result.content,
    agenticOptions: result.agenticOptions,
    reasoningContent: result.reasoningContent ?? stream.reasoningContent,
    usage,
    generateDuration: Date.now() - genStart,
    thinkingDuration,
    gameState: result.gameState,
  };
}

export async function generateNormalAssistantWithRetry(params: BaseGenerationParams): Promise<string> {
  const { assistantId, chatId, effects } = params;
  for (let attempt = 0; attempt <= EMPTY_ASSISTANT_RETRY_LIMIT; attempt++) {
    const result = await generateNormalAssistantOnce({
      ...params,
      retrying: attempt > 0,
      attempt: attempt + 1,
    });
    void recordUsageCostAndWarn(result.usage);

    if (hasVisibleAssistantBody(result.content)) {
      await effects.patchMessage(assistantId, {
        content: result.content,
        reasoningContent: result.reasoningContent || undefined,
        generateDuration: result.generateDuration,
        thinkingDuration: result.thinkingDuration,
        usage: result.usage,
      });
      return result.content;
    }

    if (attempt < EMPTY_ASSISTANT_RETRY_LIMIT) {
      effects.setGenerationPhase(chatId, "retrying");
      await effects.patchMessage(
        assistantId,
        {
          content: "",
          reasoningContent: undefined,
          generateDuration: undefined,
          thinkingDuration: result.thinkingDuration,
          usage: result.usage,
        },
        { persist: false },
      );
      continue;
    }

    await effects.deleteMessage(assistantId);
    effects.setStreamingMessageId(chatId, null);
    throw new Error("AI returned an empty body after automatic retry.");
  }
  return "";
}

export async function generateAgenticAssistantWithRetry(
  params: BaseGenerationParams & {
    character: Character;
    initialGameState: AgenticGameState;
  },
): Promise<string> {
  const { assistantId, character, chatId, effects } = params;
  let currentState = params.initialGameState;
  for (let attempt = 0; attempt <= EMPTY_ASSISTANT_RETRY_LIMIT; attempt++) {
    const result = await generateAgenticAssistantOnce({
      ...params,
      initialGameState: currentState,
      retrying: attempt > 0,
      attempt: attempt + 1,
    });
    currentState = result.gameState;
    void recordUsageCostAndWarn(result.usage);

    if (hasVisibleAssistantBody(result.content)) {
      await agenticPlayStateRepository.updateState(chatId, character, result.gameState);
      effects.onAgenticPlayStateUpdated?.(result.gameState);
      await effects.patchMessage(assistantId, {
        content: result.content,
        agenticOptions: result.agenticOptions,
        reasoningContent: result.reasoningContent || undefined,
        generateDuration: result.generateDuration,
        thinkingDuration: result.thinkingDuration,
        usage: result.usage,
      });
      return result.content;
    }

    if (attempt < EMPTY_ASSISTANT_RETRY_LIMIT) {
      effects.setGenerationPhase(chatId, "retrying");
      await effects.patchMessage(
        assistantId,
        {
          content: "",
          reasoningContent: undefined,
          generateDuration: undefined,
          thinkingDuration: result.thinkingDuration,
          usage: result.usage,
          agenticOptions: undefined,
        },
        { persist: false },
      );
      continue;
    }

    await effects.deleteMessage(assistantId);
    effects.setStreamingMessageId(chatId, null);
    throw new Error("Agentic Play returned an empty body after automatic retry.");
  }
  return "";
}
