/**
 * @mobile/store
 *
 * zustand stores — 移动端全局状态管理。
 *
 * 约定:
 * - 所有持久化走 zustand persist 中间件，底层 adapter 指向 src/storage。
 * - Token / API key / 密码等敏感数据不启用 persist（只存内存），
 *   在 persist 的 partialize 中显式排除。
 * - Store 按功能域拆文件（connection / settings / ...），
 *   通过本 index 统一 re-export。
 */

export { useConnectionStore, type ConnectionState, type ConnectionMode } from "./connection.store";
