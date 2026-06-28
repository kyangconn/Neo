import { chatPluginRegistry, type ChatPluginRegistry } from "./plugin-registry";
import type { ChatStrategy, TurnContext, TurnPhase, TurnResult } from "./types";

export interface RunChatTurnOptions<
  TModeState = unknown,
  TSideEffects extends Record<string, unknown> = Record<string, unknown>,
> {
  signal?: AbortSignal;
  pluginRegistry?: ChatPluginRegistry<TModeState, TSideEffects>;
  onPhaseChange?: (phase: TurnPhase) => void;
}

export async function runChatTurn<
  TModeState = unknown,
  TSideEffects extends Record<string, unknown> = Record<string, unknown>,
>(
  strategy: ChatStrategy<TModeState, TSideEffects>,
  ctx: TurnContext<TModeState>,
  options: RunChatTurnOptions<TModeState, TSideEffects> = {},
): Promise<TurnResult<TSideEffects>> {
  const registry = options.pluginRegistry ?? chatPluginRegistry;

  options.onPhaseChange?.("preparing");
  await registry.applyBeforePromptBuild(ctx);
  const strategyContextBlocks = strategy.buildExtraContextBlocks(ctx);
  const contextBlocks = registry.applyContextBlocks(strategyContextBlocks, ctx);
  const presetItems = strategy.resolvePresetItems(ctx);
  const nextCtx = { ...ctx, contextBlocks, presetItems };

  options.onPhaseChange?.("streaming");
  const pluginHooks = registry.composeHooks(nextCtx);
  const result = await strategy.generate(nextCtx, {
    ...pluginHooks,
    signal: options.signal,
  });

  options.onPhaseChange?.("postprocessing");
  await strategy.onTurnComplete(result, nextCtx);
  await registry.applyAfterTurn(result, nextCtx);
  options.onPhaseChange?.("idle");
  return result;
}
