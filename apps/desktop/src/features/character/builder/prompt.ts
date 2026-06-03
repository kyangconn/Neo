import type { NeoBuilderTurnOptions, NeoBuilderChoice, NeoBuilderQuestion, NeoCreationPlan } from "./types";
import type { CreateCharacterInput, GenerateMessage } from "@neo-tavern/shared";
import { trimString, optionalString, normalizeStringArray } from "./utils";
import { normalizePersonalityPalette } from "./validation";

// ── One-shot prompts ──

export function buildSystemPrompt(): string {
  return [
    "你是 Whale Builder，一个基于 Skill 的角色卡生成 Agent。",
    "你的 Skill 定义在 SKILL.md 及 references/ 下的创作规范文档中。",
    "启动后必须先调用 read_skill_reference('SKILL.md') 加载 Skill 入口，再按 Skill 中的场景路由和流程执行。",
    "Skill 是你唯一的事实来源——工作流、数据格式、写作规则均以 Skill 为准。",
    "不确定读什么文档时调用 list_skill_references。",
    "完成后必须调用 save_character_draft 保存最终草稿。只有调用这个工具，产出物才会显示在右侧面板。不要只在普通文本里输出结果。",
    "输出内容面向中文用户。",
  ].join("\n");
}

export function buildUserPrompt(options: { concept: string; existingCharacter?: CreateCharacterInput | null }): string {
  return JSON.stringify({
    task: "根据用户材料生成角色卡草稿，格式以 Skill 规范为准。",
    userConcept: options.concept,
    existingCharacter: options.existingCharacter ?? null,
  });
}

// ── Chat prompts ──

export function buildChatSystemPrompt(options: NeoBuilderTurnOptions): string {
  return [
    "你是 Whale Builder，一个基于 Skill 的角色卡生成 Agent。",
    "你的 Skill 定义在 SKILL.md 及 references/ 下的创作规范文档中。",
    "启动后必须先调用 read_skill_reference('SKILL.md') 加载 Skill 入口。Skill 是你唯一的事实来源——工作流、数据格式、写作规则均以 Skill 为准。",
    "不确定读什么文档时调用 list_skill_references。",
    "你可以调用工具：列出/读取 Skill 规则、联网搜索、向用户给出选项追问、展示创作规划、校验草稿、保存草稿。",
    options.webSearchEnabled
      ? "联网搜索已开启。涉及真实地点、历史、职业、神话、作品风格、时代背景等资料时，可以调用 web_search。"
      : "联网搜索未开启。不要调用 web_search。",
    "同一创作阶段最多调用一次 ask_user_options；如果本阶段需要确认多个维度，把 2-5 个问题放进 questions 数组一次性询问。",
    "当信息足够时，必须调用 save_character_draft 保存草稿。只有调用这个工具，右侧面板才会显示角色卡和世界书产出物。不要在普通文本里输出完成信息，必须通过工具调用保存。",
    "回复要短、清楚、可操作。不展示原始 JSON。默认中文输出。",
  ].join("\n");
}

export function buildChatContextPrompt(options: NeoBuilderTurnOptions): string {
  return JSON.stringify(
    {
      task: "通过聊天协作生成或修改 Whale Play 原生角色卡。",
      currentTarget: options.existingCharacter ? "update_existing_character" : "create_new_character",
      existingCharacter: options.existingCharacter ?? null,
      currentDraft: options.currentDraft ?? null,
      currentWorldbookEntries: options.currentWorldbookEntries ?? [],
      creationPlan: options.creationPlan ?? null,
      personalityPalette: options.personalityPalette ?? null,
      neoOutputFields: {
        character: ["name", "description", "personality", "scenario", "firstMessage", "exampleDialogues", "tags"],
        personalityPalette: ["base", "main", "accents", "derivatives", "futureDerivatives"],
        creationPlan: ["project", "world", "characters", "style", "entries", "firstMessage", "yaml"],
        optionalWorldbookEntries: [
          "title",
          "keys",
          "content",
          "priority",
          "type",
          "triggerMode",
          "position",
          "role",
          "enabled",
          "entryPath",
          "entryTypeName",
        ],
      },
    },
    null,
    2,
  );
}

