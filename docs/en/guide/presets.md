# Presets

Presets let you customize **how the AI behaves** by writing custom instructions (prompts) that get sent alongside every chat message. Think of presets as "personality cards" for the AI itself — they shape the assistant's tone, rules, and style.

---

## What Are Presets?

Every time you send a message in a chat, Whale Play builds a prompt that includes:

- The character card
- Chat history
- Active world book entries
- Your persona
- **Preset cards** — custom instructions you write

Presets are made up of one or more **cards**. Each card is a piece of text with a **role** (system or user) and an **order**. The cards are assembled in order and sent to the AI as additional instructions.

| Without Preset | With Preset |
|---|---|
| The AI only knows about the character and the conversation. | The AI also follows your custom rules: "Always narrate in third person," "Use poetic language," "Never godmod." |

---

## Creating a Preset

1. In the **left sidebar**, click the **preset icon** ⚡ (Presets).
2. Click **"New Preset"**.
3. Give your preset a **name** (e.g., "Storyteller Mode").
4. Start adding cards to the preset.

![Presets page](../images/presets-page.png)

> **📸 Screenshot needed:** Navigate to the Presets page. Capture the full page showing 2–3 preset cards in the list (e.g., "Storyteller Mode," "Combat Rules," "Minimalist"), with the "New Preset" button visible. Save as `docs/images/presets-page.png`.

---

## Adding Cards to a Preset

Each card is a single instruction. Click **"Add Card"** to create a new one.

| Field | Required? | What it does | Example |
|---|---|---|---|
| **Name** | Yes | A label for this card so you can identify it in the list. | Narration Style |
| **Role** | Yes | Whether this instruction is sent as a **system** message or a **user** message. See below for details. | system |
| **Content** | Yes | The actual instruction text. | Always narrate actions and environment in vivid detail. Use all five senses. |
| **Order** | Yes | A number that determines where this card appears relative to other cards. Lower numbers go first. | 1 |

### System vs. User Role

| Role | When to use |
|---|---|
| **System** | The most common choice. These instructions act as rules the AI must follow — like a director giving notes. System messages carry more weight. |
| **User** | These instructions are framed as if you (the user) said them. Use this for instructions that should feel like part of the conversation rather than hard rules. |

In practice, you'll use **system** for almost everything. Use **user** only if you want the instruction to blend into the chat history.

---

## Reordering Cards

Cards are processed in the order you set. To change the order:

- **Drag and drop** a card up or down in the list. The order numbers update automatically.
- Or manually edit the **Order** field of each card.

The AI receives the cards in order: lowest number first, highest number last.

---

## Enabling and Disabling Individual Cards

Each card has a **toggle switch**. You can turn cards on and off without deleting them.

- **Enabled (on):** The card is included when the preset is active.
- **Disabled (off):** The card is saved but skipped.

This is useful when you want to temporarily remove an instruction without losing it. For example, you might disable a "Combat Rules" card during a peaceful scene and re-enable it later.

---

## Activating a Preset for Chats

Presets are **per-character** or **per-chat**. You can assign a different preset to each character.

1. Open a character's **edit dialog** (from the Characters page).
2. Find the **Preset** dropdown selector.
3. Choose the preset you want to use.
4. Click **"Save"**.

Now, every chat with that character will use the selected preset. If you don't select a preset, the default behavior applies (no extra instructions).

---

## Importing and Exporting Presets

You can share presets with others or back them up to your computer.

### Export a Preset

1. On the Presets page, find the preset you want to export.
2. Click the **export (download) icon**.
3. A `.json` file is saved to your computer.

### Import a Preset

1. On the Presets page, click **"Import"**.
2. Select a `.json` preset file from your computer.
3. The preset is added to your list.

The exported JSON looks like this:

```json
{
  "name": "Storyteller Mode",
  "cards": [
    {
      "name": "Narration Style",
      "role": "system",
      "content": "Always narrate actions and environment in vivid detail.",
      "order": 1,
      "enabled": true
    },
    {
      "name": "Dialogue Rule",
      "role": "system",
      "content": "Dialogue must be enclosed in quotation marks.",
      "order": 2,
      "enabled": true
    }
  ]
}
```

![Card editor dialog](../images/presets-card.png)

> **📸 Screenshot needed:** Open the card editor dialog with all fields filled in (Name, Role dropdown showing "system," Content with example text, Order field). Save as `docs/images/presets-card.png`.

---

## Template Entries for Common Use Cases

Here are some ready-to-use card templates you can copy into your presets.

### Vivid Storyteller

| Field | Value |
|---|---|
| Role | system |
| Content | Describe settings with rich sensory detail — sight, sound, smell, touch, and taste. Use literary language but keep dialogue natural and in-character. |

### Combat Rules

| Field | Value |
|---|---|
| Role | system |
| Content | Combat is turn-based. Describe attacks and their consequences vividly. The user's actions can succeed or fail based on the story context. Do not control the user's character or decide the outcome of their actions. |

### Minimalist / Fast-Paced

| Field | Value |
|---|---|
| Role | system |
| Content | Keep responses short and punchy. No flowery descriptions. Use quick dialogue and minimal narration. |

### No Godmodding (Fair Play)

| Field | Value |
|---|---|
| Role | system |
| Content | You control only your own character. Do not assume actions for the user's character, do not decide the outcome of their actions, and do not dictate their reactions or emotions. |

### Third-Person Narration

| Field | Value |
|---|---|
| Role | system |
| Content | Narrate everything in third person. Refer to your character by name or "they/he/she." |

---

## Next Steps

- Set up your [Persona](./persona.md) so the AI knows who it's talking to
- Explore [Settings](./settings.md) for more ways to fine-tune the AI
- Check out [Image Generation](./image-generation.md) to add visuals to your stories
