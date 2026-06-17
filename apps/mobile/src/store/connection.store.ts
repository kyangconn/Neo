/**
 * 连接状态 store。
 *
 * 持久化 baseUrl（跨 app 重启保留），认证 token 只存在内存。
 *
 * 设计理由：桌面端 LAN 配对需要用户每次手动输入密码，
 * token 不落盘降低泄露风险；baseUrl 持久化减少重复输入。
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  zustandStorageAdapter,
  CONN_BASE_URL,
  CONN_MODE,
  NAMESPACE_CONNECTION,
  createNamespacedStorage,
} from "../storage";

// ── 类型 ───────────────────────────────────────────

export type ConnectionMode =
  | "discovering" // 搜索桌面端
  | "paired" // 已配对
  | "online" // 已连接，心跳可达
  | "offline"; // 已配对但不可达

export interface ConnectionState {
  /** 桌面端 LAN 地址。例: http://192.168.1.5:3000 */
  baseUrl: string | null;
  /** 连接模式 */
  mode: ConnectionMode;
  /** 认证 token（仅内存，不持久化）。 */
  token: string | null;
  /** 最后成功心跳时间戳（毫秒）。 */
  lastHeartbeat: number | null;
}

export interface ConnectionActions {
  setBaseUrl: (url: string) => void;
  setMode: (mode: ConnectionMode) => void;
  setToken: (token: string | null) => void;
  setLastHeartbeat: (ts: number) => void;
  /** 退出登录：清 token，保持 baseUrl 和 paired 模式。 */
  logout: () => void;
  /** 断开配对：清空所有状态。 */
  clear: () => void;
}

export type ConnectionStore = ConnectionState & ConnectionActions;

// ── 可持久化的 state 子集 ────────────────────────

/** persist 中间件的 partialize: 只持久化这些字段。 */
function persistPartial(state: ConnectionStore) {
  return {
    baseUrl: state.baseUrl,
    mode: state.mode,
  };
}

// ── Store 创建 ─────────────────────────────────────

export const useConnectionStore = create<ConnectionStore>()(
  persist(
    (set) => ({
      // ── state ──
      baseUrl: null,
      mode: "discovering" as ConnectionMode,
      token: null,
      lastHeartbeat: null,

      // ── actions ──
      setBaseUrl: (url) => set({ baseUrl: url }),
      setMode: (mode) => set({ mode }),
      setToken: (token) => set({ token }),
      setLastHeartbeat: (lastHeartbeat) => set({ lastHeartbeat }),

      logout: () => set({ token: null, mode: "online" as ConnectionMode }),
      clear: () =>
        set({
          baseUrl: null,
          mode: "discovering" as ConnectionMode,
          token: null,
          lastHeartbeat: null,
        }),
    }),
    {
      name: `${NAMESPACE_CONNECTION}:state`,
      storage: createJSONStorage(() => zustandStorageAdapter),
      partialize: persistPartial,
      // zustand 4.x persist 默认使用 JSON.stringify/parse，与 createNamespacedStorage 的 JSON 编解码一致。
    },
  ),
);
