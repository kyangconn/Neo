import { describe, expect, it } from "vitest";
import { builderSessions } from "./builder-session.store";
import type { BuilderMessage } from "@/pages/neo-builder/types";
import type { NeoBuilderTurnResult } from "@/features/character/neo-character-builder";

function makeMessage(id: string): BuilderMessage {
  return {
    id,
    role: "assistant",
    content: `message ${id}`,
  };
}

describe("BuilderSessionStore snapshots", () => {
  it("returns a stable snapshot reference until the session changes", () => {
    const sessionId = `snapshot-stability-${Date.now()}`;

    const first = builderSessions.getSnapshot(sessionId);
    const second = builderSessions.getSnapshot(sessionId);

    expect(second).toBe(first);

    builderSessions.setMessages(sessionId, [makeMessage("one")]);
    const afterSet = builderSessions.getSnapshot(sessionId);

    expect(afterSet).not.toBe(first);
    expect(builderSessions.getSnapshot(sessionId)).toBe(afterSet);
  });

  it("keeps restored lastResult in the subscribed snapshot", () => {
    const sessionId = `snapshot-result-${Date.now()}`;
    const result = { content: "done" } as unknown as NeoBuilderTurnResult;

    builderSessions.restore(sessionId, [makeMessage("restored")], result);
    const snapshot = builderSessions.getSnapshot(sessionId);

    expect(snapshot.lastResult).toBe(result);
    expect(snapshot.resultVersion).toBe(0);
  });
});
