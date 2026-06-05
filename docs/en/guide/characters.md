# Characters

Characters are the heart of Whale Play. Each character is a digital "personality" that the AI will roleplay as during chat. This guide covers everything you need to know about creating, editing, importing, and exporting characters.

---

## The Character List

When you open the Characters page, you'll see all your created characters in a list. Each entry shows the character's **name**, **avatar**, and a short **description**. From here you can click a character to start chatting, or use the action buttons to edit or delete them.

![Character list page](../images/characters-list.png)

> **📸 Screenshot needed:** Navigate to the Characters page (click the person icon 👤 in the left sidebar). Capture the full page showing 2–3 sample characters in the list, with their avatars, names, and descriptions visible. Include the "New Character" button. Save as `docs/images/characters-list.png`.

---

## Creating a Character

Click **"New Character"** to open the creation dialog. Fill in the fields below — the more detail you provide, the richer the AI's responses will be.

| Field | Required? | What it does | Example |
|---|---|---|---|
| **Name** | Yes | The character's name. The AI will refer to itself with this name. | Luna |
| **Description** | No | A short summary of who this character is. Helps the AI understand the character at a glance. | A mysterious forest spirit who guards an ancient library |
| **Personality** | No | Key traits that define how the character behaves. Write them as a comma-separated list. | wise, curious, gentle, playful, mischievous |
| **Scenario** | No | The setting or situation the character exists in. This sets the stage for the conversation. | You find yourself in a hidden forest clearing where an old stone library grows from the roots of a giant willow tree. |
| **First Message** | Yes | The very first message the character will send when you start a new chat. This sets the tone for the entire conversation. | *"Welcome, traveler. I've been expecting you. The books have whispered your name for days."* |
| **Example Dialogues** | No | Short sample conversations that show how the character talks. These help the AI match the character's speech style. Each example is a back-and-forth exchange. | `You: Who are you?` `Luna: I am the keeper of these woods. Every book here holds a memory — yours among them.` |

![Character edit dialog](../images/characters-edit.png)

> **📸 Screenshot needed:** Open the "New Character" dialog with all fields filled in (use the example data above). Capture the entire dialog form. Save as `docs/images/characters-edit.png`.

### Tips for Great Characters

- **First Message matters most.** The AI uses this to establish the character's tone, setting, and voice. Make it descriptive and in-character.
- **Personality traits** should be short and punchy. Think of them as tags: `brave, clumsy, dramatic`.
- **Scenario** works like stage directions — it tells the AI where the conversation takes place and what's happening.
- **Example dialogues** are powerful. Show 2–3 exchanges that demonstrate how the character reacts to different situations.

---

## Editing a Character

1. Go to the **Characters** page.
2. Find the character you want to edit.
3. Click the **edit (pencil) icon** next to their name.
4. The same creation dialog opens with all fields pre-filled.
5. Make your changes and click **"Save"**.

Changes take effect immediately — any new chat you start with this character will use the updated card. Existing chats are not affected.

---

## Deleting a Character

1. Go to the **Characters** page.
2. Find the character you want to delete.
3. Click the **delete (trash) icon**.
4. Confirm the deletion in the popup dialog.

> **⚠️ Warning:** Deleting a character also deletes all chats and savepoints associated with that character. This action cannot be undone.

---

## Importing Character Cards

Whale Play supports the **character card format** — a standard way to package character data for AI roleplay apps. You can import cards from `.json` or `.png` files.

### Supported File Formats

| Format | How it works |
|---|---|
| **.json** | A plain JSON file containing the character card data. This is the standard card export format. |
| **.png** | A PNG image file with the character card data **embedded** in the file's metadata. The image itself can serve as the character's avatar. These are often called "character card PNGs." |

### How to Import

1. Go to the **Characters** page.
2. Click the **"Import"** button (or the upload icon).
3. Select a `.json` or `.png` file from your computer.
4. The character is added to your list automatically.

If you import a `.png` with embedded card data, the image will be used as the character's avatar. If you import a `.json`, you can set an avatar separately.

### Where to Find Characters

Many character card creators share their cards online. Look for files ending in `.card.json` or character card `.png` images. Communities like [Character Hub](https://chub.ai) and various Discord servers host thousands of ready-made characters.

---

## Exporting Characters

You can export any character as a `.json` file to share with others, back up your work, or transfer between devices.

1. Go to the **Characters** page.
2. Find the character you want to export.
3. Click the **export (download) icon** next to their name.
4. A `.json` file is saved to your computer.

The exported file uses the standard character card format, so it can be imported into other compatible apps too.

---

## Character Card Structure

Here's what's inside a character card and how each field affects the AI's behavior:

```json
{
  "name": "Luna",
  "description": "A mysterious forest spirit who guards an ancient library",
  "personality": "wise, curious, gentle, playful",
  "scenario": "You find yourself in a hidden forest clearing...",
  "first_mes": "*Welcome, traveler.*",
  "mes_example": "You: Who are you?\nLuna: I am the keeper of these woods.",
  "avatar": "base64-encoded image data",
  "system_prompt": ""
}
```

| Field | How it affects the AI |
|---|---|
| `name` | The character's identity. The AI will refer to itself as this name. |
| `description` | Added to the AI's system prompt as a short summary of who the character is. |
| `personality` | Injected into the prompt as a list of traits. Guides the AI's behavioral style. |
| `scenario` | Describes the current situation. The AI uses this to understand the setting and context. |
| `first_mes` | The opening message. Sets tone, voice, and starting point for the conversation. |
| `mes_example` | Few-shot examples that show desired dialogue patterns and response style. |
| `avatar` | Optional image that displays as the character's icon. |
| `system_prompt` | Overrides the default system prompt for this character. Leave empty unless you know what you're doing. |

---

## Next Steps

- [Start a chat](./chat.md) with your new character
- Build a [World Book](./worldbook.md) to give your character a rich world to live in
- Check out [Presets](./presets.md) to customize how the AI talks
