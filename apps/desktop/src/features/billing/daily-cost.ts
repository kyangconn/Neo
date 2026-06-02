import { settingsRepository } from "@/db/repositories";

export const DEFAULT_DAILY_COST_WARNING_LIMIT_CNY = 5;
export const DAILY_COST_WARNING_RATIO = 0.8;

const DAILY_COST_WARNING_ENABLED_KEY = "dailyCostWarningEnabled";
const DAILY_COST_WARNING_LIMIT_KEY = "dailyCostWarningLimitCny";

export interface DailyCostWarningSettings {
  enabled: boolean;
  limitCny: number;
}

function parseCost(value: string | null | undefined, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : fallback;
}

export function getLocalCostDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getDailyCostSpendKey(dateKey = getLocalCostDateKey()) {
  return `dailyCostSpend:${dateKey}`;
}

function getDailyCostWarnedKey(dateKey = getLocalCostDateKey()) {
  return `dailyCostWarningNotified:${dateKey}`;
}

export async function loadDailyCostWarningSettings(): Promise<DailyCostWarningSettings> {
  const [enabledRaw, limitRaw] = await Promise.all([
    settingsRepository.get(DAILY_COST_WARNING_ENABLED_KEY),
    settingsRepository.get(DAILY_COST_WARNING_LIMIT_KEY),
  ]);
  return {
    enabled: enabledRaw === "1",
    limitCny: parseCost(limitRaw, DEFAULT_DAILY_COST_WARNING_LIMIT_CNY) || DEFAULT_DAILY_COST_WARNING_LIMIT_CNY,
  };
}

export async function saveDailyCostWarningEnabled(enabled: boolean) {
  await settingsRepository.set(DAILY_COST_WARNING_ENABLED_KEY, enabled ? "1" : "0");
}

export async function saveDailyCostWarningLimitCny(limitCny: number) {
  const next = Number.isFinite(limitCny)
    ? Math.max(0.01, Math.round(limitCny * 100) / 100)
    : DEFAULT_DAILY_COST_WARNING_LIMIT_CNY;
  await settingsRepository.set(DAILY_COST_WARNING_LIMIT_KEY, String(next));
  return next;
}

export async function loadTodayCostCny(date = new Date()) {
  return parseCost(await settingsRepository.get(getDailyCostSpendKey(getLocalCostDateKey(date))));
}

export async function addDailyCostCny(costCny: number, date = new Date()) {
  if (!Number.isFinite(costCny) || costCny <= 0) {
    return { previousCny: 0, totalCny: 0, shouldWarn: false, limitCny: 0 };
  }

  const dateKey = getLocalCostDateKey(date);
  const spendKey = getDailyCostSpendKey(dateKey);
  const previousCny = parseCost(await settingsRepository.get(spendKey));
  const totalCny = previousCny + costCny;
  await settingsRepository.set(spendKey, String(totalCny));

  const settings = await loadDailyCostWarningSettings();
  if (!settings.enabled || settings.limitCny <= 0) {
    return { previousCny, totalCny, shouldWarn: false, limitCny: settings.limitCny };
  }

  const warningAt = settings.limitCny * DAILY_COST_WARNING_RATIO;
  const warnedKey = getDailyCostWarnedKey(dateKey);
  const alreadyWarned = await settingsRepository.get(warnedKey);
  const shouldWarn = !alreadyWarned && previousCny < warningAt && totalCny >= warningAt;
  if (shouldWarn) {
    await settingsRepository.set(warnedKey, "1");
  }
  return { previousCny, totalCny, shouldWarn, limitCny: settings.limitCny };
}