export function conversationToGenerateMessages(options: NeoBuilderTurnOptions): GenerateMessage[] {
  return [
    { role: "system", content: buildChatSystemPrompt(options) },
    { role: "user", content: buildChatContextPrompt(options) },
    ...options.conversation.map(
      (message): GenerateMessage => ({
        role: message.role,
        content: message.content,
      }),
    ),
  ];
}

// ── Auto-continue ──

export function shouldAutoContinueBuilderText(options: {
  content: string;
  finishReason?: string;
  textContinuations: number;
  toolLog: string[];
  creationPlan?: NeoCreationPlan;
  currentDraft?: CreateCharacterInput | null;
  currentWorldbookEntries?: CreateWorldbookEntryInput[];
}): boolean {
  if (options.textContinuations >= 5) return false;
  if (options.finishReason === "length" || options.finishReason === "max_tokens") return true;
  if (options.toolLog.includes("ask_user_options") || options.toolLog.includes("present_creation_plan")) {
    return false;
  }

  const content = options.content.trim();
  const hasWorkingState =
    !!options.creationPlan ||
    !!options.currentDraft ||
    !!options.currentWorldbookEntries?.length ||
    options.toolLog.length > 0;
  if (!hasWorkingState) return false;

  const mentionsNextWork =
    /(继续|接下来|下一步|进入|开始|现在|马上|准备|修复|补全|校验|验证|保存|草稿|产出物|条目|完成|已完成|所有条目|worldbook|firstMessage|exampleDialogues)/i.test(
      content,
    );
  const isOnlyProcessTalk = !/(已为你保存|产出物已准备好|右侧查看角色卡|请从下面选择|请选择一个|我需要你选择)/.test(
    content,
  );
  return mentionsNextWork && isOnlyProcessTalk;
}

import type { CreateWorldbookEntryInput } from "@neo-tavern/shared";

export function buildAutoContinueInstruction(options: {
  content: string;
  finishReason?: string;
  creationPlan?: NeoCreationPlan;
  hasDraft: boolean;
  hasWorldbookEntries: boolean;
}): string {
  const progress = getPlanProgress(options.creationPlan);
  return [
    "【Whale Builder 内部续跑指令】",
    "上一段只是过程说明，不能停在这里等待用户点击继续。",
    options.finishReason === "length" || options.finishReason === "max_tokens"
      ? "上一段可能因为输出长度被截断。请从中断处继续，不要重写已经完成的内容。"
      : "请立刻继续执行工作流，不要复述计划。",
    `当前创作规划进度：${progress.done}/${progress.total}。`,
    options.hasDraft ? "当前已有角色草稿。" : "当前还没有可保存的角色草稿。",
    options.hasWorldbookEntries ? "当前已有世界书条目。" : "当前还没有完整世界书条目。",
    "如果确实需要用户决定，必须调用 ask_user_options 给出选项；同一阶段有多个待确认点时，用 questions 数组一次性询问，不要拆成多轮普通文本追问。",
    "如果还在逐条产出，继续调用 record_entry_output 记录条目完成状态。",
    "如果条目已经完成，调用 validate_character_draft 校验；校验失败就修复并再次校验。",
    "校验通过后必须调用 save_character_draft 保存最终草稿。",
    "不要只输出\u201c现在开始校验/现在保存/接下来修复\u201d这类过程文字。",
    "",
    "上一段输出摘要：",
    trimString(options.content).slice(-1200),
  ].join("\n");
}

function getPlanProgress(plan?: NeoCreationPlan): { done: number; total: number } {
  const entries = plan?.entries ?? [];
  const done = entries.filter((entry) => entry.status === "done" || entry.status === "skipped").length;
  return { done, total: entries.length };
}

