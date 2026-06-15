/**
 * BuilderSessionStore — Module-level store for NeoBuilder messages and
 * background generation state.
 *
 * Keyed by builderSessionId. Each session tracks its messages and running
 * generation independently, enabling parallel sessions.
 *
 * Generation is keyed by sessionId and owned by the app-level task runner, so
 * route changes do not cancel an in-flight builder turn.
 */

import { useSyncExternalStore, useCallback } from "react";
import { generationTaskRunner } from "@/app/generation-task-runner";
import { generateId } from "@neo-tavern/shared";
import { useSettingsStore } from "@/features/settings/settings.store";
import { runNeoCharacterBuilderTurn } from "@/features/character/neo-character-builder";
import { searchWeb } from "@/features/character/web-search";
import {
  toConversation,
  shouldRunBuilderTurnInBackground,
  getBackgroundResultContent,
  upsertToolEvent,
} from "@/pages/neo-builder/utils";

import type { BuilderMessage, WorldbookDraft } from "@/pages/neo-builder/types";
import type { NeoBuilderTurnResult, NeoBuilderToolEvent } from "@/features/character/neo-character-builder";
import type { CreateCharacterInput } from "@neo-tavern/shared";

// ── Store ──

interface SessionState {
  sessionId: string;
  messages: BuilderMessage[];
  running: boolean;
  error: string | null;
  lastResult: NeoBuilderTurnResult | null;
  resultVersion: number;
  controller: AbortController | null;
  snapshot: Snapshot;
}

type Snapshot = Pick<SessionState, "sessionId" | "messages" | "running" | "error" | "lastResult" | "resultVersion">;

function builderTaskKey(sessionId: string) {
  return `builder:${sessionId}`;
}

class BuilderSessionStore {
  private sessions = new Map<string, SessionState>();
  private listeners = new Set<() => void>();
  private snapshots = new Map<string, Snapshot>(); // cached for reference stability

  private getOrCreate(sessionId: string): SessionState {
    let session = this.sessions.get(sessionId);
    if (!session) {
      const snapshot: Snapshot = {
        sessionId,
        messages: [],
        running: false,
        error: null,
        lastResult: null,
        resultVersion: 0,
      };
      session = { ...snapshot, controller: null, snapshot };
      this.sessions.set(sessionId, session);
    }
    return session;
  }

  private refreshSnapshot(session: SessionState): void {
    session.snapshot = {
      sessionId: session.sessionId,
      messages: session.messages,
      running: session.running,
      error: session.error,
      lastResult: session.lastResult,
      resultVersion: session.resultVersion,
    };
  }

  private commit(session: SessionState): void {
    this.refreshSnapshot(session);
    this.notify();
  }

  restore(sessionId: string, messages: BuilderMessage[], lastResult: NeoBuilderTurnResult | null = null): void {
    const s = this.getOrCreate(sessionId);
    if (s.running) return;
    s.messages = messages;
    s.running = false; // never restore running=true — stale
    s.error = null;
    s.lastResult = lastResult;
    s.resultVersion = 0;
    s.controller = null;
    this.commit(s);
  }

  getSnapshot(sessionId: string): Snapshot {
    const s = this.getOrCreate(sessionId);
    const prev = this.snapshots.get(sessionId);
    // Return cached reference when nothing changed (useSyncExternalStore uses Object.is)
    if (
      prev &&
      prev.messages === s.messages &&
      prev.running === s.running &&
      prev.error === s.error &&
      prev.lastResult === s.lastResult &&
      prev.resultVersion === s.resultVersion
    ) {
      return prev;
    }
    const next: Snapshot = {
      sessionId: s.sessionId,
      messages: s.messages,
      running: s.running,
      error: s.error,
      lastResult: s.lastResult,
      resultVersion: s.resultVersion,
    };
    this.snapshots.set(sessionId, next);
    return next;
  }

  setMessages(sessionId: string, messages: BuilderMessage[]): void {
    const s = this.getOrCreate(sessionId);
    s.messages = messages;
    this.commit(s);
  }

  abort(sessionId: string): void {
    const s = this.getOrCreate(sessionId);
    generationTaskRunner.abort(builderTaskKey(sessionId));
    s.controller = null;
    s.running = false;
    s.messages = s.messages.map((message) =>
      message.pending
        ? {
            ...message,
            content: message.content || "生成已停止。",
            backgroundCreation: false,
            pending: false,
            completedAt: Date.now(),
          }
        : message,
    );
    this.commit(s);
  }

  // ── Send message (survives unmount, returns result for component to sync) ──

