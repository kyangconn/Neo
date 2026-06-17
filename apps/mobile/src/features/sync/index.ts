/**
 * @mobile/features/sync
 *
 * 桌面端 ↔ 移动端数据同步。
 *
 * 依赖约束:
 * - 本模块只调用桌面端已就绪的 /api/sync/* REST API。
 * - 协议（revision / tombstone / cursor）由 dev 主线在 packages/shared 定义。
 *
 * 模块规划:
 * - `SyncClient.ts`      REST 同步客户端（pair / manifest / snapshot / push）。
 * - `sync.store.ts`      同步状态 store（progress / conflict 提示）。
 * - `ConflictResolver.ts` 冲突策略（消息追加 auto-merge；实体编辑 conflict copy）。
 *
 * 约定:
 * - 同步不阻塞 UI；所有网络操作异步，状态通过 store 驱动 UI。
 */

// 占位 — 实现待补。
