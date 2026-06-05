# Whale Builder

## What is Whale Builder?

Whale Builder is a **chat-driven character creation assistant** built into Whale Play. Instead of filling out forms or editing JSON, you describe your character idea in natural language, and the builder walks you through a structured workflow to produce a complete, ready-to-use character card.

The builder is powered by a **Skill system** — specialized AI personas that know exactly how to craft characters, write worldbook lore, and assemble final character cards. Every step is guided, transparent, and collaborative.

**What you get at the end:**
- A fully formatted **character card** (persona, traits, skills, backstory)
- A **personality palette** (emotional range and behavioral traits)
- **Worldbook entries** (lore, locations, NPCs, items tied to your character)
- A **creation plan** (the structured blueprint the builder followed)
- An **evaluation report** (quality check with improvement suggestions)

![Whale Builder chat interface](../images/builder-chat.png)

---

## Getting Started

You can start the builder from two places:

1. **Characters page** — Click the **"Whale Builder"** button.
2. **Direct URL** — Navigate to `/character-builder`.

Once launched, simply describe your character idea. For example:

> *"I want a rogue archaeologist who explores ancient ruins, uses a whip, and has a rival professor who's always one step ahead."*

The builder will take it from there.

---

## The Creation Flow

The builder follows a structured 6-step workflow. Each step builds on the last.

### 1. Gather Direction

Tell the builder your character concept. Be as detailed or as loose as you like. The builder will ask clarifying questions to flesh out the idea — things like setting, personality, goals, and key relationships.

The builder may call `ask_user_options` to present you with 2–5 structured questions at once, so you can answer multiple choices in one go.

### 2. Align on Plan

Once the builder understands your vision, it proposes a **creation plan** — a structured YAML document that outlines:

- Character archetype and role
- Key traits and skills to generate
- Worldbook entries needed (locations, factions, items)
- Narrative hooks and backstory beats

You can review the plan, suggest changes, or approve it to move forward.

**Example artifact — `creation-plan.yaml`:**

```yaml
character:
  name: Elara Vex
  archetype: Rogue Archaeologist
  traits: [Curious, Cunning, Lonely]
  skills: { archaeology: 4, stealth: 3, melee: 2 }
worldbook:
  - "Sunken Temple of Osha"
  - "The Professor's Journal"
  - "Order of the Bronze Key"
narrative_hooks:
  - "A rival has found the temple first"
  - "The artifact is cursed"
```

### 3. Search References (Optional)

If you enable **web search**, the builder can look up real-world references for authenticity — historical artifacts, real locations, mythology, or period-accurate details.

Toggle this on when you need grounded, factual worldbuilding. The builder uses the `web_search` tool to find relevant information.

### 4. Generate Entries

The builder creates **worldbook entries** one by one. These are the lore building blocks your character lives in:

- Locations (temples, cities, ruins)
- Factions and organizations
- Key NPCs (allies, rivals, mentors)
- Items and artifacts
- Historical events

Each entry is generated with the context of previous entries, so the world stays cohesive.

### 5. Generate Character Card

With the world built, the builder assembles the **final character card** — a complete persona ready for Whale Play. This includes:

- Name, appearance, and personality
- Traits and skill ratings
- Backstory and motivations
- Inventory and starting equipment
- Relationship map with worldbook entries

The builder uses `validate_character_draft` to check the card for completeness and consistency before presenting it to you.

### 6. Save to Whale Play

Once you're satisfied, the builder calls `save_character_draft` to persist the character. This is the **only** action that makes your character available in Whale Play.

After saving, you can open a chat with your new character immediately.

![Artifacts panel](../images/builder-artifacts.png)

---

## Artifacts

As the builder works through the flow, it produces several artifacts. These are displayed in the right panel so you can inspect each one at any time.

### `creation-plan.yaml`

The structured blueprint that guides generation. You can review and modify it before entries are created.

### Personality Palette

A visual representation of your character's emotional range and behavioral traits. Shows how the character reacts under stress, in social situations, and when pursuing their goals.

### Character Card

The final output — a complete character persona ready for Whale Play. Includes traits, skills, backstory, inventory, and relationships.

### World Book

Generated lore entries that give your character's world depth. Each entry is a self-contained snippet that the chat system can inject into conversations for richer roleplay.

### Evaluation Report

A quality-assessment report generated after the character card is created. It checks:

- **Completeness** — Are all required fields filled?
- **Consistency** — Do traits, skills, and backstory align?
- **Expressiveness** — Does the character have enough personality depth?
- **Suggestions** — Specific improvements the builder recommends

You can request a re-evaluation after making changes to see if the score improved.

---

## Tips

- **Be specific about your character concept** — The more detail you give upfront, the fewer rounds of clarification the builder needs.
- **Enable web search** if you need real-world references for historical settings, artifacts, or mythology.
- **Review the creation plan carefully** — It's the blueprint for everything that follows. Changes are cheap at this stage.
- **Use "Evaluate Draft"** to get improvement suggestions before finalizing. The evaluation report highlights gaps you might have missed.
- **Each worldbook entry is generated in context** — Early entries influence later ones, so review them as they're created.
- **You can iterate** — If the result isn't right, describe what you'd like to change and the builder can regenerate specific parts.

---

## Under the Hood

The builder uses a **Skill-based architecture**. When you start a session, the system injects a Skill instruction into the AI's system prompt that defines:

1. The complete workflow (the 6 steps above)
2. Data formats (YAML plan structure, character card schema, worldbook entry format)
3. Writing rules (tone, depth, consistency guidelines)
4. Tool usage (when to search, when to ask questions, when to save)

Skill reference files live at `apps/desktop/src/features/character/neo-builder-skill-references/` and are loaded on demand via the `read_skill_reference` and `list_skill_references` tools.

This design means the builder's behavior can be updated by editing Skill files rather than modifying code — making it flexible and easy to improve over time.
