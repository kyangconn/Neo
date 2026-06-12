import type { BuildPromptInput, BuiltPrompt, GenerateMessage, ContextBlock } from "@neo-tavern/shared";

const DEFAULT_SYSTEM_RULES = [
  "你正在扮演所选角色。",
  "始终与角色设定和场景保持一致。",
  "除非用户明确要求，否则不要替用户说话或行动。",
  "保持与最近的对话消息一致。",
  "遵守适用的安全规则，避免不当内容。",
].join("\n");

const DIALOGUE_FORMAT_RULES = [
  "",
  "对话格式要求：",
  '当角色说话时，在每句对话前加上角色名和冒号，格式如：角色名："对话内容"',
  "每句对话独占一行，与叙述文字分开。",
  "此格式仅用于实际说出声的对话。叙述和内心活动保持普通文本格式。",
].join("\n");

function estTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export function trimMessagesByTokens(
  messages: { role: string; content: string }[],
  maxTokens: number,
): { role: string; content: string }[] {
  if (messages.length === 0) return [];
  if (maxTokens <= 0) return [...messages];
  let total = 0;
  const kept: typeof messages = [];
  for (let i = messages.length - 1; i >= 0; i--) {
    const tokens = Math.ceil(messages[i].content.length / 4);
    if (total + tokens > maxTokens && kept.length > 0) break;
    kept.unshift(messages[i]);
    total += tokens;
  }
  return kept;
}

function contextBlockToMessage(block: ContextBlock, safeReplace: (value: string) => string): GenerateMessage {
  return {
    role: block.role ?? "system",
    content: safeReplace(`[${block.source}] ${block.title}\n${block.content}`),
  };
}

function contextBlockToText(block: ContextBlock): string {
  return [`### ${block.title}`, block.content].filter(Boolean).join("\n");
}

function formatExtraPresetEntry(name: string, content: string): string | null {
  const trimmed = content.trim();
  if (!trimmed) return null;
  return [`<extra_preset_entry name="${name}">`, trimmed, "</extra_preset_entry>"].join("\n");
}

function extraPresetEntryToMessage(
  name: string,
  content: string,
  safeReplace: (value: string) => string,
): GenerateMessage | null {
  const entry = formatExtraPresetEntry(name, content);
  if (!entry) return null;
  return {
    role: "system",
    content: safeReplace(entry),
  };
}

function chatHistoryToExtraPresetEntryMessage(content: string): GenerateMessage | null {
  const entry = formatExtraPresetEntry("chat history", content);
  return entry ? { role: "system", content: entry } : null;
}

const EXTRA_PRESET_SLOT_PATTERN = /<extra_preset_slot\s+name="([^"]+)"\s*\/>/g;

function hasPresetSlot(items: { content: string }[], name: string): boolean {
  return items.some((item) => {
    EXTRA_PRESET_SLOT_PATTERN.lastIndex = 0;
    return Array.from(item.content.matchAll(EXTRA_PRESET_SLOT_PATTERN)).some((match) => match[1] === name);
  });
}

function resolvePresetItemContent(
  content: string,
  safeReplace: (value: string) => string,
  runtimeEntries: Record<string, string | undefined>,
): string {
  let resolved = "";
  let lastIndex = 0;
  for (const match of content.matchAll(EXTRA_PRESET_SLOT_PATTERN)) {
    resolved += safeReplace(content.slice(lastIndex, match.index));
    resolved += runtimeEntries[match[1]] ?? "";
    lastIndex = (match.index ?? 0) + match[0].length;
  }
  resolved += safeReplace(content.slice(lastIndex));
  return resolved;
}

function buildPresetContent(
  items: { content: string }[],
  safeReplace: (value: string) => string,
  runtimeEntries: Record<string, string | undefined>,
): string {
  return items
    .map((item) => resolvePresetItemContent(item.content, safeReplace, runtimeEntries))
    .filter((content) => content.trim().length > 0)
    .join("\n\n");
}

function contextBlocksToExtraPresetEntry(
  name: string,
  blocks: ContextBlock[],
  safeReplace: (value: string) => string,
): GenerateMessage | null {
  return extraPresetEntryToMessage(name, blocks.map(contextBlockToText).join("\n\n"), safeReplace);
}