  async sendMessage(
    sessionId: string,
    content: string,
    webSearchEnabled: boolean,
    workspace: {
      draft: CreateCharacterInput | null;
      worldbookDraft: WorldbookDraft | null;
      creationPlan: unknown;
      personalityPalette: unknown;
      mvu: unknown;
      statusBars: unknown;
    },
  ): Promise<NeoBuilderTurnResult | null> {
    const s = this.getOrCreate(sessionId);
    const clean = content.trim();
    if (!clean || s.running) return null;

    const config = useSettingsStore.getState().modelConfig;
    if (!config) {
      s.error = "请先配置 API";
      this.commit(s);
      return null;
    }

    return generationTaskRunner.startExclusive(builderTaskKey(sessionId), async ({ controller, signal, isCurrent }) => {
      const session = this.getOrCreate(sessionId);
      const assistantId = generateId();
      const backgroundCreation = shouldRunBuilderTurnInBackground(
        clean,
        workspace.creationPlan as never,
        workspace.draft,
        false,
      );
      const userMessage: BuilderMessage = { id: generateId(), role: "user", content: clean, hidden: false };
      const assistantMessage: BuilderMessage = {
        id: assistantId,
        role: "assistant",
        content: "",
        pending: true,
        backgroundCreation,
        startedAt: Date.now(),
      };

      session.messages = [...session.messages, userMessage, assistantMessage];
      session.running = true;
      session.error = null;
      session.controller = controller;
      this.commit(session);

      const isLiveTurn = () => isCurrent() && !signal.aborted;

      try {
        const result = await runNeoCharacterBuilderTurn({
          conversation: toConversation(session.messages.filter((m) => m.id !== assistantMessage.id)),
          existingCharacter: null,
          currentDraft: workspace.draft,
          currentWorldbookEntries: workspace.worldbookDraft?.entries ?? [],
          creationPlan: workspace.creationPlan as never,
          personalityPalette: workspace.personalityPalette as never,
          currentMvu: workspace.mvu as never,
          currentStatusBars: workspace.statusBars as never,
          modelConfig: config,
          scopeId: sessionId,
          webSearchEnabled,
          searchWeb,
          onContentDelta: (delta) => {
            if (!isLiveTurn() || backgroundCreation) return;
            session.messages = session.messages.map((m) =>
              m.id === assistantId ? { ...m, content: `${m.content}${delta}` } : m,
            );
            this.commit(session);
          },
          onReasoningDelta: (delta) => {
            if (!isLiveTurn()) return;
            session.messages = session.messages.map((m) =>
              m.id === assistantId ? { ...m, reasoningContent: `${m.reasoningContent ?? ""}${delta}` } : m,
            );
            this.commit(session);
          },
          onToolEvent: (event: NeoBuilderToolEvent) => {
            if (!isLiveTurn()) return;
            session.messages = session.messages.map((m) =>
              m.id === assistantId ? { ...m, toolEvents: upsertToolEvent(m.toolEvents, event) } : m,
            );
            this.commit(session);
          },
          signal,
        });

        if (!isLiveTurn()) return null;

        const keepBackgroundCreation = backgroundCreation && !result.choices?.length && !result.questions?.length;
        session.messages = session.messages.map((m) =>
          m.id === assistantId
            ? {
                ...m,
                content: keepBackgroundCreation ? getBackgroundResultContent(result) : result.content,
                choices: result.choices,
                questions: result.questions,
                backgroundCreation: keepBackgroundCreation,
                reasoningContent: result.reasoningContent,
                toolEvents: result.toolEvents,
                usage: result.usage,
                pending: false,
                completedAt: Date.now(),
              }
            : m,
        );
        session.lastResult = result;
        session.resultVersion += 1;
        return result;
      } catch (err) {
        if (signal.aborted) {
          if (isCurrent()) {
            session.messages = session.messages.map((m) =>
              m.id === assistantId
                ? {
                    ...m,
                    content: m.content || "生成已停止。",
                    backgroundCreation: false,
                    pending: false,
                    completedAt: Date.now(),
                  }
                : m,
            );
          }
          return null;
        }
        if (!isCurrent()) return null;
        const msg = (err as Error).message || "Generation failed";
        session.error = msg;
        session.messages = session.messages.map((m) =>
          m.id === assistantId
            ? { ...m, content: msg, backgroundCreation: false, pending: false, completedAt: Date.now() }
            : m,
        );
        return null;
      } finally {
        if (isCurrent()) {
          session.running = false;
          if (session.controller === controller) session.controller = null;
          this.commit(session);
        }
      }
    });
  }

  // ── React ──

  subscribe(callback: () => void): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notify(): void {
    for (const cb of this.listeners) cb();
  }
}

export const builderSessions = new BuilderSessionStore();

export function useBuilderSession(sessionId: string) {
  const subscribe = useCallback((cb: () => void) => builderSessions.subscribe(cb), []);
  const getSnapshot = useCallback(() => builderSessions.getSnapshot(sessionId), [sessionId]);
  return useSyncExternalStore(subscribe, getSnapshot);
}
