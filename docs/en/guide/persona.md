# Persona

Your persona is **your identity** in the world of Whale Play. It tells the AI who you are, so characters can address and refer to you correctly.

---

## What Is a Persona?

When you chat with a character, the AI needs to know who it's talking to. That's where your persona comes in.

A persona has two parts:

| Field            | What it does                                                                                                           | Example                                                                                                       |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| **Display Name** | The name characters will call you. This replaces `{{user}}` in character cards and messages.                           | Alex                                                                                                          |
| **Description**  | A short description of who you are. The AI reads this to understand your character's role, appearance, and background. | A traveling scholar from the northern city of Frosthold. I wear round spectacles and carry a leather journal. |

Without a persona, the AI has no information about you beyond the messages you type. With a persona, characters can greet you by name, reference your background, and react to your described appearance.

![Persona settings page](../images/persona-page.png)

> **📸 Screenshot needed:** Navigate to the Persona settings page (click the user icon 👤 in the left sidebar). Capture the full page showing the Display Name field filled in (e.g., "Alex") and the Description field with sample text. Save as `docs/images/persona-page.png`.

---

## Setting Your Persona

1. In the **left sidebar**, click the **user icon** 👤 (Persona).
2. Fill in your **Display Name** — this is what characters will call you.
3. Fill in your **Description** — a brief summary of who you are.
4. Click **"Save"** (or it may save automatically).

That's it! Your persona is now active in all chats.

---

## How Persona Is Injected Into Prompts

When the AI prepares a response, your persona is added to the prompt as context. Here's how it works:

1. Anywhere `{{user}}` appears in a character card (e.g., in example dialogues or the first message), it gets replaced with your **Display Name**.
2. Your **Description** is added as a system-level note so the AI knows who you are.

### Example

Character's first message:

```
"Hello there, {{user}}! I've heard so much about your adventures."
```

With your persona set to `Alex`:

```
"Hello there, Alex! I've heard so much about your adventures."
```

The AI also reads your description behind the scenes:

```
The user's persona: A traveling scholar from the northern city of Frosthold. I wear round spectacles and carry a leather journal.
```

This means the AI can naturally reference your described traits — for instance, a character might ask about your journal or comment on your spectacles.

---

## Updating Your Persona

You can change your persona at any time. All future messages will use the updated name and description.

> **Note:** Existing chat messages won't be retroactively edited. Your old name stays in previous messages.

---

## Tips for Writing a Good Persona

- **Be specific.** Instead of "I'm an adventurer," try "I'm a treasure hunter from the port city of Tidewater, known for my lucky compass and quick wit."
- **Include a goal.** What are you trying to do? Characters can help or hinder you. "I'm searching for my lost brother who disappeared in the Whispering Woods."
- **Add a quirk.** A unique trait makes interactions more interesting. "I talk to my horse more than I talk to people."
- **Keep it concise.** 2–4 sentences is plenty. The AI has limited context space.

---

## Next Steps

- [Start a chat](./chat.md) and see how characters react to your persona
- Build a [World Book](./worldbook.md) to give the world more depth
- Create [Presets](./presets.md) to shape how the AI responds
