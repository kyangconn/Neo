# Regex Rules

Regex rules post-process AI-generated text to extract structured display blocks from raw model output. They are defined in `packages/shared/src/types/regex-rule.ts` and processed by `packages/core/src/regex/index.ts`.

## Rule Interface

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

## Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Unique rule identifier |
| `presetId` | `string` | The preset this rule belongs to |
| `name` | `string` | Rule name. Convention prefixes (`💬`, etc.) affect how the rule is categorized. |
| `pattern` | `string` | JavaScript-compatible regex pattern (without delimiters). Used to match sections of model output. |
| `displayTemplate` | `string` | Template string for rendering matched text. Supports `$1`, `$2`, etc. for captured groups. Special values: `$1` (unwrap rule), `$actions` (action block extraction). |
| `stripFromPrompt` | `boolean` | If `true`, the matched text is removed from the prompt input to the model. |
| `enabled` | `boolean` | Whether the rule is active. Disabled rules are skipped during processing. |

## Rule Categories

Rules are categorized at runtime by their `name` prefix and property values:

| Category | Identifier | Behavior |
|----------|-----------|----------|
| **Dialogue** | Name starts with `💬` | Extracts dialogue blocks from the response. The regex should capture `($1)` as the speaker and `($2)` as the dialogue content. Produces `DisplayBlock` entries of type `"dialogue"`. |
| **Prompt strip** | `stripFromPrompt === true` or no `displayTemplate` | Matched text is removed from the prompt content sent to the model. The display text is also stripped. |
| **Unwrap** | `displayTemplate === '$1'` | Replaces the entire match with the first capture group `$1`. Useful for removing wrapping markers. |
| **Action** | `displayTemplate === '$actions'` | Extracts action items from the match. Splits captured groups into individual action lines and produces a `SideBlock` with an `actions` array. |
| **Inline template** | Rule name matches "内心"/"inner"/"thought" or `displayTemplate` contains `neo-thoughts` | Replaces matched text with a styled inline template marker. Rendered as expandable `<details>` elements in the chat UI. |
| **Side template** | All other rules with a `displayTemplate` | Matched text is removed from the main display and rendered separately as `SideBlock` entries. |

## Display Blocks

The `applyRegexRules()` function returns a `SplitResult`:

```typescript
interface SplitResult {
  mainContent: string        // Original content
  promptContent: string      // Content sent to the model (stripped of stripFromPrompt rules)
  displayContent: string     // Content shown in the UI
  displayBlocks: DisplayBlock[]  // Structured display segments
  sideBlocks: SideBlock[]       // Supplementary content blocks
}
```

### DisplayBlock types

```typescript
interface DisplayBlock {
  type: 'narration' | 'dialogue' | 'template' | 'image'
  content: string
  speaker?: string    // Only for type === 'dialogue'
  name?: string       // Only for type === 'template' or 'image'
}
```

| Type | Description |
|------|-------------|
| `narration` | Unmatched prose / descriptive text between dialogue lines |
| `dialogue` | A spoken line with an optional `speaker` name. Extracted by `💬`-prefixed rules. |
| `template` | An inline expansion from a template rule (e.g. character thoughts rendered in a styled `<details>` element). |
| `image` | An `[image]...[/image]` tag extracted from the text. |

### Display rules for blocks

- **Dialogue** blocks are formatted as: `**{speaker}：**{content}`
- **Narration** blocks are rendered as plain text
- **Template** blocks are rendered using their display template
- **Image** blocks are rendered as `[image]{prompt}[/image]` inline

### Separation of dialogue vs narration

Dialogue rules (prefixed with `💬`) split the display content into alternating dialogue and narration blocks. This is done via `buildDisplayBlocks()`:

```typescript
function buildDisplayBlocks(content: string, regex: RegExp): DisplayBlock[] {
  // For each regex match:
  //   - Text before the match → narration block
  //   - The match itself → dialogue block
  //   - Text after last match → narration block
}
```

Text outside dialogue matches becomes narration. This allows the chat UI to render speaker names, apply distinct styling to dialogue vs narrative prose, and properly handle multi-line exchanges.

## Input Types

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

## Built-in Rules

The app seeds several built-in regex rules on first launch via `seedBuiltinRegex()`. These provide default formatting for common RP output patterns (dialogue extraction, inner thoughts, formatting markers, etc.).
