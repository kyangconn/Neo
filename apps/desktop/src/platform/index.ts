/**
 * Platform abstraction — decouples the frontend from Tauri invoke().
 *
 * All native calls go through getBackend(), which returns a typed Backend interface.
 * Currently only Tauri is implemented. To add REST mode:
 *   1. Create platform/rest.ts implementing Backend
 *   2. Change the import in this file
 */

import { tauriBackend } from "./tauri";
import type { Backend } from "./types";

// Reserved for future setBackend() to switch between Tauri/REST at runtime
// eslint-disable-next-line prefer-const
let backend: Backend = tauriBackend;

export function getBackend(): Backend {
  return backend;
}

export type { Backend } from "./types";
