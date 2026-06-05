# 正则规则

正则规则用于对 AI 生成的文本进行后处理，从原始模型输出中提取结构化的显示块。它们定义在 `packages/shared/src/types/regex-rule.ts` 中，由 `packages/core/src/regex/index.ts` 进行处理。

## 规则接口

```typescript
export interface RegexRule {
  id: string
  presetId: string
  name: string
  pattern: string
  displayTemplate: string
  stripFromPrompt: boolean
  enabled: boolean
  createdAt: string
}

export interface RegexPreset {
  id: string
  name: string
  description: string
  rules: RegexRule[]
  isGlobal: boolean
  createdAt: string
  updatedAt: string
}
```

## 字段说明

| 字段 | 类型 | 描述 |
|-------|------|-------------|
| `id` | `string` | 规则唯一标识符 |
| `presetId` | `string` | 该规则所属的预设 |
| `name` | `string` | 规则名称。命名前缀（`💬` 等）影响规则的分组方式。 |
| `pattern` | `string` | JavaScript 兼容的正则模式（不含定界符）。用于匹配模型输出的各个部分。 |
| `displayTemplate` | `string` | 用于渲染匹配文本的模板字符串。支持 `$1`、`$2` 等捕获组引用。特殊值：`$1`（unwrap 规则）、`$actions`（动作块提取）。 |
| `stripFromPrompt` | `boolean` | 若为 `true`，匹配到的文本将从发送给模型的 prompt 中移除。 |
| `enabled` | `boolean` | 规则是否激活。禁用的规则在处理时会被跳过。 |

## 规则分类

规则在运行时根据其 `name` 前缀和属性值进行分类：

| 分类 | 标识 | 行为 |
|----------|-----------|----------|
| **对话** | 名称以 `💬` 开头 | 从响应中提取对话块。正则表达式中应使用 `($1)` 捕获说话者，`($2)` 捕获对话内容。生成类型为 `"dialogue"` 的 `DisplayBlock` 条目。 |
| **Prompt 剥离** | `stripFromPrompt === true` 或没有 `displayTemplate` | 匹配到的文本将从发送给模型的 prompt 内容中移除。显示文本也会被剥离。 |
| **Unwrap** | `displayTemplate === '$1'` | 用第一个捕获组 `$1` 替换整个匹配内容。用于移除包裹标记。 |
| **动作** | `displayTemplate === '$actions'` | 从匹配中提取动作项。将捕获组拆分为单独的动作行，生成包含 `actions` 数组的 `SideBlock`。 |
| **内联模板** | 规则名称匹配 "内心"/"inner"/"thought" 或 `displayTemplate` 包含 `neo-thoughts` | 将匹配文本替换为带样式的内联模板标记。在聊天 UI 中渲染为可展开的 `<details>` 元素。 |
| **侧边模板** | 其他所有带有 `displayTemplate` 的规则 | 匹配文本从主显示区移除，作为 `SideBlock` 条目单独渲染。 |

## 显示块

`applyRegexRules()` 函数返回一个 `SplitResult`：

```typescript
interface SplitResult {
  mainContent: string        // 原始内容
  promptContent: string      // 发送给模型的内容（已移除 stripFromPrompt 规则匹配的部分）
  displayContent: string     // 在 UI 中显示的内容
  displayBlocks: DisplayBlock[]  // 结构化的显示片段
  sideBlocks: SideBlock[]       // 补充内容块
}
```

### DisplayBlock 类型

```typescript
interface DisplayBlock {
  type: 'narration' | 'dialogue' | 'template' | 'image'
  content: string
  speaker?: string    // 仅用于 type === 'dialogue'
  name?: string       // 仅用于 type === 'template' 或 'image'
}
```

| 类型 | 描述 |
|------|-------------|
| `narration` | 对话行之间未匹配的叙述性/描述性文本 |
| `dialogue` | 带有可选的 `speaker` 名称的对话行。由 `💬` 前缀的规则提取。 |
| `template` | 模板规则产生的内联展开内容（例如在带样式的 `<details>` 元素中渲染的角色内心活动）。 |
| `image` | 从文本中提取的 `[image]...[/image]` 标签。 |

### 显示块的规则

- **对话**块格式化为：`**{speaker}：**{content}`
- **叙述**块渲染为纯文本
- **模板**块使用其 display template 进行渲染
- **图片**块渲染为 `[image]{prompt}[/image]` 内联形式

### 对话与叙述的分离

对话规则（以 `💬` 为前缀）将显示内容交替分割为对话块和叙述块。这是通过 `buildDisplayBlocks()` 实现的：

```typescript
function buildDisplayBlocks(content: string, regex: RegExp): DisplayBlock[] {
  // 对于每个正则匹配：
  //   - 匹配前的文本 → 叙述块
  //   - 匹配本身 → 对话块
  //   - 最后一个匹配后的文本 → 叙述块
}
```

对话匹配之外的文本成为叙述内容。这使得聊天 UI 能够渲染说话者名称，对对话和叙述文本应用不同的样式，并正确处理多行交流。

## 输入类型

```typescript
export interface CreateRegexRuleInput {
  name: string
  pattern: string
  displayTemplate: string
  stripFromPrompt: boolean
  enabled: boolean
}

export interface UpdateRegexRuleInput {
  name?: string
  pattern?: string
  displayTemplate?: string
  stripFromPrompt?: boolean
  enabled?: boolean
}
```

## 内置规则

应用在首次启动时通过 `seedBuiltinRegex()` 预置了若干内置的正则规则。这些规则为常见的角色扮演输出模式提供了默认格式化（对话提取、内心活动、格式标记等）。
