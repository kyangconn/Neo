# 世界书模式

世界书（World Book）在聊天过程中提供动态 lore 和上下文注入。每个世界书包含若干条目，这些条目会与对话内容进行匹配，并在可配置的位置注入到 prompt 中。

## 类型定义

```typescript
export type WorldbookEntryType = "always" | "trigger";
export type TriggerMode = "and" | "or";
export type WorldbookInsertPosition = "beforeHistory" | "afterHistory" | "atDepth";
```

## Worldbook

```typescript
export interface Worldbook {
  id: string;
  name: string;
  hidden?: boolean;
  description: string;
  entries: WorldbookEntry[];
  createdAt: string;
  updatedAt: string;
}
```

| 字段          | 类型               | 描述                                      |
| ------------- | ------------------ | ----------------------------------------- |
| `id`          | `string`           | 唯一标识符                                |
| `name`        | `string`           | 世界书名称                                |
| `hidden`      | `boolean`          | 若为 `true`，在主要世界书列表选择器中隐藏 |
| `description` | `string`           | 描述或摘要                                |
| `entries`     | `WorldbookEntry[]` | 该世界书中的条目数组                      |

## WorldbookEntry

```typescript
export interface WorldbookEntry {
  id: string;
  worldbookId: string;
  title: string;
  keys: string;
  secondaryKeys?: string;
  content: string;
  priority: number;
  type: WorldbookEntryType;
  triggerMode: TriggerMode;
  selectiveLogic?: TriggerMode;
  scanDepth?: number;
  caseSensitive?: boolean;
  matchWholeWords?: boolean;
  useProbability?: boolean;
  probability?: number;
  position?: WorldbookInsertPosition;
  depth?: number;
  role?: "system" | "user" | "assistant";
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}
```

### 字段参考

| 字段              | 类型                                | 默认值 | 描述                                                                                                    |
| ----------------- | ----------------------------------- | ------ | ------------------------------------------------------------------------------------------------------- |
| `title`           | `string`                            | —      | 条目标题/显示名称                                                                                       |
| `keys`            | `string`                            | —      | 逗号分隔的触发关键词。当这些关键词出现在对话中时，该条目将被匹配。                                      |
| `secondaryKeys`   | `string`                            | —      | 用于选择性匹配的次级关键词（参照 SillyTavern 的选择性匹配行为）。空值表示无额外条件。                   |
| `content`         | `string`                            | —      | 触发时注入的 lore/内容                                                                                  |
| `priority`        | `number`                            | —      | 同一 `position` 组内的排序顺序。优先级越高的条目越先注入。                                              |
| `type`            | `WorldbookEntryType`                | —      | **`"always"`** = 无论关键词是否匹配都始终注入。**`"trigger"`** = 仅在关键词在最近的对话中被匹配时注入。 |
| `triggerMode`     | `TriggerMode`                       | —      | **`"and"`**（蓝灯）= 所有关键词必须全部出现。**`"or"`**（绿灯）= 任意一个关键词即可触发条目。           |
| `selectiveLogic`  | `TriggerMode`                       | —      | `secondaryKeys` 匹配的逻辑。参照 SillyTavern 的选择性匹配。未使用时为 `undefined`。                     |
| `scanDepth`       | `number`                            | `0`    | 扫描最近多少条消息以进行关键词匹配。`0` 表示扫描所有可用的 prompt 历史。                                |
| `caseSensitive`   | `boolean`                           | —      | 关键词匹配是否区分大小写                                                                                |
| `matchWholeWords` | `boolean`                           | —      | 关键词是否必须作为完整单词匹配（而非子串）                                                              |
| `useProbability`  | `boolean`                           | —      | 若启用，条目在触发时有一定的概率被注入                                                                  |
| `probability`     | `number`                            | —      | 当 `useProbability` 启用时的概率百分比（0–100）                                                         |
| `position`        | `WorldbookInsertPosition`           | —      | 条目在 prompt 中的注入位置（见下文）                                                                    |
| `depth`           | `number`                            | —      | 当 `position === "atDepth"` 时必须设置。从聊天历史末尾开始的 0 基偏移量。                               |
| `role`            | `'system' \| 'user' \| 'assistant'` | —      | 注入时分配给该内容的消息角色                                                                            |
| `enabled`         | `boolean`                           | —      | 条目是否激活。禁用的条目会被完全跳过。                                                                  |

## 注入位置

| 位置              | 描述                                                                                                                      |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `"beforeHistory"` | 在聊天历史**之前**注入，与其他静态上下文块（角色卡、persona、预设条目）一起。                                             |
| `"afterHistory"`  | 在聊天历史**之后**、当前用户输入之前注入。用于被召回/实时 lore。                                                          |
| `"atDepth"`       | 在聊天历史**内部的**特定深度注入。`depth` 字段（从历史末尾 0 基计数）决定位置：`index = max(0, history.length - depth)`。 |

## 条目类型

| 类型                    | 行为                                                                                                   |
| ----------------------- | ------------------------------------------------------------------------------------------------------ |
| **`"always"`**（常驻）  | 始终注入到 prompt 中，无论关键词是否匹配。适用于应始终存在的基础 lore。                                |
| **`"trigger"`**（触发） | 仅当条目关键词在最近的对话文本中被匹配时才注入。`triggerMode` 字段控制是需要全部关键词还是任一关键词。 |

## 触发模式

| 模式                    | 描述                                                            |
| ----------------------- | --------------------------------------------------------------- |
| **`"and"`**（蓝灯/and） | `keys` 字段中的所有关键词必须全部出现在对话中，条目才会被触发。 |
| **`"or"`**（绿灯/or）   | `keys` 字段中的任意一个关键词即可触发条目。                     |

## 注入流程

1. **Always 类型条目**无条件被收集用于注入。
2. **Trigger 类型条目**与最近的对话文本进行匹配（最多 `scanDepth` 条消息）。
3. 匹配的条目按 `priority`（降序）在每个 position 组内排序。
4. `position: "beforeHistory"` 的条目在聊天历史之前注入。
5. `position: "afterHistory"` 的条目在聊天历史之后注入。
6. `position: "atDepth"` 的条目按计算出的索引插入到历史记录中。
7. `@neo-tavern/core` 中的 `resolvedWorldbookEntries()` 函数负责处理此匹配和解析逻辑。

## 输入类型

```typescript
export interface CreateWorldbookInput {
  id?: string;
  name: string;
  hidden?: boolean;
  description: string;
}

export interface CreateWorldbookEntryInput {
  title: string;
  keys: string;
  secondaryKeys?: string;
  content: string;
  priority: number;
  type: WorldbookEntryType;
  triggerMode: TriggerMode;
  selectiveLogic?: TriggerMode;
  scanDepth?: number;
  caseSensitive?: boolean;
  matchWholeWords?: boolean;
  useProbability?: boolean;
  probability?: number;
  position?: WorldbookInsertPosition;
  depth?: number;
  role?: "system" | "user" | "assistant";
  enabled: boolean;
}
```

存储通过 `worldbookRepository` 处理，它将世界书以 JSON 形式持久化在 storage 键下，键前缀为 `neotavern_worldbooks`，或按 ID 单独存储。
