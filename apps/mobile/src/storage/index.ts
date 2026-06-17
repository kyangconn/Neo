/**
 * @mobile/storage
 *
 * 移动端 KV 持久化的唯一入口。
 *
 * ┌ 应用层 ───────────────────────────┐
 * │ zustand persist / repository / ...    │
 * └─────────────┬────────────────────┘
 *               │
 * ┌ storage.ts  ──────────────────────┐
 * │ createNamespacedStorage(ns)          │  ← typed, auto-namespaced
 * │ storage() → KVStorage                │  ← raw low-level
 * │ zustandStorageAdapter                 │  ← for zustand persist
 * └─────────────┬────────────────────┘
 *               │
 * ┌ KVStorage 接口 ────────────────────┐
 * │ getItem / setItem / removeItem       │
 * │ getAllKeys                           │
 * └─────────────┬────────────────────┘
 *               │
 * ┌ 实现层 ═══════════════════════════┐
 * │ AsyncStorageKVAdapter                │  ← @react-native-async-storage/async-storage
 * │ (可注入 MemoryKVAdapter 用于测试)    │
 * └────────────────────────────────────┘
 */

export {
  type KVStorage,
  initStorage,
  storage,
  createNamespacedStorage,
  zustandStorageAdapter,
  _setStorageForTesting,
} from "./storage";

export {
  type KeyNamespace,
  type StorageKey,
  NAMESPACE_CONNECTION,
  NAMESPACE_SETTINGS,
  NAMESPACE_SYNC,
  NAMESPACE_CHARACTER,
  NAMESPACE_PRESET,
  NAMESPACE_WORLDBOOK,
  NAMESPACE_PERSONA,
  CONN_BASE_URL,
  CONN_MODE,
  SETTING_THEME,
  SYNC_LAST_CURSOR,
  SYNC_MANIFEST_HASH,
  CHAR_LIST,
  PERSONA_DATA,
  nsPrefix,
} from "./keys";
