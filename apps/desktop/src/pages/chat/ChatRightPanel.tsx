import { useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  Brain,
  BrainCircuit,
  ChevronDown,
  ChevronUp,
  Dice5,
  HeartPulse,
  ShieldCheck,
  Skull,
  SmilePlus,
  Sparkles,
  Star,
  Trophy,
  Zap,
} from "lucide-react";
import { StatusMeter } from "@neo-tavern/ui";
import type { AgenticGameState, DiceRollResult } from "@/features/agentic-play/agentic-play";
import {
  resolveAgenticStatusMeters,
  type ResolvedAgenticStatusMeter,
} from "@/features/agentic-play/status-assets";

// ── Component ─────────────────────────────────────────

export interface ChatRightPanelProps {
  messagesCount: number;
  usageMessagesCount: number;
  totalPrompt: number;
  totalCompletion: number;
  cacheRate: string;
  contextUsageDisplay: string;
  contextUsagePercent: number;
  contextUsageBarTone: string;
  onTokenDialogOpen: () => void;
  agenticPlayEnabled?: boolean;
  agenticGameState?: AgenticGameState | null;
  isGeneratingCurrentChat?: boolean;
  lastDiceResult?: DiceRollResult | null;
}

// ── Dice Slot Machine ───────────────────────────────

const OUTCOME_ICONS: Record<string, { Icon: typeof Dice5; color: string; label: string }> = {
  critical_success: { Icon: Trophy, color: "text-amber-400", label: "大成功!" },
  critical_failure: { Icon: Skull, color: "text-red-500", label: "大失败!" },
  success: { Icon: ShieldCheck, color: "text-emerald-400", label: "成功" },
  failure: { Icon: Dice5, color: "text-red-400", label: "失败" },
  rolled: { Icon: Dice5, color: "text-primary", label: "掷出" },
};

function DiceFace({ value, sides, rolling }: { value: number; sides: number; rolling: boolean }) {
  const maxDigitCount = String(sides).length;
  return (
    <span
      className={`inline-flex h-10 w-10 items-center justify-center rounded-lg border-2 bg-card text-lg font-bold tabular-nums shadow-sm transition-all ${
        rolling
          ? "animate-[dice-spin_0.15s_ease-in-out_infinite] border-primary/50 text-primary/60"
          : value === 1
            ? "border-red-400 text-red-500"
            : value === sides
              ? "border-amber-400 text-amber-500"
              : "border-muted-foreground/30 text-foreground"
      }`}
      style={{ minWidth: `${Math.max(40, maxDigitCount * 14)}px` }}
    >
      {rolling ? "?" : value}
    </span>
  );
}

function DiceSlotMachine({ result, isGenerating }: { result: DiceRollResult; isGenerating: boolean }) {
  const { Icon: OutcomeIcon, color: outcomeColor, label: outcomeLabel } =
    OUTCOME_ICONS[result.outcome] ?? OUTCOME_ICONS.rolled;

  const parsed = result.dice.match(/^(\d+)d(\d+)$/);
  const count = parsed ? parseInt(parsed[1], 10) : 1;
  const sides = parsed ? parseInt(parsed[2], 10) : 20;

  return (
    <div className="space-y-3">
      {/* Dice reels */}
      <div className="flex items-center justify-center gap-2">
        {Array.from({ length: count }, (_, i) => (
          <DiceFace key={i} value={result.rolls[i] ?? 0} sides={sides} rolling={isGenerating && !result.rolls[i]} />
        ))}
      </div>

      {/* Total */}
      <div className="text-center">
        <div className="text-2xl font-bold tabular-nums tracking-tight">
          {result.roll}
          {result.modifier !== 0 && (
            <span className="text-base text-muted-foreground">
              {result.modifier > 0 ? "+" : ""}
              {result.modifier}
            </span>
          )}
          <span className="text-base text-muted-foreground"> = {result.total}</span>
        </div>
        {result.difficulty !== undefined && (
          <div className="mt-0.5 text-xs text-muted-foreground">
            DC {result.difficulty}
            {result.successProbability !== undefined && <span> · 成功率 {result.successProbability}%</span>}
          </div>
        )}
      </div>

      {/* Outcome */}
      <div className={`flex items-center justify-center gap-1.5 rounded-md bg-muted/50 px-3 py-1.5`}>
        <OutcomeIcon className={`h-4 w-4 ${outcomeColor}`} />
        <span className={`text-sm font-semibold ${outcomeColor}`}>{outcomeLabel}</span>
      </div>

      {/* Reason */}
      <p className="text-center text-xs leading-relaxed text-muted-foreground">{result.reason}</p>
    </div>
  );
}

const STATUS_ICONS: Record<ResolvedAgenticStatusMeter["icon"], typeof HeartPulse> = {
  heart: HeartPulse,
  sparkles: Sparkles,
  zap: Zap,
  smile: SmilePlus,
  star: Star,
  brain: BrainCircuit,
  alert: AlertTriangle,
};

