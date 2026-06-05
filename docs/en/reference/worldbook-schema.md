# World Book Schema

World books provide dynamic lore and context injection during chat. Each world book contains entries that are matched against conversation content and injected into the prompt at configurable positions.

## Types

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

| Field         | Type               | Description                                             |
| ------------- | ------------------ | ------------------------------------------------------- |
| `id`          | `string`           | Unique identifier                                       |
| `name`        | `string`           | World book name                                         |
| `hidden`      | `boolean`          | If `true`, hidden from the main worldbook list selector |
| `description` | `string`           | Description or summary                                  |
| `entries`     | `WorldbookEntry[]` | Array of entries in this world book                     |

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

### Field Reference

| Field             | Type                                | Default | Description                                                                                                                                        |
| ----------------- | ----------------------------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `title`           | `string`                            | —       | Entry title / display name                                                                                                                         |
| `keys`            | `string`                            | —       | Comma-separated trigger keywords. The entry is matched when these keywords appear in the conversation.                                             |
| `secondaryKeys`   | `string`                            | —       | Secondary keys for selective matching (mirrors SillyTavern's selective matching behavior). Empty means no extra condition.                         |
| `content`         | `string`                            | —       | The lore/content to inject when triggered                                                                                                          |
| `priority`        | `number`                            | —       | Sort order within the same `position`. Higher priority entries are injected first.                                                                 |
| `type`            | `WorldbookEntryType`                | —       | **`"always"`** = always injected regardless of keyword matching. **`"trigger"`** = injected only when keywords are matched in recent conversation. |
| `triggerMode`     | `TriggerMode`                       | —       | **`"and"`** (蓝灯) = all keywords must be present. **`"or"`** (绿灯) = any keyword triggers the entry.                                             |
| `selectiveLogic`  | `TriggerMode`                       | —       | Logic for `secondaryKeys` matching. Mirrors SillyTavern's selective matching. `undefined` when not used.                                           |
| `scanDepth`       | `number`                            | `0`     | Number of recent messages to scan for keyword matches. `0` means scan all available prompt history.                                                |
| `caseSensitive`   | `boolean`                           | —       | Whether keyword matching is case-sensitive                                                                                                         |
| `matchWholeWords` | `boolean`                           | —       | Whether keywords must match as whole words (not as substrings)                                                                                     |
| `useProbability`  | `boolean`                           | —       | If enabled, the entry has a probabilistic chance of being injected even when triggered                                                             |
| `probability`     | `number`                            | —       | Probability percentage (0–100) when `useProbability` is enabled                                                                                    |
| `position`        | `WorldbookInsertPosition`           | —       | Where to inject the entry in the prompt (see below)                                                                                                |
| `depth`           | `number`                            | —       | Required when `position === "atDepth"`. 0-based offset from the end of chat history.                                                               |
| `role`            | `'system' \| 'user' \| 'assistant'` | —       | The message role assigned to this content when injected                                                                                            |
| `enabled`         | `boolean`                           | —       | Whether the entry is active. Disabled entries are skipped entirely.                                                                                |

## Injection Positions

| Position          | Description                                                                                                                                                              |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `"beforeHistory"` | Injected **before** the chat history, alongside other static context blocks (character card, persona, preset items).                                                     |
| `"afterHistory"`  | Injected **after** the chat history, before the current user input. Used for recalled/live lore.                                                                         |
| `"atDepth"`       | Injected at a specific depth **within** the chat history. The `depth` field (0-based from end of history) determines position: `index = max(0, history.length - depth)`. |

## Entry Types

| Type                   | Behavior                                                                                                                                                    |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`"always"`** (常驻)  | Always injected into the prompt, regardless of keyword matching. Useful for foundational lore that should always be present.                                |
| **`"trigger"`** (触发) | Injected only when the entry's keywords are matched in recent conversation text. The `triggerMode` field controls whether all or any keywords are required. |

## Trigger Modes

| Mode                   | Description                                                                                |
| ---------------------- | ------------------------------------------------------------------------------------------ |
| **`"and"`** (蓝灯/and) | All keywords in the `keys` field must appear in the conversation for the entry to trigger. |
| **`"or"`** (绿灯/or)   | Any one keyword from the `keys` field triggers the entry.                                  |

## Injection Flow

1. **Always-type entries** are unconditionally collected for injection.
2. **Trigger-type entries** are matched against recent conversation text (up to `scanDepth` messages).
3. Matched entries are sorted by `priority` (descending) for each position group.
4. Entries with `position: "beforeHistory"` are injected before chat history.
5. Entries with `position: "afterHistory"` are injected after chat history.
6. Entries with `position: "atDepth"` are spliced into the history at the calculated index.
7. The `resolvedWorldbookEntries()` function in `@neo-tavern/core` handles this matching and resolution logic.

## Input Types

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

Storage is handled through `worldbookRepository`, which persists world books as JSON under storage keys prefixed with `neotavern_worldbooks` or individually by ID.
