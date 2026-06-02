import type { Plug, Sun } from "lucide-react";

export type Section = "general" | "api" | "appearance" | "regex" | "context" | "image";

export type SectionWithLabel = { key: Section; icon: typeof Plug; label: string };

export type ThemeOption = {
  value: "light" | "dark" | "sepia" | "system";
  icon: typeof Sun;
  label: string;
};

// ── Shared constants ───────────────────────────────────
export const DEEPSEEK_BASE_URL = "https://api.deepseek.com";
export const DEFAULT_DEEPSEEK_MODEL = "deepseek-v4-flash";
export const DEFAULT_DEEPSEEK_CONFIG_NAME = "DeepSeek V4 Flash";
export const DEEPSEEK_LEGACY_MODELS = ["deepseek-chat", "deepseek-reasoner"];

export const DEEPSEEK_MODEL_OPTIONS = [
  {
    id: "deepseek-v4-flash",
    label: "DeepSeek V4 Flash",
    badge: "Recommended",
    description: "Best first choice for daily chat and roleplay. Lower cost.",
  },
  {
    id: "deepseek-v4-pro",
    label: "DeepSeek V4 Pro",
    badge: "Pro",
    description: "Use for deeper reasoning and complex writing. Higher cost.",
  },
] as const;

// ── Section component props ────────────────────────────

export interface SettingsSectionProps {
  t: (key: string, params?: Record<string, string>) => string;
}

export interface ImageSectionProps extends SettingsSectionProps {}

export interface ApiSectionProps extends SettingsSectionProps {
  modelConfigs: Array<{ id: string; name: string; model: string }>;
}

export interface RegexSectionProps extends SettingsSectionProps {}
