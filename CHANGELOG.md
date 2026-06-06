# Changelog

All notable changes to Whale Play are documented here.

## 2026-06-06

### Added

- Added a structured Agentic Play option flow where the model must present exactly five actions through the option panel instead of writing choices into normal narration.
- Added local dice resolution for Agentic Play option selection, including success probability, 1d20 DC, hidden player action payloads, and dice results passed back to the model.
- Added Agentic Play continuity guards so NPC dialogue must be visible before later narration can reference it as prior speech.
- Added structured dialogue JSON rendering for player and NPC speech blocks.
- Added Agentic Play status bar support for RPG and relationship variables such as health, mana, affection, experience, sanity, stamina, and danger progress.
- Added a local status UI asset library and Whale Builder MVU references so generated character cards can ship status bar definitions that Agentic Play can load.
- Added Whale Builder packaging support for status bar outputs and validation around generated status metadata.
- Added collapsible chat side panels and a compact runtime overview in the Agentic Play chat layout.
- Added desktop window controls and drag support for the custom Tauri title bar.

### Changed

- Reworked Agentic Play prompts into stricter host rules for choice breakpoints, dice handling, state updates, and visible-history continuity.
- Reworked Agentic Play state persistence so current character defaults and status bars are normalized when a chat state is loaded.
- Reworked chat rendering so hidden Agentic Play choice messages stay out of the visible transcript while still being sent to the model.
- Reworked the chat input area to hide while structured choices are pending and to adapt better when side panels are collapsed.
- Reworked the right-side Agentic Play panel to prioritize dynamic variables and dice judgement details.
- Reworked Whale Builder skill references to focus MVU output on reusable status bar variables instead of unused legacy sections.
- Reworked character saving so existing library entries can be updated instead of creating duplicate saves.
- Updated Whale Builder copy and attribution for the built-in Tavern Cards SillyTavern character card and worldbook writing skill.

### Fixed

- Fixed cases where Agentic Play could fail to surface options by forcing a repair pass when a turn reaches a player-choice breakpoint without a valid option tool call.
- Fixed inline option leakage in Agentic Play responses by removing the old prose option parser and relying on structured option tool results.
- Fixed Agentic Play continuity drift where internal model reasoning or unselected option descriptions could be treated as established history.
- Fixed message counting and first-message handling so hidden Agentic Play actions do not affect the visible chat transcript.
- Fixed duplicate Whale Builder save behavior by updating an existing character card when it already exists in the library.
- Fixed custom title bar minimize, maximize, close, and drag behavior in the desktop shell.

### Tests

- Added and updated tests for Agentic Play dice, required option repair, status bars, continuity prompt rules, structured dialogue parsing, and Whale Builder status references.
