/**
 * Whale Builder — re-export barrel.
 * All logic lives under builder/ for maintainability.
 * See builder/agent.ts for the main loop, builder/tool-registry.ts for tool dispatch.
 */
export {
  runNeoCharacterBuilderTurn,
  buildNeoCharacterDraft,
  WhaleBuilderToolRegistry,
  builderToolRegistry,
  addUsage,
  parseToolArguments,
  normalizeDraft,
  normalizePersonalityPalette,
  normalizeCreationPlan,
  normalizeWorldbookEntries,
  normalizeMvuConfig,
  exportPackToFolder,
  REFERENCE_TEXTS,
} from "./builder";

export type {
  NeoCharacterBuilderOptions,
  NeoCharacterBuilderResult,
  NeoBuilderTurnOptions,
  NeoBuilderTurnResult,
  NeoBuilderConversationMessage,
  NeoBuilderToolEvent,
  NeoBuilderChoice,
  NeoBuilderQuestion,
  NeoBuilderWebSearchResult,
  NeoBuilderEvaluationReport,
  NeoCreationPlan,
  NeoCreationPlanEntry,
  NeoPersonalityPalette,
  NeoMvuConfig,
  ValidationResult,
  CharacterCardPack,
} from "./builder";