// ── Plan formatting ──

export function formatCreationPlan(args: Record<string, unknown>): string {
  const lines: string[] = [];
  const summary = trimString(args.summary);
  const characterPlan = trimString(args.characterPlan);
  const worldPlan = trimString(args.worldPlan);
  const firstMessagePlan = trimString(args.firstMessagePlan);
  const openQuestions = normalizeStringArray(args.openQuestions);
  const entryPlan = Array.isArray(args.entryPlan) ? args.entryPlan : [];
  const palette = normalizePersonalityPalette(args.personalityPalette);

  lines.push("我先把创作规划对齐一下：");
  if (summary) lines.push("", summary);
  if (characterPlan) lines.push("", `角色方向：${characterPlan}`);
  if (palette) {
    lines.push("", "性格调色盘：");
    if (palette.base) lines.push(`- 底色：${palette.base}`);
    if (palette.main.length) lines.push(`- 主色调：${palette.main.join("、")}`);
    if (palette.accents.length) lines.push(`- 点缀：${palette.accents.join("、")}`);
    if (palette.derivatives.length) {
      lines.push(`- 衍生：${palette.derivatives.map((item) => `${item.color} ${item.items.length} 条`).join("；")}`);
    } else {
      lines.push("- 衍生：待补全");
    }
  }
  if (worldPlan) lines.push("", `世界与规则：${worldPlan}`);
  if (entryPlan.length > 0) {
    lines.push("", "世界书条目：");
    for (const item of entryPlan.slice(0, 8)) {
      if (!item || typeof item !== "object") continue;
      const data = item as Record<string, unknown>;
      const title = trimString(data.title) || "未命名条目";
      const type = trimString(data.type);
      const purpose = trimString(data.purpose);
      const keys = trimString(data.keys);
      lines.push(
        `- ${title}${type ? `（${type}）` : ""}${purpose ? `：${purpose}` : ""}${keys ? `；keys: ${keys}` : ""}`,
      );
    }
  }
  if (firstMessagePlan) lines.push("", `开场切入：${firstMessagePlan}`);
  if (openQuestions.length > 0) {
    lines.push("", "需要你确认：");
    for (const question of openQuestions.slice(0, 4)) lines.push(`- ${question}`);
  }

  return lines.join("\n");
}

export function defaultPlanChoices(): NeoBuilderChoice[] {
  return [
    { id: "confirm_plan", label: "按规划继续", value: "确认，按这个 Whale Play 创作规划继续生成角色卡和世界书。" },
    { id: "adjust_plan", label: "我要调整", value: "我想调整这个创作规划：" },
    { id: "more_detail", label: "先补细节", value: "先别生成，继续问我几个会影响角色体验的关键细节。" },
  ];
}

// ── YAML helpers ──

