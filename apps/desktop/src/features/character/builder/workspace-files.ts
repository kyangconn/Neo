/**
 * Disk-backed workspace persistence for worldbook entries.
 * Mirrors the original tavern-cards project directory layout.
 */
import type { CreateWorldbookEntryInput } from "@neo-tavern/shared";

let invokeTauri: typeof import("@tauri-apps/api/core").invoke | null = null;

async function getInvoke() {
  if (!invokeTauri) {
    const mod = await import("@tauri-apps/api/core");
    invokeTauri = mod.invoke;
  }
  return invokeTauri;
}

/**
 * Write workspace entries to disk under worldbook_workspaces/{sessionId}/.
 * Only writes entries that have an entryPath set (like "世界书/角色/苏云/基础信息.txt").
 */
export async function persistWorkspaceEntries(
  sessionId: string,
  entries: CreateWorldbookEntryInput[],
): Promise<void> {
  const invoke = await getInvoke();
  const entriesWithPaths = entries.filter((e) => e.entryPath && e.content);
  if (entriesWithPaths.length === 0) return;

  try {
    await invoke("save_workspace_dir", {
      sessionId,
      entriesJson: JSON.stringify(entriesWithPaths),
    });
  } catch (err) {
    console.error("[Whale Builder] Failed to persist workspace entries:", err);
  }
}

/**
 * Delete the entire workspace directory for a session.
 */
export async function deleteWorkspaceDir(sessionId: string): Promise<void> {
  const invoke = await getInvoke();
  await invoke("delete_workspace_dir", { sessionId });
}
