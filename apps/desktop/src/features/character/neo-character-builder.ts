import { createModelProvider } from '@neo-tavern/core'
import type {
  CreateCharacterInput,
  CreateWorldbookEntryInput,
  GenerateInput,
  GenerateMessage,
  GenerateResult,
  GenerateToolDefinition,
  GenerateToolCall,
  MessageUsage,
  ModelConfig,
  ModelProvider,
  WorldbookInsertPosition,
} from '@neo-tavern/shared'
import { withDeepSeekUsageCost } from '@/features/billing/deepseek-billing'
import { getChatScopedDeepSeekUserId, shouldOmitTemperatureForModel } from '@/features/settings/model-capabilities'
import {
  NEO_BUILDER_REFERENCE_LOOKUP_IDS,
  NEO_BUILDER_REFERENCE_TEXTS,
  listNeoBuilderSkillReferences,
  readNeoBuilderSkillReference,
} from './neo-builder-skill-references'

export interface NeoCharacterBuilderOptions {
  concept: string
  existingCharacter?: CreateCharacterInput | null
  modelConfig: ModelConfig
  scopeId?: string | null
  signal?: AbortSignal
}

export interface NeoCharacterBuilderResult {
  character: CreateCharacterInput
  worldbookName?: string
  worldbookDescription?: string
  worldbookEntries: CreateWorldbookEntryInput[]
  personalityPalette?: NeoPersonalityPalette
  creationPlan?: NeoCreationPlan
  evaluationReport?: NeoBuilderEvaluationReport
  notes?: string
  usage?: MessageUsage
  toolLog: string[]
}

export interface NeoBuilderChoice {
  id: string
  label: string
  value: string
  description?: string
}

export interface NeoPersonalityPalette {
  base: string
  main: string[]
  accents: string[]
  derivatives: Array<{
    color: string
    items: string[]
  }>
  futureDerivatives?: string[]
  notes?: string
  compiledText?: string
}

export interface NeoCreationPlanEntry {
  id: string
  name: string
  type: string
  path?: string
  part?: string
  scope?: string
  purpose?: string
  keys?: string[]
  sourceChapters?: string[]
  status: 'planned' | 'in_progress' | 'done' | 'skipped'
  outputRef?: string
  skipReason?: string
}

export interface NeoCreationPlan {
  project: {
    name: string
    worldbookName?: string
    form: 'charactercard' | 'worldbook'
    sourceType?: string
    planningMode?: string
  }
  world?: {
    overview?: string
    regions?: string[]
    factions?: string[]
  }
  characters: Array<{
    name: string
    identity?: string
    relationship?: string
    palette?: {
      base?: string
      main?: string[]
      accents?: string[]
    }
  }>
  style?: {
    perspective?: string
    tone?: string
    mood?: string
  }
  entries: NeoCreationPlanEntry[]
  firstMessage?: {
    format?: string
    scene?: string
    openingSituation?: string
    wordCount?: string
  }
  openQuestions?: string[]
  yaml: string
  updatedAt: string
}

export interface NeoBuilderEvaluationReport {
  summary: string
  issues: Array<{
    severity: 'high' | 'medium' | 'low'
    target: string
    message: string
  }>
  suggestions: string[]
  score?: number
}

export interface NeoBuilderConversationMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface NeoBuilderWebSearchResult {
  title: string
  url: string
  snippet: string
}

export interface NeoBuilderToolEvent {
  id: string
  name: string
  label: string
  status: 'running' | 'done' | 'error'
  args?: Record<string, unknown>
  result?: unknown
  error?: string
}

export interface NeoBuilderTurnOptions {
  conversation: NeoBuilderConversationMessage[]
  existingCharacter?: CreateCharacterInput | null
  currentDraft?: CreateCharacterInput | null
  currentWorldbookEntries?: CreateWorldbookEntryInput[]
  creationPlan?: NeoCreationPlan | null
  personalityPalette?: NeoPersonalityPalette | null
  modelConfig: ModelConfig
  scopeId?: string | null
  webSearchEnabled?: boolean
  searchWeb?: (query: string, limit?: number) => Promise<NeoBuilderWebSearchResult[]>
  onToolEvent?: (event: NeoBuilderToolEvent) => void
  onContentDelta?: (delta: string) => void
  onReasoningDelta?: (delta: string) => void
  signal?: AbortSignal
}

export interface NeoBuilderTurnResult {
  content: string
  choices?: NeoBuilderChoice[]
  draft?: Omit<NeoCharacterBuilderResult, 'usage' | 'toolLog'>
  creationPlan?: NeoCreationPlan
  personalityPalette?: NeoPersonalityPalette
  evaluationReport?: NeoBuilderEvaluationReport
  usage?: MessageUsage
  reasoningContent?: string
  toolEvents: NeoBuilderToolEvent[]
  toolLog: string[]
}

type DraftPayload = {
  character?: Partial<CreateCharacterInput>
  worldbookName?: unknown
  worldbookDescription?: unknown
  worldbookEntries?: unknown
  personalityPalette?: unknown
  creationPlan?: unknown
  notes?: unknown
}

type ValidationResult = {
  draft: Omit<NeoCharacterBuilderResult, 'usage' | 'toolLog'>
  issues: string[]
}

const REFERENCE_TEXTS: Record<string, string> = {
  'neo-workflow': [
    '---',
    'name: neo-character-builder',
    'description: "创建、补全、评估 Whale Play 原生角色卡和世界书。覆盖角色信息、世界观、NPC、场景、事件、文风、开场白、前置世界书和关键词召回世界书。支持从零创作和从现有材料转化。确保在用户提到角色设定、人设卡、character card、角色卡、世界书条目、世界观设定、NPC 设定、文风指导、开场白等需求时使用。当前 Whale Builder 不生成 MVU、EJS、SillyTavern forge、项目目录、脚本文件或外部打包说明。"',
    '---',
    '',
    '# Whale Play 角色卡与世界书编写',
    '',
    '帮助用户创建 Whale Play 原生角色卡与可绑定世界书。覆盖角色人设编写、世界观构建、NPC/组织/地点设定、场景钩子、开场白创作、世界书条目规划等流程。聚焦于 Whale Play 当前支持的字段和 UI 产出物，不涉及通用脚本逻辑、MVU、EJS、forge 配置或外部项目打包。',
    '',
    '## 术语说明',
    '',
    '"角色卡"在 Whale Builder 中指 Whale Play 角色库里可保存的一张角色实体，字段包括 name, description, personality, scenario, firstMessage, exampleDialogues, tags。一个 Builder 工作台还可以同时产出世界书条目，并在用户点击创建后绑定到该角色。',
    '',
    '"世界书"指长期背景和召回规则。always 条目用于前置世界书，trigger 条目用于关键词召回世界书。',
    '',
    '## 用户占位约定',
    '',
    'Whale Play 当前不强制使用 SillyTavern 宏。默认用自然语言给用户留入口，不替用户决定身份、动作或情绪。若用户明确要求使用 `{{user}}` 或 `<user>`，可以在 firstMessage 或 exampleDialogues 中保留该占位。',
    '',
    '## 场景路由',
    '',
    '判断三个维度，组合决定流程：',
    '',
    '1. 任务阶段：创建 / 补全 / 评估',
    '2. 创建来源：从零 / 从材料转化 / 联网资料辅助',
    '3. 任务范围：完整角色卡 / 局部字段 / 世界书条目 / 开场白',
    '',
    '常见组合：',
    '',
    '| 组合 | 流程 |',
    '|------|------|',
    '| 创建 + 从零 + 完整角色卡 | 需求对齐：核心方向 → 需求对齐：角色/世界/条目 → 角色字段创作 → 世界书条目创作 → 开场白 → 校验草稿 → 保存产出物 |',
    '| 创建 + 从材料 + 完整角色卡 | 材料提炼 → 需求对齐：缺口和创作边界 → 角色字段创作 → 世界书条目创作 → 开场白 → 校验草稿 → 保存产出物 |',
    '| 创建 + 联网资料辅助 | 联网搜索 → 提炼可用事实 → 转化为角色设定和世界书规则 → 校验草稿 → 保存产出物 |',
    '| 创建 + 局部任务 | 直接定位对应规则，例如 basic-info、personality-palette、first-message 或 worldbook |',
    '| 补全 + 未保存工作台 | 读取当前对话和草稿 → 追问缺失信息 → 更新产出物 |',
    '| 评估 | 检查字段完整性、世界书 keys、开场白是否替用户行动、设定是否一致，给出简短修正建议 |',
    '',
    '## 完整创作流程',
    '',
    '1. 需求对齐：核心方向',
    '   - 收集角色类型、题材、关系入口、冲突强度、是否需要世界书、是否需要联网资料。',
    '   - 信息不足时调用 ask_user_options，给出 2-4 个可点击选项。',
    '2. 需求对齐：角色/世界/条目',
    '   - 明确 name、身份、外观、说话习惯、关系边界、场景入口、主要冲突。',
    '   - 判断哪些内容应写进角色字段，哪些应拆成世界书条目。',
    '3. 创建角色字段',
    '   - description 写可观察信息、身份、外观、说话习惯、关系边界。',
    '   - personality 写稳定行为倾向、价值观、弱点、压力反应、互动节奏。',
    '   - scenario 写开局环境、当前冲突、用户进入场景的方式。',
    '   - exampleDialogues 用短对话展示角色声音。用“用户:”和“角色名:”格式即可。',
    '4. 创建世界书条目',
    '   - always 条目作为前置世界书，默认 position 使用 beforeHistory，keys 可为空。',
    '   - trigger 条目作为召回世界书，默认 position 使用 afterHistory，必须提供可命中的 keys。',
    '   - 条目只写模型需要记住的事实和规则，不写说明为什么需要它。',
    '5. 编写开场白',
    '   - firstMessage 必须是角色已经在场景中说出的第一条消息，包含动作与语气，不写说明书。',
    '   - 不替用户回答，不替用户做动作。',
    '6. 校验草稿',
    '   - 调用 validate_character_draft 检查必填字段和世界书 trigger keys。',
    '   - 发现问题时修正，不把原始 JSON 展示给用户。',
    '7. 保存产出物',
    '   - 调用 save_character_draft 保存最终 Whale Play 草稿。',
    '   - 保存的是 Builder 产出物；真正写入 Whale Play 角色库由用户点击右侧“创建”按钮完成。',
    '',
    '## 状态文件',
    '',
    'Whale Builder 不创建项目目录。工作台记录保存在应用本地存储中，用于恢复“构思中 / 待保存 / 已保存”的创作记录。',
    '',
    '## 工具参考',
    '',
    '- read_skill_reference：读取 Whale Play 工作流和字段规则。',
    '- ask_user_options：信息不足时向用户提出选项。',
    '- web_search：联网搜索真实资料，必须在联网搜索开启时使用。',
    '- validate_character_draft：校验角色草稿和世界书条目。',
    '- save_character_draft：保存最终 Builder 产出物。',
    '',
    '## 参考资料',
    '',
    '此索引是 Whale Builder 内置 reference 的权威来源。按需读取：',
    '',
    '```',
    'neo-workflow          —— Whale Play 角色卡与世界书完整工作流',
    'rules                 —— 写作质量规则',
    'basic-info            —— 基础信息整理',
    'personality-palette   —— 人格调色板',
    'first-message         —— 开场白创作',
    'worldbook             —— 世界书条目规则',
    '```',
  ].join('\n'),
  rules: [
    'Whale Play 角色卡质量规则：',
    '- 具体优先。不要用“神秘”“复杂”“很有魅力”这类空泛词替代可行动细节。',
    '- 写能驱动对话的矛盾：欲望、限制、误解、危险、秘密、职责或关系拉扯。',
    '- 避免把用户行为写死。给用户入口，不替用户决定身份、动作或情感。',
    '- 避免系统提示腔。角色卡内容应像可执行设定，不像教程。',
    '- 保持一致性：身份、能力边界、语气、世界规则不能互相打架。',
    '- 默认中文输出，除非用户材料明确要求其他语言。',
    '- 不要塞入和当前角色无关的大段百科。世界书条目要短、准、可召回。',
  ].join('\n'),
  'basic-info': [
    '基础信息整理：',
    '- name 简洁明确，除非用户要求别名，不要堆长称号。',
    '- description 包含年龄段/种族/职业/外观/日常姿态/关键关系，但避免表格。',
    '- 若用户只给一句灵感，也要补足可对话的场景钩子，但不要虚构过多复杂专有名词。',
    '- tags 只放 2-6 个短标签，例如 fantasy, detective, cyberpunk, slow-burn。',
  ].join('\n'),
  'personality-palette': [
    '人格调色板：',
    '- personality 至少覆盖：核心动机、待人方式、压力反应、亲近后的变化、禁区或弱点。',
    '- 用行为描述替代抽象评价。例如“紧张时会检查袖扣三次”比“很焦虑”更有用。',
    '- 角色不能永远顺从，也不能无缘无故敌对。给出可理解的边界。',
  ].join('\n'),
  'first-message': [
    '首条消息规则：',
    '- firstMessage 直接开始互动，不要写“这是开场白”。',
    '- 包含场景感、角色动作、对用户的自然抛问或压力点。',
    '- 不要替用户回答，不要替用户做动作。',
    '- 长度通常 120-350 字，除非用户要求极短或长篇。',
  ].join('\n'),
  worldbook: [
    'Whale Play 世界书规则：',
    '- always 条目是前置世界书，默认 position 使用 beforeHistory，keys 可为空。',
    '- trigger 条目是召回世界书，默认 position 使用 afterHistory，必须提供可命中的 keys。',
    '- keys 用逗号分隔，例如“白塔, 塔主, 银钥”。',
    '- content 只写模型需要记住的事实和规则，不写解释为什么需要这个条目。',
    '- 每个条目建议 80-240 字；宁可拆成多个条目，也不要塞成一整篇设定文。',
  ].join('\n'),
  ...NEO_BUILDER_REFERENCE_TEXTS,
}

