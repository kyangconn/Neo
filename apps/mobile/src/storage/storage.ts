/**
 * 移动端 KV 存储 — 唯一持久化入口。
 *
 * 设计原则（来自桌面端的教训）：
 * 1. 所有持久化走这一个模块，不再像桌面端那样 KV/SQLite/zustand 三套并行。
 * 2. 接口先行：KVStorage 定义了最小可移植 API，换后端只需换实现。
 * 3. Typed key：使用 namespaced key（whaleplay:scope:item）+ 强类型读写。
 */

import type { KeyNamespace, StorageKey } from "./keys";

// ── 接口 ──────────────────────────────────────────

/**
 * 通用的 KV 存储抽象接口。
 * 方法签名对齐 @react-native-async-storage/async-storage 的常用子集，
 * 同时兼容鸿蒙 port @react-native-ohos/async-storage（底层 @ohos.data.preferences）。
 */
export interface KVStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
  getAllKeys(): Promise<readonly string[]>;
}

// ── AsyncStorage 实现 ──────────────────────────────

/**
 * AsyncStorage 适配器。
 * Android 底层是 SQLite；鸿蒙底层是 @ohos.data.preferences（Preferences）。
 * 同一个 JS API 两端均可使用。
 */
let asyncStorageModule: KVStorage | null = null;

function getAsyncStorage(): KVStorage {
  if (asyncStorageModule) return asyncStorageModule;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const AsyncStorage = require("@react-native-async-storage/async-storage").default;
  asyncStorageModule = {
    getItem: (key: string) => AsyncStorage.getItem(key),
    setItem: (key: string, value: string) => AsyncStorage.setItem(key, value),
    removeItem: (key: string) => AsyncStorage.removeItem(key),
    getAllKeys: () => AsyncStorage.getAllKeys(),
  };
  return asyncStorageModule;
}

// ── 全局实例 ───────────────────────────────────────

let _storage: KVStorage;

/** 初始化为默认实现（async-storage），可注入自定义实现用于测试。 */
export function initStorage(storage?: KVStorage): KVStorage {
  _storage = storage ?? getAsyncStorage();
  return _storage;
}

/** 获取已初始化的存储实例（调用前需先 initStorage）。 */
export function storage(): KVStorage {
  if (!_storage) {
    _storage = initStorage();
  }
  return _storage;
}

/** 注入测试用实现。仅测试代码调用。 */
export function _setStorageForTesting(s: KVStorage) {
  _storage = s;
}

// ── Typed helpers ─────────────────────────────────

/**
 * 创建带命名空间前缀的存储访问器。
 * 所有 key 自动加上 namespace 前缀。
 *
 * 用法:
 *   const connStorage = createNamespacedStorage('connection');
 *   await connStorage.get('baseUrl');
 */
export function createNamespacedStorage<N extends KeyNamespace>(namespace: N) {
  const prefix = `${namespace}:`;
  const s = () => storage();

  return {
    /**
     * 读取一个 typed key 的值（JSON 反序列化）。
     * 没有值或解析失败返回 null。
     */
    async get<T = string>(key: StorageKey<N, T>): Promise<T | null> {
      const raw = await s().getItem(`${prefix}${key}`);
      if (raw === null || raw === undefined) return null;
      try {
        return JSON.parse(raw) as T;
      } catch {
        // 兼容旧纯字符串值
        return raw as unknown as T;
      }
    },

    /** 写入一个值（JSON 序列化）。 */
    async set<T = string>(key: StorageKey<N, T>, value: T): Promise<void> {
      await s().setItem(`${prefix}${key}`, JSON.stringify(value));
    },

    /** 删除一个 key。 */
    async remove(key: StorageKey<N, unknown>): Promise<void> {
      await s().removeItem(`${prefix}${key}`);
    },

    /** 获取当前命名空间下所有 key 和值。 */
    async entries(): Promise<Record<string, string | null>> {
      const all = await s().getAllKeys();
      const result: Record<string, string | null> = {};
      for (const k of all) {
        if (k.startsWith(prefix)) {
          const short = k.slice(prefix.length);
          result[short] = await s().getItem(k);
        }
      }
      return result;
    },

    /** 清空当前命名空间下所有 key。 */
    async clear(): Promise<void> {
      const all = await s().getAllKeys();
      for (const k of all) {
        if (k.startsWith(prefix)) {
          await s().removeItem(k);
        }
      }
    },
  };
}

// ── zustand persist 存储适配器 ───────────────────

/**
 * 为 zustand persist 创建存储适配器。
 * zustand/middleware persist 的 createJSONStorage 需要 { getItem, setItem, removeItem }
 * 接口的一个子集。
 *
 * 用法:
 *   persist(
 *     (set, get) => ({ ... }),
 *     {
 *       name: 'whaleplay:connection',
 *       storage: createJSONStorage(() => zustandStorageAdapter),
 *     }
 *   )
 */
export const zustandStorageAdapter = {
  getItem: async (key: string): Promise<string | null> => storage().getItem(key),
  setItem: async (key: string, value: string): Promise<void> => storage().setItem(key, value),
  removeItem: async (key: string): Promise<void> => storage().removeItem(key),
};