function StatusAssetIcon({ name }: { name: ResolvedAgenticStatusMeter["icon"] }) {
  const Icon = STATUS_ICONS[name] ?? Sparkles;
  return <Icon className="h-3.5 w-3.5" />;
}

export function ChatRightPanel({
  messagesCount,
  usageMessagesCount,
  totalPrompt,
  totalCompletion,
  cacheRate,
  contextUsageDisplay,
  contextUsagePercent,
  contextUsageBarTone,
  onTokenDialogOpen,
  agenticPlayEnabled = false,
  agenticGameState,
  isGeneratingCurrentChat = false,
  lastDiceResult,
}: ChatRightPanelProps) {
  const hasUsage = usageMessagesCount > 0;
  const statusMeters = agenticPlayEnabled ? resolveAgenticStatusMeters(agenticGameState) : [];
  const [overviewCollapsed, setOverviewCollapsed] = useState(false);

  return (
    <aside className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-lg border bg-card">
      <div className="shrink-0 border-b p-4">
        <h2 className="font-semibold">会话状态</h2>
      </div>

      <div className="min-h-0 min-w-0 flex-1 overflow-y-auto p-4">
        <section className="rounded-lg border bg-background/45 p-3">
          <button
            type="button"
            className="flex w-full items-center justify-between gap-3 text-left"
            onClick={() => setOverviewCollapsed((value) => !value)}
            aria-expanded={!overviewCollapsed}
            title={overviewCollapsed ? "展开运行概览" : "收纳运行概览"}
          >
            <span className="flex min-w-0 items-center gap-2 text-sm font-semibold">
              <BarChart3 className="h-4 w-4 shrink-0" />
              <span className="truncate">运行概览</span>
            </span>
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
              {overviewCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
            </span>
          </button>

          {!overviewCollapsed && (
            <div className="mt-3 space-y-2">
              <div className="rounded-md border bg-card/60 p-3">
                <div className="text-xs text-muted-foreground">消息</div>
                <div className="mt-1 text-sm font-medium">{messagesCount} messages</div>
              </div>
              <button
                type="button"
                onClick={onTokenDialogOpen}
                className="w-full rounded-md border bg-card/60 p-3 text-left transition-colors hover:bg-accent"
              >
                <div className="flex items-center justify-between">
                  <div className="text-xs text-muted-foreground">Token 用量</div>
                  <span className="text-xs text-primary">查看详细 →</span>
                </div>
                <div className="mt-1 text-sm font-medium">
                  {hasUsage ? `P:${totalPrompt} C:${totalCompletion} | cache ${cacheRate}%` : "暂无统计"}
                </div>
                {hasUsage && (
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full rounded-full transition-[width] ${contextUsageBarTone}`}
                      style={{ width: `${contextUsagePercent}%` }}
                    />
                  </div>
                )}
              </button>
              {hasUsage && (
                <div className="rounded-md border bg-card/60 p-3">
                  <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                    <span>Context</span>
                    <span>{contextUsageDisplay}</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <span
                      className={`block h-full rounded-full transition-[width] ${contextUsageBarTone}`}
                      style={{ width: `${contextUsagePercent}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        {agenticPlayEnabled && (
          <section className="mt-5">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <Brain className="h-4 w-4" />
              场景状态
            </div>
            <div className="space-y-2">
              {statusMeters.length > 0 && (
                <div className="space-y-2">
                  <div className="px-1 text-xs font-semibold text-muted-foreground">动态变量</div>
                  {statusMeters.slice(0, 8).map((meter) => (
                    <StatusMeter
                      key={meter.id}
                      compact
                      label={meter.label}
                      value={meter.value}
                      max={meter.max}
                      min={meter.min}
                      tone={meter.tone}
                      icon={<StatusAssetIcon name={meter.icon} />}
                      description={meter.description}
                      valueLabel={meter.valueLabel}
                    />
                  ))}
                </div>
              )}
            </div>

            <section className="mt-5">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
                <Dice5 className="h-4 w-4" />
                判定
              </div>
              <div className="rounded-md border bg-background p-4">
                {lastDiceResult ? (
                  <DiceSlotMachine result={lastDiceResult} isGenerating={isGeneratingCurrentChat} />
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-md border bg-card">
                      <Dice5
                        className={`h-6 w-6 text-primary ${
                          isGeneratingCurrentChat ? "animate-spin" : "animate-pulse"
                        }`}
                      />
                      <span className="absolute inset-1 rounded-md border border-primary/20" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium">
                        {isGeneratingCurrentChat ? "判定进行中" : "等待行动判定"}
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                        {isGeneratingCurrentChat
                          ? "主持人正在判断风险、调用骰子或整理结果。"
                          : "玩家选择行动后，风险动作会触发骰子判定。"}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </section>
          </section>
        )}
      </div>
    </aside>
  );
}