const TOOL_DEFINITIONS: GenerateToolDefinition[] = [
  {
    type: 'function',
    function: {
      name: 'read_skill_reference',
      description: '读取 Whale Play 角色卡生成工作流的本地参考资料。',
      parameters: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            enum: Object.keys(REFERENCE_TEXTS),
            description: '要读取的参考资料 id、路径或兼容别名。',
          },
        },
        required: ['id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'validate_character_draft',
      description: '检查 Whale Play 角色卡草稿是否满足字段、世界书和质量要求。',
      parameters: {
        type: 'object',
        properties: {
          character: { type: 'object' },
          worldbookName: { type: 'string' },
          worldbookDescription: { type: 'string' },
          worldbookEntries: { type: 'array', items: { type: 'object' } },
          personalityPalette: { type: 'object' },
          creationPlan: { type: 'object' },
          notes: { type: 'string' },
        },
        required: ['character'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'save_character_draft',
      description: '保存最终 Whale Play 角色卡草稿。草稿必须已经满足 Whale Play 字段和世界书规则。',
      parameters: {
        type: 'object',
        properties: {
          character: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              personality: { type: 'string' },
              scenario: { type: 'string' },
              firstMessage: { type: 'string' },
              exampleDialogues: { type: 'string' },
              tags: { type: 'array', items: { type: 'string' } },
            },
            required: ['name', 'description', 'personality', 'scenario', 'firstMessage'],
          },
          worldbookName: { type: 'string' },
          worldbookDescription: { type: 'string' },
          worldbookEntries: { type: 'array', items: { type: 'object' } },
          personalityPalette: {
            type: 'object',
            properties: {
              base: { type: 'string' },
              main: { type: 'array', items: { type: 'string' } },
              accents: { type: 'array', items: { type: 'string' } },
              derivatives: { type: 'array', items: { type: 'object' } },
              futureDerivatives: { type: 'array', items: { type: 'string' } },
              notes: { type: 'string' },
              compiledText: { type: 'string' },
            },
          },
          creationPlan: { type: 'object' },
          notes: { type: 'string' },
        },
        required: ['character'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_skill_references',
      description: '列出 Whale Builder 内置 skill reference 索引，用于决定下一步应读取哪些文档。',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: '可选搜索词，例如 character、worldbook、first-message。' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'evaluate_character_draft',
      description: '评估当前 Whale Play 角色卡、性格调色盘、世界书和创作规划，输出可执行修改建议。',
      parameters: {
        type: 'object',
        properties: {
          character: { type: 'object' },
          worldbookEntries: { type: 'array', items: { type: 'object' } },
          personalityPalette: { type: 'object' },
          creationPlan: { type: 'object' },
          summary: { type: 'string' },
          issues: { type: 'array', items: { type: 'object' } },
          suggestions: { type: 'array', items: { type: 'string' } },
          score: { type: 'number' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'record_entry_output',
      description: '登记创作规划中的某个条目已经完成、正在执行或跳过，用于断点续接和逐条产出追踪。',
      parameters: {
        type: 'object',
        properties: {
          entryId: { type: 'string' },
          name: { type: 'string' },
          status: { type: 'string', enum: ['planned', 'in_progress', 'done', 'skipped'] },
          outputRef: { type: 'string' },
          skipReason: { type: 'string' },
        },
        required: ['status'],
      },
    },
  },
]

const CHAT_TOOL_DEFINITIONS: GenerateToolDefinition[] = [
  TOOL_DEFINITIONS[0],
  TOOL_DEFINITIONS[3],
  {
    type: 'function',
    function: {
      name: 'ask_user_options',
      description: '向用户提出一个需要补全的角色设计问题，并给出 2-4 个可点击选项。',
      parameters: {
        type: 'object',
        properties: {
          question: { type: 'string', description: '要问用户的问题。' },
          reason: { type: 'string', description: '为什么这个信息会影响角色卡。' },
          options: {
            type: 'array',
            minItems: 2,
            maxItems: 4,
            items: {
              type: 'object',
              properties: {
                label: { type: 'string' },
                value: { type: 'string' },
                description: { type: 'string' },
              },
              required: ['label', 'value'],
            },
          },
        },
        required: ['question', 'options'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'present_creation_plan',
      description: '展示 Whale Play 角色卡创作规划并等待用户确认，等价于原 skill 的创作规划确认步骤。',
      parameters: {
        type: 'object',
        properties: {
          projectName: { type: 'string', description: 'Whale Play 工作台/角色项目名称。' },
          worldbookName: { type: 'string', description: '计划生成的世界书名称。' },
          sourceType: { type: 'string', description: '原创、用户材料、联网资料或混合。' },
          planningMode: { type: 'string', description: '粗略规划、一次确认或直接生成。' },
          summary: { type: 'string', description: '本次创作方向的一句话总结。' },
          characterPlan: { type: 'string', description: '角色名、身份、关系入口、核心冲突等规划。' },
          characters: { type: 'array', items: { type: 'object' }, description: '角色规划数组。' },
          personalityPalette: { type: 'object', description: '底色、主色调、点缀和衍生规划。' },
          worldPlan: { type: 'string', description: '世界观、地点、组织、规则等规划。' },
          world: { type: 'object', description: '世界观结构化规划。' },
          style: { type: 'object', description: '文风、视角和基调规划。' },
          entryPlan: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                type: { type: 'string' },
                path: { type: 'string' },
                part: { type: 'string' },
                scope: { type: 'string' },
                purpose: { type: 'string' },
                keys: { type: 'string' },
                sourceChapters: { type: 'array', items: { type: 'string' } },
              },
            },
          },
          firstMessagePlan: { type: 'string', description: '开场白切入点。' },
          firstMessage: { type: 'object', description: '开场白结构化规划。' },
          openQuestions: { type: 'array', items: { type: 'string' }, description: '必须让用户确认的问题。' },
          yaml: { type: 'string', description: '可选。完整创作规划.yaml；如果不提供，工具会生成。' },
          options: {
            type: 'array',
            minItems: 2,
            maxItems: 4,
            items: {
              type: 'object',
              properties: {
                label: { type: 'string' },
                value: { type: 'string' },
                description: { type: 'string' },
              },
              required: ['label', 'value'],
            },
          },
        },
        required: ['summary'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'web_search',
      description: '联网搜索真实资料、历史背景、职业/地点/神话/作品风格等参考信息。',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: '搜索关键词。' },
          limit: { type: 'number', description: '最多返回结果数量，默认 5。' },
        },
        required: ['query'],
      },
    },
  },
  TOOL_DEFINITIONS[1],
  TOOL_DEFINITIONS[2],
  TOOL_DEFINITIONS[4],
  TOOL_DEFINITIONS[5],
]

function trimString(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function optionalString(value: unknown) {
  const text = trimString(value)
  return text || undefined
}

function normalizeTags(value: unknown) {
  if (!Array.isArray(value)) return undefined
  const tags = value
    .map((tag) => trimString(tag))
    .filter(Boolean)
    .slice(0, 8)
  return tags.length > 0 ? tags : undefined
}

function normalizePosition(value: unknown, fallback: WorldbookInsertPosition): WorldbookInsertPosition {
  return value === 'beforeHistory' || value === 'afterHistory' || value === 'atDepth' ? value : fallback
}

function normalizeWorldbookEntries(value: unknown): CreateWorldbookEntryInput[] {
  if (!Array.isArray(value)) return []

  return value
    .map((entry, index): CreateWorldbookEntryInput | null => {
      if (!entry || typeof entry !== 'object') return null
      const data = entry as Record<string, unknown>
      const type = data.type === 'always' ? 'always' : 'trigger'
      const fallbackPosition: WorldbookInsertPosition = type === 'always' ? 'beforeHistory' : 'afterHistory'
      const priority = Number(data.priority)

      return {
        title: trimString(data.title) || `Entry ${index + 1}`,
        keys: trimString(data.keys),
        secondaryKeys: optionalString(data.secondaryKeys),
        content: trimString(data.content),
        priority: Number.isFinite(priority) ? priority : Math.max(10, 100 - index * 5),
        type,
        triggerMode: data.triggerMode === 'and' ? 'and' : 'or',
        selectiveLogic: data.selectiveLogic === 'and' ? 'and' : data.selectiveLogic === 'or' ? 'or' : undefined,
        scanDepth: typeof data.scanDepth === 'number' && Number.isFinite(data.scanDepth) ? Math.max(0, data.scanDepth) : undefined,
        caseSensitive: typeof data.caseSensitive === 'boolean' ? data.caseSensitive : undefined,
        matchWholeWords: typeof data.matchWholeWords === 'boolean' ? data.matchWholeWords : undefined,
        useProbability: typeof data.useProbability === 'boolean' ? data.useProbability : undefined,
        probability: typeof data.probability === 'number' && Number.isFinite(data.probability) ? data.probability : undefined,
        position: normalizePosition(data.position, fallbackPosition),
        depth: typeof data.depth === 'number' && Number.isFinite(data.depth) ? Math.max(0, data.depth) : undefined,
        role: data.role === 'user' || data.role === 'assistant' || data.role === 'system' ? data.role : 'system',
        enabled: data.enabled === false ? false : true,
      }
    })
    .filter((entry): entry is CreateWorldbookEntryInput => !!entry && !!entry.content)
    .slice(0, 12)
}

const PLACEHOLDER_PATTERN = /(某城市|某学校|某组织|某地点|某角色|某人|待定|占位|TODO|TBD|未命名)/i
const USER_ACTION_PATTERN = /你(已经|正在|正要|走进|坐下|伸手|回答|点头|摇头|感到|意识到|决定|忍不住)/

function hasPlaceholder(text: string) {
  return PLACEHOLDER_PATTERN.test(text)
}

function splitEntryKeys(keys: string) {
  return keys
    .split(/[,，、;；\n]+/)
    .map((key) => key.trim())
    .filter(Boolean)
}

function isSingleHanKey(key: string) {
  return Array.from(key).length === 1 && /[\u3400-\u9fff]/.test(key)
}

function normalizeStringList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((item) => trimString(item)).filter(Boolean)
  const text = trimString(value)
  return text ? splitEntryKeys(text) : []
}

function normalizePaletteDerivatives(value: unknown): NeoPersonalityPalette['derivatives'] {
  if (Array.isArray(value)) {
    return value
      .map((item): NeoPersonalityPalette['derivatives'][number] | null => {
        if (!item || typeof item !== 'object') return null
        const data = item as Record<string, unknown>
        const color = trimString(data.color || data.name || data.trait)
        const items = normalizeStringList(data.items || data.derivatives || data.examples || data.behaviors)
        if (!color || items.length === 0) return null
        return { color, items }
      })
      .filter((item): item is NeoPersonalityPalette['derivatives'][number] => !!item)
  }

  if (value && typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>)
      .map(([color, items]) => ({ color: color.trim(), items: normalizeStringList(items) }))
      .filter((item) => item.color && item.items.length > 0)
  }

  return []
}

function compilePersonalityPalette(palette: NeoPersonalityPalette) {
  const lines: string[] = []
  lines.push('性格调色盘：人的性格像调色盘，底色始终存在，主色调决定日常第一印象，点缀只在特定条件下显现；衍生是具体场景中的行为。')
  if (palette.base) lines.push(`底色：${palette.base}`)
  if (palette.main.length) lines.push(`主色调：${palette.main.join('、')}`)
  if (palette.accents.length) lines.push(`性格点缀：${palette.accents.join('、')}`)
  for (const derivative of palette.derivatives) {
    derivative.items.forEach((item, index) => {
      lines.push(`${derivative.color}衍生${index + 1}：${item}`)
    })
  }
  for (const item of palette.futureDerivatives ?? []) {
    lines.push(`未来衍生：${item}`)
  }
  if (palette.notes) lines.push(`调色盘备注：${palette.notes}`)
  return lines.join('\n')
}

function normalizePersonalityPalette(value: unknown): NeoPersonalityPalette | undefined {
  if (!value || typeof value !== 'object') return undefined
  const data = value as Record<string, unknown>
  const palette: NeoPersonalityPalette = {
    base: trimString(data.base || data.foundation || data.baseColor),
    main: normalizeStringList(data.main || data.mainColors || data.dominant),
    accents: normalizeStringList(data.accents || data.accent || data.decorations),
    derivatives: normalizePaletteDerivatives(data.derivatives || data.derived || data.behaviors),
    futureDerivatives: normalizeStringList(data.futureDerivatives || data.future),
    notes: optionalString(data.notes),
    compiledText: optionalString(data.compiledText),
  }
  if (!palette.base && palette.main.length === 0 && palette.accents.length === 0 && palette.derivatives.length === 0) {
    return undefined
  }
  palette.compiledText = palette.compiledText || compilePersonalityPalette(palette)
  return palette
}

function yamlScalar(value: unknown, fallback = '') {
  const text = trimString(value) || fallback
  if (!text) return '""'
  if (/[:#\n\r\[\]{}]/.test(text)) return JSON.stringify(text)
  return text
}

function yamlList(values: string[], indent = 4) {
  const space = ' '.repeat(indent)
  if (!values.length) return `${space}[]`
  return values.map((value) => `${space}- ${yamlScalar(value)}`).join('\n')
}

function normalizePlanEntries(value: unknown): NeoCreationPlanEntry[] {
  if (!Array.isArray(value)) return []
  return value
    .map((item, index): NeoCreationPlanEntry | null => {
      if (!item || typeof item !== 'object') return null
      const data = item as Record<string, unknown>
      const name = trimString(data.name || data.title) || `条目${index + 1}`
      const type = trimString(data.type) || '世界书'
      return {
        id: trimString(data.id) || `entry_${index + 1}`,
        name,
        type,
        path: optionalString(data.path),
        part: optionalString(data.part),
        scope: optionalString(data.scope),
        purpose: optionalString(data.purpose),
        keys: normalizeStringList(data.keys || data.keywords),
        sourceChapters: normalizeStringList(data.sourceChapters || data.source_chapters),
        status: data.status === 'done' || data.status === 'in_progress' || data.status === 'skipped' ? data.status : 'planned',
        outputRef: optionalString(data.outputRef || data.output_ref),
        skipReason: optionalString(data.skipReason || data.skip_reason),
      }
    })
    .filter((entry): entry is NeoCreationPlanEntry => !!entry)
    .slice(0, 32)
}

function buildCreationPlanYaml(plan: Omit<NeoCreationPlan, 'yaml' | 'updatedAt'>) {
  const lines: string[] = []
  lines.push('project:')
  lines.push(`  name: ${yamlScalar(plan.project.name, 'Whale Builder')}`)
  lines.push(`  worldbookName: ${yamlScalar(plan.project.worldbookName)}`)
  lines.push(`  form: ${plan.project.form}`)
  if (plan.project.sourceType) lines.push(`  sourceType: ${yamlScalar(plan.project.sourceType)}`)
  if (plan.project.planningMode) lines.push(`  planningMode: ${yamlScalar(plan.project.planningMode)}`)
  lines.push('')
  lines.push('world:')
  lines.push(`  overview: ${yamlScalar(plan.world?.overview)}`)
  lines.push('  regions:')
  lines.push(yamlList(plan.world?.regions ?? [], 4))
  lines.push('  factions:')
  lines.push(yamlList(plan.world?.factions ?? [], 4))
  lines.push('')
  lines.push('characters:')
  if (plan.characters.length) {
    for (const character of plan.characters) {
      lines.push(`  - name: ${yamlScalar(character.name)}`)
      if (character.identity) lines.push(`    identity: ${yamlScalar(character.identity)}`)
      if (character.relationship) lines.push(`    relationship: ${yamlScalar(character.relationship)}`)
      lines.push('    palette:')
      lines.push(`      base: ${yamlScalar(character.palette?.base)}`)
      lines.push('      main:')
      lines.push(yamlList(character.palette?.main ?? [], 8))
      lines.push('      accents:')
      lines.push(yamlList(character.palette?.accents ?? [], 8))
    }
  } else {
    lines.push('  []')
  }
  lines.push('')
  lines.push('style:')
  lines.push(`  perspective: ${yamlScalar(plan.style?.perspective)}`)
  lines.push(`  tone: ${yamlScalar(plan.style?.tone)}`)
  lines.push(`  mood: ${yamlScalar(plan.style?.mood)}`)
  lines.push('')
  lines.push('entries:')
  if (plan.entries.length) {
    for (const entry of plan.entries) {
      lines.push(`  - id: ${entry.id}`)
      lines.push(`    name: ${yamlScalar(entry.name)}`)
      lines.push(`    type: ${yamlScalar(entry.type)}`)
      if (entry.path) lines.push(`    path: ${yamlScalar(entry.path)}`)
      if (entry.part) lines.push(`    part: ${yamlScalar(entry.part)}`)
      if (entry.scope) lines.push(`    scope: ${yamlScalar(entry.scope)}`)
      if (entry.purpose) lines.push(`    purpose: ${yamlScalar(entry.purpose)}`)
      lines.push(`    status: ${entry.status}`)
      lines.push('    keywords:')
      lines.push(yamlList(entry.keys ?? [], 6))
      if (entry.sourceChapters?.length) {
        lines.push('    source_chapters:')
        lines.push(yamlList(entry.sourceChapters, 6))
      }
      if (entry.outputRef) lines.push(`    outputRef: ${yamlScalar(entry.outputRef)}`)
      if (entry.skipReason) lines.push(`    skipReason: ${yamlScalar(entry.skipReason)}`)
    }
  } else {
    lines.push('  []')
  }
  lines.push('')
  lines.push('first_message:')
  lines.push(`  format: ${yamlScalar(plan.firstMessage?.format)}`)
  lines.push(`  word_count: ${yamlScalar(plan.firstMessage?.wordCount)}`)
  lines.push(`  scene: ${yamlScalar(plan.firstMessage?.scene)}`)
  lines.push(`  opening_situation: ${yamlScalar(plan.firstMessage?.openingSituation)}`)
  if (plan.openQuestions?.length) {
    lines.push('')
    lines.push('open_questions:')
    lines.push(yamlList(plan.openQuestions, 2))
  }
  return lines.join('\n')
}

function normalizePlanCharacters(value: unknown, fallbackText?: string, palette?: NeoPersonalityPalette): NeoCreationPlan['characters'] {
  if (Array.isArray(value)) {
    const characters = value
      .map((item): NeoCreationPlan['characters'][number] | null => {
        if (!item || typeof item !== 'object') return null
        const data = item as Record<string, unknown>
        const name = trimString(data.name)
        if (!name) return null
        const itemPalette = normalizePersonalityPalette(data.palette || data.personalityPalette)
        return {
          name,
          identity: optionalString(data.identity),
          relationship: optionalString(data.relationship),
          palette: {
            base: itemPalette?.base || optionalString(data.base),
            main: itemPalette?.main.length ? itemPalette.main : normalizeStringList(data.main),
            accents: itemPalette?.accents.length ? itemPalette.accents : normalizeStringList(data.accents),
          },
        }
      })
      .filter((item): item is NeoCreationPlan['characters'][number] => !!item)
    if (characters.length) return characters
  }

  return [{
    name: '待确认角色',
    identity: fallbackText,
    palette: palette ? {
      base: palette.base,
      main: palette.main,
      accents: palette.accents,
    } : undefined,
  }]
}

function normalizeCreationPlan(args: Record<string, unknown>, existing?: NeoCreationPlan | null): NeoCreationPlan {
  const palette = normalizePersonalityPalette(args.personalityPalette)
  const world = args.world && typeof args.world === 'object' ? args.world as Record<string, unknown> : {}
  const style = args.style && typeof args.style === 'object' ? args.style as Record<string, unknown> : {}
  const firstMessage = args.firstMessage && typeof args.firstMessage === 'object' ? args.firstMessage as Record<string, unknown> : {}
  const entries = normalizePlanEntries(args.entryPlan || args.entries)
  const planBase: Omit<NeoCreationPlan, 'yaml' | 'updatedAt'> = {
    project: {
      name: trimString(args.projectName) || existing?.project.name || 'Whale Builder',
      worldbookName: optionalString(args.worldbookName) || existing?.project.worldbookName,
      form: args.form === 'worldbook' ? 'worldbook' : 'charactercard',
      sourceType: optionalString(args.sourceType) || existing?.project.sourceType,
      planningMode: optionalString(args.planningMode) || existing?.project.planningMode,
    },
    world: {
      overview: optionalString(world.overview) || optionalString(args.worldPlan) || existing?.world?.overview,
      regions: normalizeStringList(world.regions).length ? normalizeStringList(world.regions) : existing?.world?.regions,
      factions: normalizeStringList(world.factions).length ? normalizeStringList(world.factions) : existing?.world?.factions,
    },
    characters: normalizePlanCharacters(args.characters, optionalString(args.characterPlan), palette),
    style: {
      perspective: optionalString(style.perspective) || existing?.style?.perspective,
      tone: optionalString(style.tone) || existing?.style?.tone,
      mood: optionalString(style.mood) || existing?.style?.mood,
    },
    entries: entries.length ? entries : existing?.entries ?? [],
    firstMessage: {
      format: optionalString(firstMessage.format) || existing?.firstMessage?.format,
      scene: optionalString(firstMessage.scene) || optionalString(args.firstMessagePlan) || existing?.firstMessage?.scene,
      openingSituation: optionalString(firstMessage.openingSituation || firstMessage.opening_situation) || existing?.firstMessage?.openingSituation,
      wordCount: optionalString(firstMessage.wordCount || firstMessage.word_count) || existing?.firstMessage?.wordCount,
    },
    openQuestions: normalizeStringList(args.openQuestions).length ? normalizeStringList(args.openQuestions) : existing?.openQuestions,
  }
  return {
    ...planBase,
    yaml: trimString(args.yaml) || buildCreationPlanYaml(planBase),
    updatedAt: new Date().toISOString(),
  }
}

function updatePlanEntryStatus(plan: NeoCreationPlan | null | undefined, args: Record<string, unknown>): NeoCreationPlan | undefined {
  if (!plan) return undefined
  const status: NeoCreationPlanEntry['status'] = args.status === 'planned' || args.status === 'in_progress' || args.status === 'done' || args.status === 'skipped'
    ? args.status
    : 'planned'
  const entryId = trimString(args.entryId)
  const name = trimString(args.name)
  const entries = plan.entries.map((entry) => {
    const matched = (entryId && entry.id === entryId) || (name && entry.name === name)
    if (!matched) return entry
    return {
      ...entry,
      status,
      outputRef: optionalString(args.outputRef) || entry.outputRef,
      skipReason: optionalString(args.skipReason) || entry.skipReason,
    }
  })
  const nextBase = { ...plan, entries }
  return {
    ...nextBase,
    yaml: buildCreationPlanYaml(nextBase),
    updatedAt: new Date().toISOString(),
  }
}

function normalizeDraft(payload: DraftPayload, existingCharacter?: CreateCharacterInput | null): ValidationResult {
  const source = payload.character ?? {}
  const personalityPalette = normalizePersonalityPalette(payload.personalityPalette)
  const paletteText = personalityPalette?.compiledText
  const sourcePersonality = trimString(source.personality)
  const character: CreateCharacterInput = {
    name: trimString(source.name) || existingCharacter?.name || '',
    avatar: optionalString(source.avatar) || existingCharacter?.avatar,
    description: trimString(source.description) || existingCharacter?.description || '',
    personality: sourcePersonality
      ? (paletteText && !sourcePersonality.includes('性格调色盘') ? `${sourcePersonality}\n\n${paletteText}` : sourcePersonality)
      : paletteText || existingCharacter?.personality || '',
    scenario: trimString(source.scenario) || existingCharacter?.scenario || '',
    firstMessage: trimString(source.firstMessage) || existingCharacter?.firstMessage || '',
    exampleDialogues: trimString(source.exampleDialogues) || existingCharacter?.exampleDialogues || '',
    tags: normalizeTags(source.tags) || existingCharacter?.tags,
  }

  const worldbookEntries = normalizeWorldbookEntries(payload.worldbookEntries)
  const creationPlan = payload.creationPlan && typeof payload.creationPlan === 'object'
    ? normalizeCreationPlan(payload.creationPlan as Record<string, unknown>)
    : undefined
  const issues: string[] = []

  if (!character.name) issues.push('name 不能为空')
  if (!character.description) issues.push('description 不能为空')
  if (!character.personality) issues.push('personality 不能为空')
  if (!character.scenario) issues.push('scenario 不能为空')
  if (!character.firstMessage) issues.push('firstMessage 不能为空')

  for (const [field, value] of Object.entries({
    name: character.name,
    description: character.description,
    personality: character.personality,
    scenario: character.scenario,
    firstMessage: character.firstMessage,
    exampleDialogues: character.exampleDialogues,
  })) {
    if (value && hasPlaceholder(value)) issues.push(`${field} 含有占位符或待定信息`)
  }

  if (/这是开场白|以下是开场|作为.*角色/.test(character.firstMessage)) {
    issues.push('firstMessage 不能写成说明文字，必须直接进入角色消息')
  }
  if (USER_ACTION_PATTERN.test(character.firstMessage)) {
    issues.push('firstMessage 疑似替用户行动或感受，请改为给用户入口')
  }

  if (!personalityPalette && !character.personality.includes('性格调色盘')) {
    issues.push('需要提供 personalityPalette，不能只把性格压扁成普通 personality 文本')
  }

  if (personalityPalette) {
    if (!personalityPalette.base) issues.push('性格调色盘需要底色')
    if (personalityPalette.main.length === 0) issues.push('性格调色盘需要至少一个主色调')
    if (personalityPalette.derivatives.length === 0) {
      issues.push('性格调色盘需要衍生，不能只写底色/主色调标签')
    }
    for (const derivative of personalityPalette.derivatives) {
      if (derivative.items.length < 2) {
        issues.push(`性格“${derivative.color}”至少需要 2 条具体衍生`)
      }
    }
  }

  for (const entry of worldbookEntries) {
    if (entry.type === 'trigger' && !entry.keys.trim()) {
      issues.push(`召回世界书条目“${entry.title}”需要 keys`)
    }
    for (const key of splitEntryKeys(entry.keys)) {
      if (isSingleHanKey(key)) issues.push(`世界书条目“${entry.title}”包含单汉字 key：“${key}”`)
    }
    if (hasPlaceholder(entry.title) || hasPlaceholder(entry.keys) || hasPlaceholder(entry.content)) {
      issues.push(`世界书条目“${entry.title}”含有占位符或待定信息`)
    }
    if (!entry.content.trim()) {
      issues.push(`世界书条目“${entry.title}”需要 content`)
    }
  }

  return {
    draft: {
      character,
      worldbookName: optionalString(payload.worldbookName),
      worldbookDescription: optionalString(payload.worldbookDescription),
      worldbookEntries,
      personalityPalette,
      creationPlan,
      notes: optionalString(payload.notes),
    },
    issues,
  }
}

function addUsage(total: MessageUsage | undefined, next: MessageUsage | undefined): MessageUsage | undefined {
  if (!next) return total
  const merged: MessageUsage = { ...(total ?? {}) }
  const fields: Array<keyof Pick<MessageUsage, 'promptTokens' | 'completionTokens' | 'totalTokens' | 'cacheHitTokens' | 'cacheMissTokens'>> = [
    'promptTokens',
    'completionTokens',
    'totalTokens',
    'cacheHitTokens',
    'cacheMissTokens',
  ]
  for (const field of fields) {
    const value = next[field]
    if (typeof value === 'number' && Number.isFinite(value)) {
      merged[field] = (merged[field] ?? 0) + value
    }
  }
  return merged
}

function parseToolArguments(raw: string): Record<string, unknown> {
  if (!raw.trim()) return {}
  try {
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function extractJsonObject(content: string): DraftPayload | null {
  const trimmed = content.trim()
  if (!trimmed) return null

  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)
  const candidates = [fenced?.[1], trimmed].filter((candidate): candidate is string => !!candidate)

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate)
      if (parsed && typeof parsed === 'object' && 'character' in parsed) return parsed as DraftPayload
    } catch {
      continue
    }
  }

  return null
}

function buildSystemPrompt() {
  return [
    '你是 Whale Play 内置角色卡 Builder。你通过工具调用生成 Whale Play 原生角色卡草稿。',
    '你必须像使用本地 skill 一样工作：先读取 SKILL.md，再按场景路由读取 references/ 下的文档。',
    '完整创建任务至少读取 references/requirements.md、references/composition.md、references/rules.md、references/conventions.md；再按需读取角色、世界观、开场白、世界书等创作文档。',
    '角色性格必须使用性格调色盘：底色、主色调、点缀、每个性格点 2-3 条具体衍生。衍生不足时不要硬编，先追问用户。',
    '当前版本明确不要 MVU，不要 EJS，不要 SillyTavern forge，不要项目目录，不要模板文件；这些能力在 Whale Play 中映射为普通角色字段、世界书和 Builder 本地草稿。',
    '完成后调用 save_character_draft 保存最终草稿。不要只在普通文本里输出最终结果。',
    '输出内容面向中文用户，除非用户材料要求其他语言。',
  ].join('\n')
}

function buildUserPrompt(options: NeoCharacterBuilderOptions) {
  return JSON.stringify({
    task: '根据用户材料生成 Whale Play 原生角色卡草稿。',
    userConcept: options.concept,
    existingCharacter: options.existingCharacter ?? null,
    expectedOutput: {
      character: {
        name: 'string',
        description: 'string',
        personality: 'string',
        scenario: 'string',
        firstMessage: 'string',
        exampleDialogues: 'string',
        tags: ['string'],
      },
      personalityPalette: {
        base: 'string',
        main: ['string'],
        accents: ['string'],
        derivatives: [{ color: 'string', items: ['string'] }],
        futureDerivatives: ['string'],
      },
      creationPlan: 'optional NeoCreationPlan with entries status',
      worldbookName: 'optional string',
      worldbookDescription: 'optional string',
      worldbookEntries: [
        {
          title: 'string',
          keys: 'comma separated string; trigger entries require it',
          content: 'string',
          priority: 'number',
          type: 'always | trigger',
          triggerMode: 'and | or',
          position: 'beforeHistory for always, afterHistory for trigger',
          role: 'system',
          enabled: true,
        },
      ],
      notes: 'optional short note for the user',
    },
  }, null, 2)
}

function stringifyToolResult(value: unknown) {
  return JSON.stringify(value, null, 2)
}

function createBuilderEventId() {
  return `tool_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

function getToolLabel(name: string) {
  const labels: Record<string, string> = {
    list_skill_references: '查看规则索引',
    read_skill_reference: '读取 Whale Play 规则',
    ask_user_options: '生成追问选项',
    present_creation_plan: '确认创作规划',
    web_search: '联网搜索',
    validate_character_draft: '校验角色草稿',
    save_character_draft: '保存角色草稿',
    evaluate_character_draft: '评估角色草稿',
    record_entry_output: '记录条目进度',
  }
  return labels[name] || name
}

function emitToolEvent(
  events: NeoBuilderToolEvent[],
  onToolEvent: NeoBuilderTurnOptions['onToolEvent'],
  event: NeoBuilderToolEvent,
) {
  const index = events.findIndex((item) => item.id === event.id)
  if (index >= 0) events[index] = event
  else events.push(event)
  onToolEvent?.(event)
}

function normalizeChoices(value: unknown): NeoBuilderChoice[] {
  if (!Array.isArray(value)) return []
  return value
    .map((item, index): NeoBuilderChoice | null => {
      if (!item || typeof item !== 'object') return null
      const data = item as Record<string, unknown>
      const label = trimString(data.label)
      const optionValue = trimString(data.value) || label
      if (!label || !optionValue) return null
      return {
        id: trimString(data.id) || `choice_${index + 1}`,
        label,
        value: optionValue,
        description: optionalString(data.description),
      }
    })
    .filter((choice): choice is NeoBuilderChoice => !!choice)
    .slice(0, 4)
}

function normalizeStringArray(value: unknown) {
  if (!Array.isArray(value)) return []
  return value.map((item) => trimString(item)).filter(Boolean)
}

function formatCreationPlan(args: Record<string, unknown>) {
  const lines: string[] = []
  const summary = trimString(args.summary)
  const characterPlan = trimString(args.characterPlan)
  const worldPlan = trimString(args.worldPlan)
  const firstMessagePlan = trimString(args.firstMessagePlan)
  const openQuestions = normalizeStringArray(args.openQuestions)
  const entryPlan = Array.isArray(args.entryPlan) ? args.entryPlan : []
  const palette = normalizePersonalityPalette(args.personalityPalette)

  lines.push('我先把创作规划对齐一下：')
  if (summary) lines.push('', summary)
  if (characterPlan) lines.push('', `角色方向：${characterPlan}`)
  if (palette) {
    lines.push('', '性格调色盘：')
    if (palette.base) lines.push(`- 底色：${palette.base}`)
    if (palette.main.length) lines.push(`- 主色调：${palette.main.join('、')}`)
    if (palette.accents.length) lines.push(`- 点缀：${palette.accents.join('、')}`)
    if (palette.derivatives.length) {
      lines.push(`- 衍生：${palette.derivatives.map((item) => `${item.color} ${item.items.length} 条`).join('；')}`)
    } else {
      lines.push('- 衍生：待补全')
    }
  }
  if (worldPlan) lines.push('', `世界与规则：${worldPlan}`)
  if (entryPlan.length > 0) {
    lines.push('', '世界书条目：')
    for (const item of entryPlan.slice(0, 8)) {
      if (!item || typeof item !== 'object') continue
      const data = item as Record<string, unknown>
      const title = trimString(data.title) || '未命名条目'
      const type = trimString(data.type)
      const purpose = trimString(data.purpose)
      const keys = trimString(data.keys)
      lines.push(`- ${title}${type ? `（${type}）` : ''}${purpose ? `：${purpose}` : ''}${keys ? `；keys: ${keys}` : ''}`)
    }
  }
  if (firstMessagePlan) lines.push('', `开场切入：${firstMessagePlan}`)
  if (openQuestions.length > 0) {
    lines.push('', '需要你确认：')
    for (const question of openQuestions.slice(0, 4)) lines.push(`- ${question}`)
  }

  return lines.join('\n')
}

function defaultPlanChoices(): NeoBuilderChoice[] {
  return [
    { id: 'confirm_plan', label: '按规划继续', value: '确认，按这个 Whale Play 创作规划继续生成角色卡和世界书。' },
    { id: 'adjust_plan', label: '我要调整', value: '我想调整这个创作规划：' },
    { id: 'more_detail', label: '先补细节', value: '先别生成，继续问我几个会影响角色体验的关键细节。' },
  ]
}

function buildStopForUserContent(output: Record<string, unknown>) {
  const content = trimString(output.content)
  if (content) return content
  const summaryText = optionalString(output.summaryText)
  if (summaryText) {
    return [
      summaryText,
      trimString(output.question),
      optionalString(output.reason),
    ].filter(Boolean).join('\n\n')
  }
  return [
    trimString(output.question),
    optionalString(output.reason),
  ].filter(Boolean).join('\n\n')
}

function summarizeToolOutput(output: unknown) {
  if (output && typeof output === 'object') {
    const data = output as Record<string, unknown>
    if (typeof data.content === 'string' && typeof data.id === 'string') {
      return { id: data.id, title: data.title, summary: data.summary }
    }
    if (Array.isArray(data.references)) {
      return { references: data.references.length, query: data.query }
    }
    if (data.creationPlan && typeof data.creationPlan === 'object') {
      const plan = data.creationPlan as Partial<NeoCreationPlan>
      return { creationPlan: plan.project?.name, entries: plan.entries?.length ?? 0 }
    }
    if (data.evaluationReport && typeof data.evaluationReport === 'object') {
      const report = data.evaluationReport as Partial<NeoBuilderEvaluationReport>
      return { issues: report.issues?.length ?? 0, score: report.score }
    }
    if (typeof data.summary === 'object') return data.summary
    if (Array.isArray(data.results)) {
      return {
        results: data.results.slice(0, 3).map((item) => {
          if (!item || typeof item !== 'object') return item
          const result = item as Record<string, unknown>
          return {
            title: result.title,
            url: result.url,
          }
        }),
      }
    }
    if (Array.isArray(data.issues)) return { issues: data.issues }
  }
  return output
}

function normalizeEvaluationIssues(value: unknown, fallbackIssues: string[] = []): NeoBuilderEvaluationReport['issues'] {
  if (Array.isArray(value)) {
    const issues = value
      .map((item): NeoBuilderEvaluationReport['issues'][number] | null => {
        if (typeof item === 'string') return { severity: 'medium', target: 'draft', message: item }
        if (!item || typeof item !== 'object') return null
        const data = item as Record<string, unknown>
        const severity = data.severity === 'high' || data.severity === 'low' ? data.severity : 'medium'
        const message = trimString(data.message || data.text || data.issue)
        if (!message) return null
        return {
          severity,
          target: trimString(data.target) || 'draft',
          message,
        }
      })
      .filter((issue): issue is NeoBuilderEvaluationReport['issues'][number] => !!issue)
    if (issues.length) return issues
  }
  return fallbackIssues.map((message) => ({ severity: 'medium', target: 'draft', message }))
}

function normalizeEvaluationReport(args: Record<string, unknown>, fallbackIssues: string[] = []): NeoBuilderEvaluationReport {
  const issues = normalizeEvaluationIssues(args.issues, fallbackIssues)
  const suggestions = normalizeStringList(args.suggestions)
  return {
    summary: trimString(args.summary) || (issues.length ? '草稿还有需要修正的地方。' : '草稿结构完整，可以继续细化或保存。'),
    issues,
    suggestions: suggestions.length ? suggestions : issues.map((issue) => `修正：${issue.message}`),
    score: typeof args.score === 'number' && Number.isFinite(args.score) ? Math.max(0, Math.min(100, args.score)) : undefined,
  }
}

function buildChatSystemPrompt(options: NeoBuilderTurnOptions) {
  return [
    '你是 Whale Builder，一个像 Codex 一样协作的角色卡设计搭档。',
    '你和用户通过多轮聊天共同完成 Whale Play 原生角色卡，而不是输出外部工程。',
    '你必须像使用本地 skill 一样工作：先读取 SKILL.md，再根据场景路由读取 references/ 下的规则；不确定读什么时先调用 list_skill_references。',
    '完整创建任务至少读取 references/requirements.md、references/composition.md、references/rules.md、references/conventions.md；局部任务读取对应 contents-creation 文档。',
    '当前版本明确不要 MVU，不要 EJS，不要 SillyTavern forge，不要项目目录，不要模板文件；动态需求用 Whale Play 世界书和阶段指导表达。',
    '你可以调用工具：列出/读取 Whale Play 规则、联网搜索、向用户给出选项追问、展示创作规划、校验草稿、保存草稿。',
    '完整角色卡在进入正式创作前，优先调用 present_creation_plan 展示规划并等待确认；规划必须包含性格调色盘、世界书条目、firstMessage 切入点，并会持久化为创作规划.yaml。',
    '创作时必须按 references/contents-creation/character/personality-palette.md 收集底色、主色调、点缀和衍生。不要只给性格标签；衍生不足时先追问用户。',
    '完成或跳过规划中的条目时调用 record_entry_output。用户要求修改、审查或评估时调用 evaluate_character_draft。',
    '如果用户信息不足，优先调用 ask_user_options，给出 2-4 个具体选项，引导用户补全会影响角色体验的细节。',
    options.webSearchEnabled
      ? '联网搜索已开启。涉及真实地点、历史、职业、神话、作品风格、时代背景等资料时，可以调用 web_search；搜索后要把资料转化成角色设定，不要照抄网页。'
      : '联网搜索未开启。不要调用 web_search，除非用户明确要求先打开联网搜索。',
    '当信息足够时，调用 save_character_draft 保存 Whale Play 草稿。保存前可以调用 validate_character_draft。',
    '回复要短、清楚、可操作。不要展示原始 JSON，除非用户要求。',
    '输出内容默认中文。',
  ].join('\n')
}

function buildChatContextPrompt(options: NeoBuilderTurnOptions) {
  return JSON.stringify({
    task: '通过聊天协作生成或修改 Whale Play 原生角色卡。',
    currentTarget: options.existingCharacter ? 'update_existing_character' : 'create_new_character',
    existingCharacter: options.existingCharacter ?? null,
    currentDraft: options.currentDraft ?? null,
    currentWorldbookEntries: options.currentWorldbookEntries ?? [],
    creationPlan: options.creationPlan ?? null,
    personalityPalette: options.personalityPalette ?? null,
    neoOutputFields: {
      character: ['name', 'description', 'personality', 'scenario', 'firstMessage', 'exampleDialogues', 'tags'],
      personalityPalette: ['base', 'main', 'accents', 'derivatives', 'futureDerivatives'],
      creationPlan: ['project', 'world', 'characters', 'style', 'entries', 'firstMessage', 'yaml'],
      optionalWorldbookEntries: ['title', 'keys', 'content', 'priority', 'type', 'triggerMode', 'position', 'role', 'enabled'],
    },
  }, null, 2)
}

function conversationToGenerateMessages(options: NeoBuilderTurnOptions): GenerateMessage[] {
  return [
    { role: 'system', content: buildChatSystemPrompt(options) },
    { role: 'user', content: buildChatContextPrompt(options) },
    ...options.conversation.map((message): GenerateMessage => ({
      role: message.role,
      content: message.content,
    })),
  ]
}

type ToolCallPart = {
  id?: string
  type: 'function'
  function: {
    name?: string
    arguments: string
  }
}

function appendToolCallDelta(
  parts: Map<number, ToolCallPart>,
  delta: {
    index: number
    id?: string
    type?: 'function'
    function?: {
      name?: string
      arguments?: string
    }
  },
) {
  const index = typeof delta.index === 'number' ? delta.index : parts.size
  const current: ToolCallPart = parts.get(index) ?? { type: 'function', function: { arguments: '' } }
  const nextFunction = {
    name: delta.function?.name ?? current.function?.name,
    arguments: `${current.function?.arguments ?? ''}${delta.function?.arguments ?? ''}`,
  }
  parts.set(index, {
    ...current,
    id: delta.id ?? current.id,
    type: delta.type ?? current.type,
    function: nextFunction,
  })
}

async function generateBuilderStep(
  provider: ModelProvider,
  input: GenerateInput,
  options: NeoBuilderTurnOptions,
): Promise<GenerateResult> {
  if (!provider.streamGenerate) {
    return provider.generate(input)
  }

  let content = ''
  let reasoningContent = ''
  let finishReason: string | undefined
  let usage: MessageUsage | undefined
  const toolParts = new Map<number, ToolCallPart>()
  const raw: unknown[] = []

  for await (const chunk of provider.streamGenerate(input)) {
    if (chunk.raw) raw.push(chunk.raw)
    if (chunk.finishReason) finishReason = chunk.finishReason
    if (chunk.contentDelta) {
      content += chunk.contentDelta
      options.onContentDelta?.(chunk.contentDelta)
    }
    if (chunk.reasoningContentDelta) {
      reasoningContent += chunk.reasoningContentDelta
      options.onReasoningDelta?.(chunk.reasoningContentDelta)
    }
    for (const delta of chunk.toolCallDeltas ?? []) {
      appendToolCallDelta(toolParts, delta)
    }
    usage = addUsage(usage, chunk.usage)
  }

  const toolCalls: GenerateToolCall[] = [...toolParts.entries()]
    .sort(([a], [b]) => a - b)
    .map(([index, part]): GenerateToolCall => ({
      id: part.id || `tool_call_${index}`,
      type: 'function',
      function: {
        name: part.function?.name || '',
        arguments: part.function?.arguments || '',
      },
    }))
    .filter((call) => call.function.name)

  return {
    content,
    reasoningContent: reasoningContent || undefined,
    toolCalls: toolCalls.length ? toolCalls : undefined,
    finishReason,
    usage,
    raw,
  }
}

async function executeBuilderTool(
  toolName: string,
  args: Record<string, unknown>,
  options: NeoBuilderTurnOptions,
): Promise<{
  output: unknown
  savedDraft?: Omit<NeoCharacterBuilderResult, 'usage' | 'toolLog'>
  creationPlan?: NeoCreationPlan
  personalityPalette?: NeoPersonalityPalette
  evaluationReport?: NeoBuilderEvaluationReport
  choices?: NeoBuilderChoice[]
  stopForUser?: boolean
}> {
  if (toolName === 'list_skill_references') {
    const query = optionalString(args.query)
    return {
      output: {
        ok: true,
        query,
        references: listNeoBuilderSkillReferences(query),
      },
    }
  }

  if (toolName === 'read_skill_reference') {
    const id = trimString(args.id)
    const reference = readNeoBuilderSkillReference(id)
    return {
      output: reference
        ? {
            ok: true,
            id: reference.id,
            title: reference.title,
            summary: reference.summary,
            content: reference.content,
          }
        : { ok: false, error: `Unknown reference id: ${id}`, availableIds: NEO_BUILDER_REFERENCE_LOOKUP_IDS },
    }
  }

  if (toolName === 'web_search') {
    if (!options.webSearchEnabled) {
      return { output: { ok: false, error: '联网搜索未开启。' } }
    }
    if (!options.searchWeb) {
      return { output: { ok: false, error: '当前环境没有可用的联网搜索实现。' } }
    }
    const query = trimString(args.query)
    const limit = typeof args.limit === 'number' && Number.isFinite(args.limit) ? Math.max(1, Math.min(8, args.limit)) : 5
    const results = await options.searchWeb(query, limit)
    return { output: { ok: true, query, results } }
  }

  if (toolName === 'ask_user_options') {
    const question = trimString(args.question) || '你想把这个角色往哪个方向推进？'
    const reason = optionalString(args.reason)
    const choices = normalizeChoices(args.options)
    return {
      output: { ok: true, question, reason, choices },
      choices,
      stopForUser: true,
    }
  }

  if (toolName === 'present_creation_plan') {
    const choices = normalizeChoices(args.options)
    const creationPlan = normalizeCreationPlan(args, options.creationPlan)
    const personalityPalette = normalizePersonalityPalette(args.personalityPalette)
    return {
      output: {
        ok: true,
        question: '这个规划可以继续吗？',
        summaryText: formatCreationPlan(args),
        creationPlan,
        personalityPalette,
        choices: choices.length ? choices : defaultPlanChoices(),
      },
      creationPlan,
      personalityPalette,
      choices: choices.length ? choices : defaultPlanChoices(),
      stopForUser: true,
    }
  }

  if (toolName === 'record_entry_output') {
    const creationPlan = updatePlanEntryStatus(options.creationPlan, args)
    return {
      output: creationPlan
        ? {
            ok: true,
            summary: {
              entry: trimString(args.name || args.entryId),
              status: args.status,
              done: creationPlan.entries.filter((entry) => entry.status === 'done').length,
              total: creationPlan.entries.length,
            },
          }
        : { ok: false, error: '当前没有可更新的创作规划。' },
      creationPlan,
    }
  }

  if (toolName === 'evaluate_character_draft') {
    const characterArg = args.character && typeof args.character === 'object'
      ? args.character as Partial<CreateCharacterInput>
      : options.currentDraft ?? options.existingCharacter ?? undefined
    const validation = normalizeDraft({
      character: characterArg,
      worldbookEntries: args.worldbookEntries ?? options.currentWorldbookEntries ?? [],
      personalityPalette: args.personalityPalette ?? options.personalityPalette ?? undefined,
      creationPlan: args.creationPlan ?? options.creationPlan ?? undefined,
    }, options.existingCharacter)
    const evaluationReport = normalizeEvaluationReport(args, validation.issues)
    return {
      output: {
        ok: true,
        summary: {
          issues: evaluationReport.issues.length,
          score: evaluationReport.score,
        },
        evaluationReport,
      },
      evaluationReport,
    }
  }

  if (toolName === 'validate_character_draft' || toolName === 'save_character_draft') {
    const validation = normalizeDraft({
      ...(args as DraftPayload),
      personalityPalette: args.personalityPalette ?? options.personalityPalette ?? undefined,
      creationPlan: args.creationPlan ?? options.creationPlan ?? undefined,
    }, options.existingCharacter)
    if (validation.issues.length > 0) {
      return { output: { ok: false, issues: validation.issues, normalizedDraft: validation.draft } }
    }
    const draft = {
      ...validation.draft,
      personalityPalette: validation.draft.personalityPalette ?? options.personalityPalette ?? undefined,
      creationPlan: validation.draft.creationPlan ?? options.creationPlan ?? undefined,
    }
    return {
      output: {
        ok: true,
        summary: {
          name: draft.character.name,
          worldbookEntries: draft.worldbookEntries.length,
        },
      },
      savedDraft: toolName === 'save_character_draft' ? draft : undefined,
      personalityPalette: draft.personalityPalette,
      creationPlan: draft.creationPlan,
    }
  }

  return { output: { ok: false, error: `Unknown tool: ${toolName}` } }
}

const BUILDER_MAX_TOOL_ROUNDS = 24
const BUILDER_MAX_TEXT_CONTINUATIONS = 5

function appendVisibleBuilderContent(current: string, next: string) {
  const clean = next.trim()
  if (!clean) return current
  return current ? `${current.trimEnd()}\n\n${clean}` : clean
}

function getPlanProgress(plan?: NeoCreationPlan) {
  const entries = plan?.entries ?? []
  const done = entries.filter((entry) => entry.status === 'done' || entry.status === 'skipped').length
  return { done, total: entries.length }
}

function shouldAutoContinueBuilderText(options: {
  content: string
  finishReason?: string
  textContinuations: number
  toolLog: string[]
  creationPlan?: NeoCreationPlan
  currentDraft?: CreateCharacterInput | null
  currentWorldbookEntries?: CreateWorldbookEntryInput[]
}) {
  if (options.textContinuations >= BUILDER_MAX_TEXT_CONTINUATIONS) return false
  if (options.finishReason === 'length' || options.finishReason === 'max_tokens') return true
  if (options.toolLog.includes('ask_user_options') || options.toolLog.includes('present_creation_plan')) {
    return false
  }

  const content = options.content.trim()
  const hasWorkingState = !!options.creationPlan
    || !!options.currentDraft
    || !!options.currentWorldbookEntries?.length
    || options.toolLog.length > 0
  if (!hasWorkingState) return false

  const mentionsNextWork = /(继续|接下来|下一步|进入|开始|现在|马上|准备|修复|补全|校验|验证|保存|草稿|产出物|条目|完成|已完成|所有条目|worldbook|firstMessage|exampleDialogues)/i.test(content)
  const isOnlyProcessTalk = !/(已为你保存|产出物已准备好|右侧查看角色卡|请从下面选择|请选择一个|我需要你选择)/.test(content)
  return mentionsNextWork && isOnlyProcessTalk
}

function buildAutoContinueInstruction(options: {
  content: string
  finishReason?: string
  creationPlan?: NeoCreationPlan
  hasDraft: boolean
  hasWorldbookEntries: boolean
}) {
  const progress = getPlanProgress(options.creationPlan)
  return [
    '【Whale Builder 内部续跑指令】',
    '上一段只是过程说明，不能停在这里等待用户点击继续。',
    options.finishReason === 'length' || options.finishReason === 'max_tokens'
      ? '上一段可能因为输出长度被截断。请从中断处继续，不要重写已经完成的内容。'
      : '请立刻继续执行工作流，不要复述计划。',
    `当前创作规划进度：${progress.done}/${progress.total}。`,
    options.hasDraft ? '当前已有角色草稿。' : '当前还没有可保存的角色草稿。',
    options.hasWorldbookEntries ? '当前已有世界书条目。' : '当前还没有完整世界书条目。',
    '如果确实需要用户决定，必须调用 ask_user_options 给出选项；不要用普通文本追问。',
    '如果还在逐条产出，继续调用 record_entry_output 记录条目完成状态。',
    '如果条目已经完成，调用 validate_character_draft 校验；校验失败就修复并再次校验。',
    '校验通过后必须调用 save_character_draft 保存最终草稿。',
    '不要只输出“现在开始校验/现在保存/接下来修复”这类过程文字。',
    '',
    '上一段输出摘要：',
    trimString(options.content).slice(-1200),
  ].join('\n')
}

export async function runNeoCharacterBuilderTurn(options: NeoBuilderTurnOptions): Promise<NeoBuilderTurnResult> {
  const provider = createModelProvider(options.modelConfig)
  const messages = conversationToGenerateMessages(options)
  const events: NeoBuilderToolEvent[] = []
  const toolLog: string[] = []
  let totalUsage: MessageUsage | undefined
  let reasoningContent = ''
  let savedDraft: Omit<NeoCharacterBuilderResult, 'usage' | 'toolLog'> | undefined
  let currentCreationPlan = options.creationPlan ?? undefined
  let currentPersonalityPalette = options.personalityPalette ?? undefined
  let evaluationReport: NeoBuilderEvaluationReport | undefined
  let pendingChoices: NeoBuilderChoice[] | undefined
  let assistantContent = ''
  let textContinuations = 0

  for (let round = 0; round < BUILDER_MAX_TOOL_ROUNDS; round++) {
    const result = await generateBuilderStep(provider, {
      messages,
      model: options.modelConfig.model,
      temperature: options.modelConfig.temperature,
      omitTemperature: shouldOmitTemperatureForModel(options.modelConfig),
      maxTokens: Math.max(options.modelConfig.maxTokens || 0, 2600),
      reasoningEffort: options.modelConfig.reasoningEffort,
      tools: CHAT_TOOL_DEFINITIONS,
      toolChoice: 'auto',
      userId: getChatScopedDeepSeekUserId(options.modelConfig, `character_builder_${options.scopeId || 'new'}`),
      signal: options.signal,
    }, options)

    totalUsage = addUsage(totalUsage, result.usage)
    if (result.reasoningContent) {
      reasoningContent = [reasoningContent, result.reasoningContent].filter(Boolean).join('\n\n')
    }
    assistantContent = appendVisibleBuilderContent(assistantContent, result.content || '')

    if (result.toolCalls?.length) {
      messages.push({
        role: 'assistant',
        content: result.content || '',
        toolCalls: result.toolCalls,
      })

      for (const call of result.toolCalls) {
        const args = parseToolArguments(call.function.arguments)
        const toolName = call.function.name
        const id = createBuilderEventId()
        const runningEvent: NeoBuilderToolEvent = {
          id,
          name: toolName,
          label: getToolLabel(toolName),
          status: 'running',
          args,
        }
        emitToolEvent(events, options.onToolEvent, runningEvent)

        try {
          const executed = await executeBuilderTool(toolName, args, {
            ...options,
            creationPlan: currentCreationPlan,
            personalityPalette: currentPersonalityPalette,
          })
          const doneEvent: NeoBuilderToolEvent = {
            ...runningEvent,
            status: 'done',
            result: summarizeToolOutput(executed.output),
          }
          emitToolEvent(events, options.onToolEvent, doneEvent)
          toolLog.push(toolName)
          messages.push({
            role: 'tool',
            toolCallId: call.id,
            name: toolName,
            content: stringifyToolResult(executed.output),
          })

          if (executed.savedDraft) savedDraft = executed.savedDraft
          if (executed.creationPlan) currentCreationPlan = executed.creationPlan
          if (executed.personalityPalette) currentPersonalityPalette = executed.personalityPalette
          if (executed.evaluationReport) evaluationReport = executed.evaluationReport
          if (executed.choices?.length) pendingChoices = executed.choices
          if (executed.stopForUser) {
            const output = executed.output as Record<string, unknown>
            assistantContent = buildStopForUserContent(output)
            return {
              content: assistantContent || result.content || '我需要你再补一个选择。',
              choices: pendingChoices,
              draft: savedDraft,
              creationPlan: currentCreationPlan,
              personalityPalette: currentPersonalityPalette,
              evaluationReport,
              usage: withDeepSeekUsageCost(totalUsage, options.modelConfig),
              reasoningContent: reasoningContent || undefined,
              toolEvents: [...events],
              toolLog,
            }
          }
        } catch (err) {
          const errorMessage = (err as Error).message || 'Tool failed'
          emitToolEvent(events, options.onToolEvent, {
            ...runningEvent,
            status: 'error',
            error: errorMessage,
          })
          toolLog.push(toolName)
          messages.push({
            role: 'tool',
            toolCallId: call.id,
            name: toolName,
            content: stringifyToolResult({ ok: false, error: errorMessage }),
          })
        }
      }

      if (savedDraft) {
        assistantContent = result.content || `产出物已准备好：${savedDraft.character.name}。你可以在右侧查看角色卡与世界书细则，然后保存。`
        break
      }
      continue
    }

    const parsed = extractJsonObject(assistantContent)
    if (parsed) {
      const validation = normalizeDraft(parsed, options.existingCharacter)
      if (validation.issues.length === 0) savedDraft = validation.draft
    }

    if (savedDraft) break

    if (shouldAutoContinueBuilderText({
      content: result.content || assistantContent,
      finishReason: result.finishReason,
      textContinuations,
      toolLog,
      creationPlan: currentCreationPlan,
      currentDraft: options.currentDraft,
      currentWorldbookEntries: options.currentWorldbookEntries,
    })) {
      textContinuations += 1
      messages.push({
        role: 'assistant',
        content: result.content || assistantContent,
      })
      messages.push({
        role: 'user',
        content: buildAutoContinueInstruction({
          content: result.content || assistantContent,
          finishReason: result.finishReason,
          creationPlan: currentCreationPlan,
          hasDraft: !!options.currentDraft || !!savedDraft,
          hasWorldbookEntries: !!options.currentWorldbookEntries?.length,
        }),
      })
      continue
    }
    break
  }

  return {
    content: assistantContent || (savedDraft ? `产出物已准备好：${savedDraft.character.name}。` : '我已经处理完这一轮。'),
    choices: pendingChoices,
    draft: savedDraft,
    creationPlan: currentCreationPlan,
    personalityPalette: savedDraft?.personalityPalette ?? currentPersonalityPalette,
    evaluationReport,
    usage: withDeepSeekUsageCost(totalUsage, options.modelConfig),
    reasoningContent: reasoningContent || undefined,
    toolEvents: events,
    toolLog,
  }
}

export async function buildNeoCharacterDraft(options: NeoCharacterBuilderOptions): Promise<NeoCharacterBuilderResult> {
  const provider = createModelProvider(options.modelConfig)
  const messages: GenerateMessage[] = [
    { role: 'system', content: buildSystemPrompt() },
    { role: 'user', content: buildUserPrompt(options) },
  ]

  let totalUsage: MessageUsage | undefined
  let savedDraft: Omit<NeoCharacterBuilderResult, 'usage' | 'toolLog'> | null = null
  let currentCreationPlan: NeoCreationPlan | undefined
  let currentPersonalityPalette: NeoPersonalityPalette | undefined
  let evaluationReport: NeoBuilderEvaluationReport | undefined
  const toolLog: string[] = []

  for (let round = 0; round < 12; round++) {
    const result = await provider.generate({
      messages,
      model: options.modelConfig.model,
      temperature: options.modelConfig.temperature,
      omitTemperature: shouldOmitTemperatureForModel(options.modelConfig),
      maxTokens: Math.max(options.modelConfig.maxTokens || 0, 3200),
      reasoningEffort: options.modelConfig.reasoningEffort,
      tools: TOOL_DEFINITIONS,
      toolChoice: 'auto',
      userId: getChatScopedDeepSeekUserId(options.modelConfig, `character_builder_${options.scopeId || 'new'}`),
      signal: options.signal,
    })

    totalUsage = addUsage(totalUsage, result.usage)

    if (result.toolCalls?.length) {
      messages.push({
        role: 'assistant',
        content: result.content || '',
        toolCalls: result.toolCalls,
      })

      for (const call of result.toolCalls) {
        const args = parseToolArguments(call.function.arguments)
        const toolName = call.function.name
        let output: unknown

        if (toolName === 'list_skill_references') {
          const query = optionalString(args.query)
          output = { ok: true, query, references: listNeoBuilderSkillReferences(query) }
        } else if (toolName === 'read_skill_reference') {
          const id = trimString(args.id)
          const reference = readNeoBuilderSkillReference(id)
          output = reference
            ? {
                ok: true,
                id: reference.id,
                title: reference.title,
                summary: reference.summary,
                content: reference.content,
              }
            : { ok: false, error: `Unknown reference id: ${id}`, availableIds: NEO_BUILDER_REFERENCE_LOOKUP_IDS }
        } else if (toolName === 'record_entry_output') {
          currentCreationPlan = updatePlanEntryStatus(currentCreationPlan, args)
          output = currentCreationPlan
            ? { ok: true, summary: { status: args.status, done: currentCreationPlan.entries.filter((entry) => entry.status === 'done').length, total: currentCreationPlan.entries.length } }
            : { ok: false, error: '当前没有可更新的创作规划。' }
        } else if (toolName === 'evaluate_character_draft') {
          const validation = normalizeDraft({
            character: args.character as Partial<CreateCharacterInput> | undefined,
            worldbookEntries: args.worldbookEntries,
            personalityPalette: args.personalityPalette ?? currentPersonalityPalette,
            creationPlan: args.creationPlan ?? currentCreationPlan,
          }, options.existingCharacter)
          evaluationReport = normalizeEvaluationReport(args, validation.issues)
          output = { ok: true, evaluationReport, summary: { issues: evaluationReport.issues.length, score: evaluationReport.score } }
        } else if (toolName === 'validate_character_draft' || toolName === 'save_character_draft') {
          const validation = normalizeDraft(args as DraftPayload, options.existingCharacter)
          if (validation.issues.length > 0) {
            output = { ok: false, issues: validation.issues, normalizedDraft: validation.draft }
          } else {
            const draft = {
              ...validation.draft,
              personalityPalette: validation.draft.personalityPalette ?? currentPersonalityPalette,
              creationPlan: validation.draft.creationPlan ?? currentCreationPlan,
              evaluationReport: validation.draft.evaluationReport ?? evaluationReport,
            }
            output = {
              ok: true,
              summary: {
                name: draft.character.name,
                worldbookEntries: draft.worldbookEntries.length,
              },
            }
            if (toolName === 'save_character_draft') savedDraft = draft
            if (draft.creationPlan) currentCreationPlan = draft.creationPlan
            if (draft.personalityPalette) currentPersonalityPalette = draft.personalityPalette
          }
        } else {
          output = { ok: false, error: `Unknown tool: ${toolName}` }
        }

        toolLog.push(toolName)
        messages.push({
          role: 'tool',
          toolCallId: call.id,
          name: toolName,
          content: stringifyToolResult(output),
        })
      }

      if (savedDraft) break
      continue
    }

    const parsed = extractJsonObject(result.content)
    if (parsed) {
      const validation = normalizeDraft(parsed, options.existingCharacter)
      if (validation.issues.length === 0) {
        savedDraft = validation.draft
        break
      }
    }

    messages.push({
      role: 'assistant',
      content: result.content || '',
    })
    messages.push({
      role: 'user',
      content: '请不要继续普通文本说明。请根据 Whale Play 工作流修正草稿，并调用 save_character_draft 保存最终结果。',
    })
  }

  if (!savedDraft) {
    throw new Error('AI 没有保存可用的 Whale Play 角色卡草稿，请补充更明确的角色方向后重试。')
  }

  return {
    ...savedDraft,
    usage: withDeepSeekUsageCost(totalUsage, options.modelConfig),
    toolLog,
  }
}
