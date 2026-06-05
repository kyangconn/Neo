# World Book

A World Book is a collection of lore, facts, and background information that the AI can draw on during chats. Think of it as a **wiki for your character's world** — the AI will read relevant entries and use them to make responses more consistent and immersive.

---

## What Is a World Book?

Have you ever been in a great roleplay, only for the AI to forget an important detail about the setting? That's where a World Book helps.

A World Book is a **database of entries**. Each entry contains a piece of information — a place, a character, an event, an object, or a rule. When you chat, Whale Play checks your message against the World Book. If something you say matches an entry, the AI reads that entry before responding.

For example:

| Entry              | Content                                                                                        |
| ------------------ | ---------------------------------------------------------------------------------------------- |
| The Moonstone      | A magical blue gem that glows when lies are told nearby. Hidden in the Well of Echoes.         |
| Captain Orin       | Grizzled old sailor with a mechanical leg. Knows the secret passages through the Coral Strait. |
| The Law of Silence | In the city of Veridia, speaking after midnight is forbidden by ancient decree.                |

If you mention "Moonstone" or "the glowing blue gem" in a chat, the AI will know exactly what you're talking about — even if you talked about it hours ago.

---

## Creating a World Book

1. In the **left sidebar**, click the **book icon** 📖 (World Books).
2. Click **"New World Book"**.
3. Give it a **name** (e.g., "The Kingdom of Veridia").
4. Optionally, add a short **description** of what this world book covers.

![World book editor](../../images/worldbook-editor.png)

> **📸 Screenshot needed:** Open the World Books page showing a list of 1–2 world books, with the "New World Book" button visible. Save as `docs/images/worldbook-editor.png`.

---

## Adding Entries

Once you have a world book, you can fill it with entries. Each entry is one piece of information.

1. Open a world book from the list.
2. Click **"Add Entry"**.
3. Fill in the entry fields:

| Field            | Required? | What it does                                                                                                                                     | Example                                                                                                                              |
| ---------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| **Title**        | Yes       | A short name for this entry. Used for display purposes.                                                                                          | The Moonstone                                                                                                                        |
| **Keywords**     | Yes       | Words or phrases that trigger this entry. When any of these appear in the chat, the entry gets injected. Separate multiple keywords with commas. | moonstone, blue gem, glowing gem, lies                                                                                               |
| **Content**      | Yes       | The actual lore text. This is what the AI will read.                                                                                             | A magical blue gem that glows when lies are told nearby. It was hidden centuries ago in the Well of Echoes beneath the royal palace. |
| **Priority**     | No        | A number (0–100). Higher priority entries are injected first if multiple entries are triggered. Defaults to 0.                                   | 10                                                                                                                                   |
| **Trigger Mode** | Yes       | How this entry gets used — see below.                                                                                                            | Trigger                                                                                                                              |

### Entry Types: Always vs. Trigger

This is the most important setting for each entry.

| Type        | Icon | Behavior                                                                                                                                                   |
| ----------- | ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Always**  | 📌   | The entry is **always** included in every chat prompt, regardless of what's being said. Use this for essential world info that the AI should never forget. |
| **Trigger** | 🔍   | The entry is only included when one of its **keywords** appears in the recent conversation. Use this for situational details that aren't always relevant.  |

**When to use Always:**

- The core premise of the world (e.g., "Magic requires a blood price.")
- Rules that affect all conversations (e.g., "Characters cannot lie.")
- Key locations the user is currently in.

**When to use Trigger:**

- Specific NPCs that might or might not appear.
- Lore about distant locations.
- Historical events and backstory.
- Item descriptions.

---

## How Entries Are Injected Into Prompts

When the AI prepares a response, it builds a prompt from several parts. World Book entries are inserted based on their **position** setting.

| Position           | Where it goes                                                                                         | Best for                                                                      |
| ------------------ | ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| **Before History** | Added before the chat history (conversation so far). The AI sees this as "background context."        | World rules, setting descriptions, character motivations.                     |
| **After History**  | Added after the chat history, just before the AI's response. The AI sees this as "immediate context." | Recent events, specific items the user just asked about, time-sensitive info. |

In practice, **Before History** is the default and works well for most entries. Use **After History** only when you need the information to feel fresh and immediate.

---

## Activating and Deactivating World Books

You can have multiple world books, but only **active** ones get checked during a chat.

- **Toggle on/off:** Use the switch next to each world book's name in the list.
- **Active:** The world book's entries are checked against every message.
- **Inactive:** The world book is stored but ignored during chats.

![Entry edit panel](../../images/worldbook-entry.png)

> **📸 Screenshot needed:** Open an entry's edit panel showing all fields filled in (Title, Keywords, Content, Priority, Trigger Mode selector, and Position selector). Save as `docs/images/worldbook-entry.png`.

### Tips for World Books

- **Start small.** A world book with 5–10 well-written entries is more effective than one with 50 scattered notes.
- **Keywords are everything.** Think about what words a user would naturally say to reference this info. Include synonyms and variations.
- **Keep content concise.** Entries should be 2–5 sentences. The AI has limited context space.
- **Use priority wisely.** A priority of 100 means this entry almost always appears when triggered. Save it for critical lore.
- **Don't duplicate.** If two entries could trigger on the same keyword, the AI might get confused.

---

## Next Steps

- Learn how to [configure presets](./presets.md) for different chat styles
- Set up your [persona](./persona.md) to give the AI context about who you are
- Check [Settings](./settings.md) to adjust context token limits for larger world books