export function yamlScalar(value: unknown, fallback = ""): string {
  const text = trimString(value) || fallback;
  if (!text) return '""';
  // eslint-disable-next-line no-useless-escape
  if (/[\]\[:#\n\r{}]/.test(text)) return JSON.stringify(text);
  return text;
}

export function yamlList(values: string[], indent = 4): string {
  const space = " ".repeat(indent);
  if (!values.length) return `${space}[]`;
  return values.map((value) => `${space}- ${yamlScalar(value)}`).join("\n");
}

// ── Plan YAML builder ──

export function buildCreationPlanYaml(plan: Omit<NeoCreationPlan, "yaml" | "updatedAt">): string {
  const lines: string[] = [];
  lines.push("project:");
  lines.push(`  name: ${yamlScalar(plan.project.name, "Whale Builder")}`);
  lines.push(`  worldbookName: ${yamlScalar(plan.project.worldbookName)}`);
  lines.push(`  form: ${plan.project.form}`);
  if (plan.project.sourceType) lines.push(`  sourceType: ${yamlScalar(plan.project.sourceType)}`);
  if (plan.project.planningMode) lines.push(`  planningMode: ${yamlScalar(plan.project.planningMode)}`);
  lines.push("");
  lines.push("world:");
  lines.push(`  overview: ${yamlScalar(plan.world?.overview)}`);
  lines.push("  regions:");
  lines.push(yamlList(plan.world?.regions ?? [], 4));
  lines.push("  factions:");
  lines.push(yamlList(plan.world?.factions ?? [], 4));
  lines.push("");
  lines.push("characters:");
  if (plan.characters.length) {
    for (const character of plan.characters) {
      lines.push(`  - name: ${yamlScalar(character.name)}`);
      if (character.identity) lines.push(`    identity: ${yamlScalar(character.identity)}`);
      if (character.relationship) lines.push(`    relationship: ${yamlScalar(character.relationship)}`);
      lines.push("    palette:");
      lines.push(`      base: ${yamlScalar(character.palette?.base)}`);
      lines.push("      main:");
      lines.push(yamlList(character.palette?.main ?? [], 8));
      lines.push("      accents:");
      lines.push(yamlList(character.palette?.accents ?? [], 8));
    }
  } else {
    lines.push("  []");
  }
  lines.push("");
  lines.push("style:");
  if (plan.style) {
    lines.push(`  perspective: ${yamlScalar(plan.style.perspective)}`);
    lines.push(`  tone: ${yamlScalar(plan.style.tone)}`);
    lines.push(`  mood: ${yamlScalar(plan.style.mood)}`);
  }
  lines.push("");
  lines.push("entries:");
  if (plan.entries.length) {
    for (const entry of plan.entries) {
      lines.push(`  - name: ${yamlScalar(entry.name)}`);
      lines.push(`    type: ${entry.type}`);
      if (entry.scope) lines.push(`    scope: ${yamlScalar(entry.scope)}`);
      if (entry.keys?.length) lines.push(`    keys: ${entry.keys.join(", ")}`);
    }
  } else {
    lines.push("  []");
  }
  lines.push("");
  lines.push("firstMessage:");
  if (plan.firstMessage) {
    lines.push(`  scene: ${yamlScalar(plan.firstMessage.scene)}`);
    lines.push(`  openingSituation: ${yamlScalar(plan.firstMessage.openingSituation)}`);
  }
  return lines.join("\n");
}

// ── Choices ──

export function normalizeChoices(value: unknown): NeoBuilderChoice[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item, index): NeoBuilderChoice | null => {
      if (!item || typeof item !== "object") return null;
      const data = item as Record<string, unknown>;
      const label = trimString(data.label);
      const optionValue = trimString(data.value) || label;
      if (!label || !optionValue) return null;
      return {
        id: trimString(data.id) || `choice_${index + 1}`,
        label,
        value: optionValue,
        description: optionalString(data.description),
      };
    })
    .filter((choice): choice is NeoBuilderChoice => !!choice)
    .slice(0, 4);
}

export function normalizeQuestionBundle(args: Record<string, unknown>): NeoBuilderQuestion[] {
  const rawQuestions = Array.isArray(args.questions) ? args.questions : [];
  const questions = rawQuestions
    .map((item, index): NeoBuilderQuestion | null => {
      if (!item || typeof item !== "object") return null;
      const data = item as Record<string, unknown>;
      const question = trimString(data.question) || trimString(data.title);
      const choices = normalizeChoices(data.options ?? data.choices);
      if (!question || choices.length < 2) return null;
      return {
        id: trimString(data.id) || `question_${index + 1}`,
        question,
        reason: optionalString(data.reason),
        choices,
      };
    })
    .filter((question): question is NeoBuilderQuestion => !!question)
    .slice(0, 5);

  if (questions.length > 0) return questions;

  const question = trimString(args.question) || "你想把这个角色往哪个方向推进？";
  const choices = normalizeChoices(args.options ?? args.choices);
  if (choices.length < 2) return [];
  return [
    {
      id: trimString(args.id) || "question_1",
      question,
      reason: optionalString(args.reason),
      choices,
    },
  ];
}
