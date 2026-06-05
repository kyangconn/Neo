# Prompt Injection Pipeline

The prompt pipeline is the core mechanism that assembles every message sent to the language model during a chat session. It is implemented in `@neo-tavern/core`'s `buildChatPrompt` function (`packages/core/src/prompt/prompt-builder.ts`).

## Build Order

Messages are appended to the prompt message list in the following order:

```
 1. System Rules
     └─ default or custom system-level instructions
 2. Preset Items (sorted by injectionOrder)
     └─ merged into a single message, slot placeholders resolved
 3. Character Block
     └─ name, description, personality, scenario, example dialogues
 4. User Persona
     └─ the user's own character sheet
 5. Before-History Context Blocks
     └─ worldbook (pre-context), memory summaries, safety rules
 6. Chat History
     ├─ trimmed by token budget (oldest-first)
     ├─ atDepth blocks inserted at a specific depth within history
     └─ First Message prepended for new sessions
 7. After-History Context Blocks
     └─ worldbook (recalled), agentic play state
 8. User Input
     └─ the current user message
```

## Context Block Model

All contextual data that is not part of the core conversation is modeled as `ContextBlock`:

```typescript
interface ContextBlock {
  id: string
  source: 'character' | 'worldbook' | 'memory' | 'agentic' | 'persona' | 'system' | 'safety'
  title: string
  content: string
  priority: number
  role?: 'system' | 'user' | 'assistant'
  position?: 'beforeHistory' | 'afterHistory' | 'atDepth'
  depth?: number
}
```

### Source, Position & Priority

| source          | meaning                 | typical position            | priority            |
|-----------------|-------------------------|-----------------------------|---------------------|
| `character`     | Character card info     | `beforeHistory`              | 0                   |
| `worldbook`     | Worldbook entries       | `beforeHistory` / `afterHistory` | Entry priority |
| `memory`        | Long-term memory digest | `beforeHistory`              | Low                 |
| `persona`       | User persona            | `beforeHistory`              | —                   |
| `agentic`       | Agentic Play scene state | `afterHistory`              | 20000               |
| `system/safety` | System safety rules     | `beforeHistory`              | —                   |

Priority determines sort order within the same position: higher-priority blocks come first. Worldbook entries carry their own per-entry priority value.

## Preset Items

Preset items are user-configurable prompt snippets injected before the character block. They are sorted by `injectionOrder` (ascending) and merged into a single message.

Preset items can contain `<extra_preset_slot />` placeholders that are resolved at build time. Three built-in slots are available:

| Slot name         | Resolved content                                          |
|-------------------|-----------------------------------------------------------|
| `chat history`    | Formatted chat history with atDepth blocks embedded       |
| `前置世界书`      | Static worldbook entries (`position: "beforeHistory"`)    |
| `召回世界书`      | Recalled worldbook entries (`position: "afterHistory"`)   |

This allows preset items to control exactly where history and worldbook content appear, rather than relying on the default injection order.

## Worldbook Injection Flow

Worldbook entries are the primary mechanism for injecting lore and dynamic context. The injection happens in five steps:

1. **Regex post-processing** — After the AI responds, display blocks are extracted from the reply text.
2. **Keyword matching** — Recent conversation text is matched against worldbook entry keywords.
3. **Split by position** — Matched entries are divided into two groups:
   - `beforeHistory` entries → **static worldbook** (pre-context)
   - `afterHistory` entries → **recalled worldbook** (post-context)
4. **Static worldbook** is injected before chat history, alongside other before-history blocks.
5. **Recalled worldbook** is injected after chat history, before the user input.

## Token Budget & History Trimming

When `maxTotalTokens` is provided, the builder calculates a token budget for chat history:

```text
overhead = systemRules + presetContent + characterBlock
         + userPersona + userInput + contextBlockOverhead
         + firstMessage (if present) + 100 (safety margin)

historyBudget = maxTotalTokens - overhead

history = trimMessagesByTokens(recentMessages, historyBudget)
```

Trimming is **oldest-first**: messages are kept from the end of the array toward the front, discarding the oldest messages when the budget is exceeded.

## atDepth Context Blocks

Context blocks with `position: "atDepth"` are inserted at a specific position within the chat history. The depth value (0-based from the end of history) determines insertion:

```typescript
const index = Math.max(0, historyMessages.length - depth);
historyMessages.splice(index, 0, block);
```

This is useful for injecting reminders or rules mid-conversation rather than at the beginning or end.

## `buildChatPrompt` Signature

```typescript
function buildChatPrompt(input: BuildPromptInput): BuiltPrompt

interface BuildPromptInput {
  character: Character
  recentMessages: Message[]
  userInput: string
  maxTotalTokens?: number
  systemRules?: string
  userPersona?: string
  userName?: string
  contextBlocks?: ContextBlock[]
  presetItems?: { role, content, injectionOrder }[]
}

interface BuiltPrompt {
  messages: GenerateMessage[]
  previewText: string
  tokenEstimate: number
  includedContextBlocks: ContextBlock[]
}
```

## Injection Position Summary

| Content                 | Injection method                              | Position in message list                          |
|-------------------------|-----------------------------------------------|---------------------------------------------------|
| System Rules            | `buildChatPrompt` `systemRules` param         | Message list, position 0                         |
| Preset Items            | `buildChatPrompt` `presetItems` param         | After system rules, before character block        |
| Character Block         | `buildChatPrompt` `character` param           | After preset items                                |
| User Persona            | `buildChatPrompt` `userPersona` param         | After character block                             |
| Worldbook (static)      | `ContextBlock`, `position: "beforeHistory"`   | After persona, before history                    |
| Worldbook (recalled)    | `ContextBlock`, `position: "afterHistory"`    | After history, before user input                 |
| Memory Summary          | `ContextBlock`, `position: "beforeHistory"`   | Sorted with static worldbook                     |
| Agentic Play State      | `ContextBlock`, `position: "afterHistory"`    | After history, before user input                 |
| Tools Definition        | OpenAI `tools` parameter                      | Sent with API request, not in prompt text        |
| Tool Execution Results  | `role: "tool"` message                        | Inserted after the assistant message that called it |
