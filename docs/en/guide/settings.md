# Settings

The Settings page is where you control how Whale Play looks, behaves, and connects to AI services. This guide walks you through every section.

---

## How to Open Settings

Click the **gear icon** ⚙️ in the left sidebar to open the Settings page.

---

## API Configuration

This section is where you connect Whale Play to an AI service. You need an API key to use the app.

### Supported Providers

| Provider              | What you need                                                                                                           |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| **DeepSeek**          | An API key from [platform.deepseek.com](https://platform.deepseek.com/)                                                 |
| **OpenAI-compatible** | Any provider that supports the OpenAI API format (OpenAI, Groq, Together, etc.). You'll need a base URL and an API key. |

### Fields

| Field        | What it does                                                                                                                                                  |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **API Key**  | Your secret key for the AI provider. Keep this private — don't share it.                                                                                      |
| **Base URL** | The server address for the AI API. For DeepSeek, this is `https://api.deepseek.com`. For other providers, use their API endpoint.                             |
| **Model**    | Which AI model to use. Different models have different strengths (speed, creativity, reasoning ability). Common options: `deepseek-chat`, `gpt-4o-mini`, etc. |

![Settings API page](../../images/settings-api-config.png)

> **📸 Screenshot needed:** Navigate to Settings and scroll to the API Configuration section. Capture the page showing the API Key field (masked), Base URL field, and Model selector. Save as `docs/images/settings-api-config.png`.

---

## Temperature, Max Tokens, and Reasoning Effort

These settings control how the AI thinks and writes.

| Setting              | What it does                                                                                                                         | Low value              | High value                |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ---------------------- | ------------------------- |
| **Temperature**      | Controls randomness. Lower = more predictable, focused responses. Higher = more creative, surprising responses.                      | 0.3 — Safe, repetitive | 1.2 — Wild, creative      |
| **Max Tokens**       | The maximum length of each AI response. A token is roughly one word. 512 tokens ≈ 350 words.                                         | 256 — Short replies    | 2048 — Long monologues    |
| **Reasoning Effort** | (For supported models only) How much the model "thinks" before answering. Higher effort means better reasoning but slower responses. | Low — Fast replies     | High — Thoughtful answers |

### Recommended Starting Values

| Use case                  | Temperature | Max Tokens |
| ------------------------- | ----------- | ---------- |
| Quick casual chat         | 0.7         | 512        |
| Creative storytelling     | 0.9         | 1024       |
| Detailed world-building   | 0.8         | 1536       |
| Fast, no-nonsense replies | 0.4         | 256        |

---

## Appearance: Themes

Whale Play comes with several visual themes. Choose what's easiest on your eyes.

| Theme      | Best for                                                         |
| ---------- | ---------------------------------------------------------------- |
| **Light**  | Bright rooms, daytime use                                        |
| **Dark**   | Low light, nighttime, reduces eye strain                         |
| **Sepia**  | Warm, paper-like tone — great for long reading sessions          |
| **System** | Automatically follows your operating system's theme (light/dark) |

![Settings appearance](../../images/settings-appearance.png)

> **📸 Screenshot needed:** Navigate to the Appearance section in Settings. Capture the page showing the theme selector with all options (Light, Dark, Sepia, System) visible. Save as `docs/images/settings-appearance.png`.

---

## Context Tokens

This setting controls how much of the chat history the AI can "remember."

| Setting                 | What it does                                                                                                                                                          |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Context Token Limit** | The maximum number of tokens the AI considers when generating a response. This includes the character card, persona, active world book entries, and the chat history. |

### How It Works

- If your chat history + character card + world book entries = 10,000 tokens, and your context limit is 8,192, Whale Play will **trim the oldest messages** first to fit within the limit.
- A larger context means the AI remembers more of the conversation, but it also uses more tokens (which may cost more if you're on a pay-per-token plan).

### Recommendations

| Context Limit | Use case                                                                        |
| ------------- | ------------------------------------------------------------------------------- |
| 4,096 (4K)    | Short, focused conversations. Uses fewer tokens.                                |
| 8,192 (8K)    | Good default for most chats.                                                    |
| 16,384 (16K)  | Long, detailed roleplay sessions.                                               |
| 32,768 (32K)  | Very long stories with many world book entries. Only if your model supports it. |

---

## Regex Rules

Regex rules let you **automatically clean up or modify the AI's responses** before you see them. This is an advanced feature for fine-tuning output.

### What You Can Do

| Rule type            | What it does                                                           | Example                                                  |
| -------------------- | ---------------------------------------------------------------------- | -------------------------------------------------------- |
| **Strip**            | Remove unwanted text from AI responses.                                | Strip markdown formatting like `**bold**` or `*italic*`. |
| **Template**         | Replace patterns with custom text.                                     | Replace `{{char}}` with the character's name.            |
| **Display Template** | Change how text is displayed without affecting the underlying content. | Wrap dialogue in quotation marks for display.            |

### Common Use Cases

- Remove extra spaces or blank lines
- Replace `{{user}}` placeholders with the user's persona name
- Strip asterisks used for italic formatting
- Remove "System:" or "Assistant:" prefixes

> **Tip:** Regex (regular expressions) is a pattern-matching language. If you're not familiar with it, start with simple patterns like replacing one word with another.

For a full reference of available regex rule types and syntax, see the [Regex Rules Reference](../reference/regex-rules.md).

---

## Language Selection

Whale Play's interface is available in multiple languages.

| Language | Label   |
| -------- | ------- |
| English  | English |
| Chinese  | 中文    |

To change the language:

1. Go to Settings.
2. Find the **Language** dropdown.
3. Select your preferred language.
4. The interface updates immediately.

> **Note:** Language selection only affects the app's interface (buttons, labels, menus). It does not control what language the AI responds in. To influence the AI's language, mention it in your character card or preset.

---

## Next Steps

- Make sure your API is configured, then [start chatting](./chat.md)!
- Fine-tune the AI's behavior with [Presets](./presets.md)
- Explore [Image Generation](./image-generation.md) to bring scenes to life visually
