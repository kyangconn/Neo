import type { Preset, PresetItem } from "@neo-tavern/shared";
import { presetRepository } from "@/db/repositories/preset.repository";
import { buildAgenticPlayPresetItems, type AgenticPresetItem } from "./agentic-play";

export const AGENTIC_PLAY_PRESET_ID = "whaleplay-agentic-play-preset";
export const AGENTIC_PLAY_CHARACTER_PLACEHOLDER = "{{char}}";
export const AGENTIC_PLAY_PRESET_NAME = "Agentic Play";
export const AGENTIC_PLAY_PRESET_DESCRIPTION =
  "Agentic Play 实验模式专用提示词。实验模式会自动读取此预设；无需把它设为普通聊天激活预设。";

function createAgenticPlayPreset(): Preset {
  const now = new Date().toISOString();
  const defaultItems = buildAgenticPlayPresetItems(AGENTIC_PLAY_CHARACTER_PLACEHOLDER);
  return {
    id: AGENTIC_PLAY_PRESET_ID,
    name: AGENTIC_PLAY_PRESET_NAME,
    description: AGENTIC_PLAY_PRESET_DESCRIPTION,
    items: defaultItems.map(
      (item, index): PresetItem => ({
        id: `${AGENTIC_PLAY_PRESET_ID}-${index}`,
        presetId: AGENTIC_PLAY_PRESET_ID,
        name: item.name ?? `Agentic 模块 ${index + 1}`,
        enabled: true,
        role: item.role,
        content: item.content,
        injectionOrder: item.injectionOrder,
        createdAt: now,
        updatedAt: now,
      }),
    ),
    createdAt: now,
    updatedAt: now,
  };
}

function isGranularAgenticPreset(preset: Preset) {
  return preset.items.some((item) => item.content.includes('<agentic_module name="core_identity">'));
}

function isLegacyAgenticPreset(preset: Preset) {
  return preset.items.some((item) => item.content.includes('<agentic_module name="core_rules">'));
}

async function saveAgenticPlayPreset(preset: Preset) {
  const all = await presetRepository.list();
  const next = all.some((item) => item.id === AGENTIC_PLAY_PRESET_ID)
    ? all.map((item) => (item.id === AGENTIC_PLAY_PRESET_ID ? preset : item))
    : [...all, preset];
  await presetRepository.save(next);
}

function migrateLegacyAgenticPlayPreset(existing: Preset): Preset {
  const now = new Date().toISOString();
  const next = createAgenticPlayPreset();
  const legacyBackups = existing.items.map(
    (item, index): PresetItem => ({
      ...item,
      id: `${AGENTIC_PLAY_PRESET_ID}-legacy-${item.id}`,
      presetId: AGENTIC_PLAY_PRESET_ID,
      name: `旧版备份：${item.name}`,
      enabled: false,
      injectionOrder: 9000 + index * 10,
      updatedAt: now,
    }),
  );

  return {
    ...existing,
    name: existing.name || next.name,
    description: existing.description || next.description,
    items: [...next.items, ...legacyBackups],
    updatedAt: now,
  };
}

export async function ensureAgenticPlayPreset(): Promise<Preset> {
  const existing = await presetRepository.getById(AGENTIC_PLAY_PRESET_ID);
  if (existing) {
    if (isGranularAgenticPreset(existing) || !isLegacyAgenticPreset(existing)) return existing;
    const migrated = migrateLegacyAgenticPlayPreset(existing);
    await saveAgenticPlayPreset(migrated);
    return migrated;
  }

  const preset = createAgenticPlayPreset();
  await saveAgenticPlayPreset(preset);
  return preset;
}

export async function getAgenticPlayPresetItems(): Promise<AgenticPresetItem[]> {
  const preset = await ensureAgenticPlayPreset();
  return preset.items
    .filter((item) => item.enabled)
    .map((item) => ({
      role: item.role,
      content: item.content,
      injectionOrder: item.injectionOrder,
    }));
}
