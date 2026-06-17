/**
 * 命名空间化的 storage key 定义。
 *
 * 命名规范:
 *   whaleplay:<namespace>:<item>
 *
 * - 顶层 namespace 按功能域划分（connection / settings / sync / character 等）。
 * - 需要持久化的 key 在此文件集中声明，杜绝裸字符串 scattered across codebase。
 * - 鸿蒙 Preferences 约 16MB 总量限制，键值以小数据为主，
 *   大数据（消息 / 角色长文本）后续走 SQLite repository。
 */

// ── Namespace 常量 ───────────────────────────────

/** 连接状态（LAN 配对、baseUrl 等） */
export const NAMESPACE_CONNECTION = "connection" as const;

/** 用户设置（主题、API key、偏好等） */
export const NAMESPACE_SETTINGS = "settings" as const;

/** 同步元数据（manifest 版本号、last synced cursor 等） */
export const NAMESPACE_SYNC = "sync" as const;

/** 角色数据（后续可能迁移到 SQLite） */
export const NAMESPACE_CHARACTER = "character" as const;

/** 预设提示词 */
export const NAMESPACE_PRESET = "preset" as const;

/** 世界书条目 */
export const NAMESPACE_WORLDBOOK = "worldbook" as const;

/** 用户人设 */
export const NAMESPACE_PERSONA = "persona" as const;

// ── Typed key helpers ─────────────────────────────

/** 可用于 storage key 的 namespace 值。 */
export type KeyNamespace =
  | typeof NAMESPACE_CONNECTION
  | typeof NAMESPACE_SETTINGS
  | typeof NAMESPACE_SYNC
  | typeof NAMESPACE_CHARACTER
  | typeof NAMESPACE_PRESET
  | typeof NAMESPACE_WORLDBOOK
  | typeof NAMESPACE_PERSONA;

/**
 * Type-level 的 storage key。
 * N = namespace 字面量，T = 该 key 对应的期望类型。
 *
 * 所有 key 在此类型系统内取值，未声明在 keys.ts 里的 key 会在编译期报错。
 * （运行时 key 仍是 string，类型系统做编译期约束。）
 */
export type StorageKey<N extends KeyNamespace, T = string> = string & {
  readonly _namespace: N;
  readonly _valueType: T;
};

// ── 连接域 key ────────────────────────────────────

/** LAN 服务端地址。例: http://192.168.1.5:3000 */
export const CONN_BASE_URL: StorageKey<typeof NAMESPACE_CONNECTION, string> = "baseUrl" as StorageKey<
  typeof NAMESPACE_CONNECTION,
  string
>;

/** 连接模式（paired / online / offline / discovering） */
export const CONN_MODE: StorageKey<typeof NAMESPACE_CONNECTION, string> = "mode" as StorageKey<
  typeof NAMESPACE_CONNECTION,
  string
>;

// ── 设置域 key ────────────────────────────────────

/** 深色模式开关。'system' | 'light' | 'dark' */
export const SETTING_THEME: StorageKey<typeof NAMESPACE_SETTINGS, string> = "theme" as StorageKey<
  typeof NAMESPACE_SETTINGS,
  string
>;

/** API key（加密存储，首版不落地 ＊，存在内存）。 */
// NOTE: API key 的持久化策略待定。首版 token/API key 不落盘。
// 这里仅声明 key 以备后续加密方案。

// ── 同步域 key ─────────────────────────────────────

/** 最后一次成功同步的 cursor。 */
export const SYNC_LAST_CURSOR: StorageKey<typeof NAMESPACE_SYNC, string> = "lastCursor" as StorageKey<
  typeof NAMESPACE_SYNC,
  string
>;

/** 桌面端 manifest hash。 */
export const SYNC_MANIFEST_HASH: StorageKey<typeof NAMESPACE_SYNC, string> = "manifestHash" as StorageKey<
  typeof NAMESPACE_SYNC,
  string
>;

// ── 角色域 key ─────────────────────────────────────

/** 角色列表（JSON 数组，后续迁移到 SQLite）。 */
export const CHAR_LIST: StorageKey<typeof NAMESPACE_CHARACTER, string> = "list" as StorageKey<
  typeof NAMESPACE_CHARACTER,
  string
>;

// ── 人设域 key ─────────────────────────────────────

/** 用户人设 { name, desc }。 */
export const PERSONA_DATA: StorageKey<typeof NAMESPACE_PERSONA, string> = "data" as StorageKey<
  typeof NAMESPACE_PERSONA,
  string
>;

// ── 辅助 ───────────────────────────────────────────

/** 获取某个 namespace 的完整前缀。 */
export function nsPrefix(ns: KeyNamespace): `${KeyNamespace}:` {
  return `${ns}:`;
}
