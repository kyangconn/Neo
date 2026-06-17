/**
 * @mobile/services/repository
 *
 * 数据持久化 repository（SQLite 接入后启用）。
 *
 * 设计说明:
 * - 当前首版所有持久化走 KV（src/storage）。
 * - 后续消息 / 角色长文本 / sync change log 等结构化数据需要 SQLite，
 *   此目录用于存放 SQLite repository adapter。
 *
 * 接口约定:
 * - 每个 repository 暴露纯数据 CRUD 方法，不依赖 React / zustand。
 * - 方法签名与桌面端 db/repositories 对齐（方便 sync server 同步）。
 */

// 占位 — 实现待补。