function historyMessagesToText(messages: GenerateMessage[]): string {
  return messages
    .map((message, index) => [`### ${index + 1}. ${message.role}`, message.content].join("\n"))
    .join("\n\n");
}

function insertDepthBlocks(history: GenerateMessage[], blocks: ContextBlock[], safeReplace: (value: string) => string) {
  const next = [...history];
  for (const block of blocks) {
    const depth = Math.max(0, Math.floor(block.depth ?? 0));
    const index = Math.max(0, next.length - depth);
    next.splice(index, 0, contextBlockToMessage(block, safeReplace));
  }
  return next;
}

export function buildChatPrompt(input: BuildPromptInput): BuiltPrompt {
  const messages: GenerateMessage[] = [];
  const uname = input.userName || "User";
  const characterName = input.character.name || "Character";

  const safeReplace = (s: string) =>
    s
      .replace(/\{\{user\}\}/gi, uname)
      .replace(/<user>/gi, uname)
      .replace(/\{\{(?:char|character)\}\}/gi, characterName)
      .replace(/<(?:char|character)>/gi, characterName);

  const systemRules = input.systemRules ?? DEFAULT_SYSTEM_RULES;
  const characterBlock = safeReplace(
    [
      `Character Name: ${input.character.name}`,
      `Description: ${input.character.description}`,
      `Personality: ${input.character.personality}`,
      `Scenario: ${input.character.scenario}`,
      input.character.exampleDialogues ? `Example Dialogues:\n${input.character.exampleDialogues}` : "",
    ]
      .filter(Boolean)
      .join("\n\n"),
  );

  const sortedPresetItems = (input.presetItems ?? []).slice().sort((a, b) => a.injectionOrder - b.injectionOrder);

  const hasSystemPreset = sortedPresetItems.some((p) => p.role === "system");
  const hasStaticWorldbookSlot = hasPresetSlot(sortedPresetItems, "前置世界书");
  const hasChatHistorySlot = hasPresetSlot(sortedPresetItems, "chat history");
  const hasRecalledWorldbookSlot = hasPresetSlot(sortedPresetItems, "召回世界书");
  const presetOverheadContent = buildPresetContent(sortedPresetItems, safeReplace, {});

  const sortedContextBlocks = [...(input.contextBlocks ?? [])].sort(
    (a, b) => b.priority - a.priority || a.title.localeCompare(b.title) || a.id.localeCompare(b.id),
  );
  const beforeHistoryBlocks = sortedContextBlocks.filter(
    (block) => (block.position ?? "beforeHistory") === "beforeHistory",
  );
  const atDepthBlocks = sortedContextBlocks.filter((block) => block.position === "atDepth");
  const afterHistoryBlocks = sortedContextBlocks.filter((block) => block.position === "afterHistory");
  const beforeHistoryWorldbookBlocks = beforeHistoryBlocks.filter((block) => block.source === "worldbook");
  const atDepthWorldbookBlocks = atDepthBlocks.filter((block) => block.source === "worldbook");
  const recalledWorldbookBlocks = afterHistoryBlocks.filter((block) => block.source === "worldbook");
  const stableWorldbookBlocks = [...beforeHistoryWorldbookBlocks, ...atDepthWorldbookBlocks];
  const nonWorldbookBeforeHistoryBlocks = beforeHistoryBlocks.filter((block) => block.source !== "worldbook");
  const nonWorldbookAtDepthBlocks = atDepthBlocks.filter((block) => block.source !== "worldbook");
  const nonWorldbookAfterHistoryBlocks = afterHistoryBlocks.filter((block) => block.source !== "worldbook");

  const userInputMsg: GenerateMessage = { role: "user", content: input.userInput };

  const contextTokenOverhead = sortedContextBlocks.reduce(
    (sum, block) => sum + estTokens(block.title) + estTokens(block.content),
    0,
  );
  const firstMessage =
    input.character.firstMessage && input.recentMessages.length === 0
      ? { role: "assistant" as const, content: safeReplace(input.character.firstMessage) }
      : null;

  let historyMessages: GenerateMessage[];
  const maxTokens = input.maxTotalTokens && input.maxTotalTokens > 0 ? input.maxTotalTokens : 0;
  if (maxTokens > 0) {
    let overhead = estTokens(DIALOGUE_FORMAT_RULES);
    if (!hasSystemPreset) overhead += estTokens(safeReplace(systemRules));
    if (presetOverheadContent) overhead += estTokens(presetOverheadContent);
    overhead += estTokens(characterBlock);
    if (input.userPersona) overhead += estTokens(safeReplace(`User Persona:\n${input.userPersona}`));
    overhead += estTokens(input.userInput);
    overhead += contextTokenOverhead;
    if (firstMessage) overhead += estTokens(firstMessage.content);

    const historyBudget = maxTokens - overhead - 100;
    const trimmed =
      historyBudget > 0 ? trimMessagesByTokens(input.recentMessages, historyBudget) : input.recentMessages.slice(-2);

    historyMessages = trimmed.map((message) => ({
      role: message.role as "user" | "assistant" | "system",
      content: message.content,
    }));
  } else {
    historyMessages = input.recentMessages.map((message) => ({
      role: message.role as "user" | "assistant" | "system",
      content: message.content,
    }));
  }

  if (firstMessage) historyMessages.push(firstMessage);

  const historyWithDepthBlocks = insertDepthBlocks(historyMessages, nonWorldbookAtDepthBlocks, safeReplace);
  const historyEntryText = formatExtraPresetEntry("chat history", historyMessagesToText(historyWithDepthBlocks)) ?? "";
  const stableWorldbookEntryText = formatExtraPresetEntry(
    "前置世界书",
    stableWorldbookBlocks.map(contextBlockToText).join("\n\n"),
  );
  const recalledWorldbookEntryText = formatExtraPresetEntry(
    "召回世界书",
    recalledWorldbookBlocks.map(contextBlockToText).join("\n\n"),
  );
  const runtimePresetEntries = {
    "chat history": historyEntryText,
    前置世界书: stableWorldbookEntryText ? safeReplace(stableWorldbookEntryText) : "",
    召回世界书: recalledWorldbookEntryText ? safeReplace(recalledWorldbookEntryText) : "",
  };
  const presetContent = buildPresetContent(sortedPresetItems, safeReplace, runtimePresetEntries);
  const presetMessage: GenerateMessage | null = presetContent
    ? {
        role: hasSystemPreset ? "system" : (sortedPresetItems[0]?.role ?? "system"),
        content: presetContent,
      }
    : null;

  if (!hasSystemPreset) {
    messages.push({
      role: "system",
      content: safeReplace(systemRules + DIALOGUE_FORMAT_RULES),
    });
  }

  if (presetMessage) messages.push(presetMessage);

  messages.push({ role: "system", content: characterBlock });

  if (input.userPersona) {
    messages.push({ role: "system", content: safeReplace(`User Persona:\n${input.userPersona}`) });
  }

  for (const block of nonWorldbookBeforeHistoryBlocks) {
    messages.push(contextBlockToMessage(block, safeReplace));
  }

  const stableWorldbookMessage = contextBlocksToExtraPresetEntry("前置世界书", stableWorldbookBlocks, safeReplace);
  if (!hasStaticWorldbookSlot && stableWorldbookMessage) messages.push(stableWorldbookMessage);

  const historyMessage = chatHistoryToExtraPresetEntryMessage(historyMessagesToText(historyWithDepthBlocks));
  if (!hasChatHistorySlot && historyMessage) messages.push(historyMessage);

  const recalledWorldbookMessage = contextBlocksToExtraPresetEntry("召回世界书", recalledWorldbookBlocks, safeReplace);
  if (!hasRecalledWorldbookSlot && recalledWorldbookMessage) messages.push(recalledWorldbookMessage);

  for (const block of nonWorldbookAfterHistoryBlocks) {
    messages.push(contextBlockToMessage(block, safeReplace));
  }

  messages.push(userInputMsg);

  const previewText = messages.map((message) => `## ${message.role}\n${message.content}`).join("\n\n---\n\n");

  const tokenEstimate = estimateTokens(messages);

  return {
    messages,
    previewText,
    tokenEstimate,
    includedContextBlocks: sortedContextBlocks,
  };
}

export function estimateTokens(messages: GenerateMessage[]): number {
  const text = messages.map((m) => m.content).join("\n");
  return Math.ceil(text.length / 4);
}

export { DEFAULT_SYSTEM_RULES, DIALOGUE_FORMAT_RULES };
