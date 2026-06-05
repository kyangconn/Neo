# 模型配置

`ModelConfig` 接口定义了语言模型提供商的连接参数。配置通过 `settingsRepository` 和 `useSettingsStore` 进行存储和管理。

## 接口定义

```typescript
export interface ModelConfig {
  id: string
  provider: ModelProviderType
  name: string
  baseUrl: string
  apiKey: string
  model: string
  temperature: number
  maxTokens: number
  reasoningEffort?: string
  streamingEnabled?: boolean
  createdAt: string
  updatedAt: string
}

export type ModelProviderType = 'openai-compatible'
```

## 字段说明

| 字段 | 类型 | 默认值 | 描述 |
|-------|------|---------|-------------|
| `id` | `string` | — | 唯一标识符（由 `generateId()` 生成） |
| `provider` | `ModelProviderType` | — | 提供商类型。当前仅支持 `'openai-compatible'`。 |
| `name` | `string` | — | 用户友好的配置名称，显示在 UI 下拉菜单中 |
| `baseUrl` | `string` | — | API 端点 URL（例如 `https://api.openai.com/v1`） |
| `apiKey` | `string` | — | API 认证密钥 |
| `model` | `string` | — | 模型标识符（例如 `gpt-4o`、`claude-3-opus-20240229`） |
| `temperature` | `number` | `0.8` | 采样温度。范围：`0`–`2`。值越高，输出越随机。 |
| `maxTokens` | `number` | — | 模型单次响应可生成的最大 token 数量 |
| `reasoningEffort` | `string` | — | 推理努力级别。可接受 `''`（无）、`'high'` 或 `'maximum'`。用于支持推理的模型提供商。 |
| `streamingEnabled` | `boolean` | — | 是否启用逐 token 流式输出模型响应。启用后 UI 会增量更新。 |
| `createdAt` | `string` | — | 创建时间的 ISO 8601 时间戳 |
| `updatedAt` | `string` | — | 最后更新时间的 ISO 8601 时间戳 |

## 输入类型

### CreateModelConfigInput

用于创建新的模型配置。除连接参数外所有字段均为可选：

```typescript
export interface CreateModelConfigInput {
  provider: ModelProviderType
  name: string
  baseUrl: string
  apiKey: string
  model: string
  temperature?: number
  maxTokens?: number
  reasoningEffort?: string
  streamingEnabled?: boolean
}
```

### UpdateModelConfigInput

用于更新现有配置。所有字段均为可选；省略的字段将保留当前值：

```typescript
export interface UpdateModelConfigInput {
  provider?: ModelProviderType
  name?: string
  baseUrl?: string
  apiKey?: string
  model?: string
  temperature?: number
  maxTokens?: number
  reasoningEffort?: string
  streamingEnabled?: boolean
}
```

## Temperature 使用指南

| Temperature | 行为 |
|-------------|----------|
| `0`–`0.3` | 确定性、专注的输出——适合事实性回复 |
| `0.4`–`0.7` | 平衡的创造力和连贯性 |
| `0.8`（默认） | 中等创造力——适合角色扮演对话 |
| `0.9`–`1.5` | 高创造力，输出更多样化——可能变得不够连贯 |
| `1.5`–`2.0` | 最大随机性——仅用于实验 |

## 存储

模型配置以 JSON 数组形式存储在 storage 层的 `neotavern_model_configs` 键下。额外的 `neotavern_active_config_id` 键用于追踪当前选中的聊天配置。

```typescript
// 保存配置
await settingsRepository.saveModelConfig(config);

// 获取所有配置
const configs = await settingsRepository.getAllModelConfigs();

// 获取当前激活的配置
const activeId = await settingsRepository.getActiveConfigId();

// 设置当前激活的配置
await settingsRepository.setActiveConfigId(id);
```
