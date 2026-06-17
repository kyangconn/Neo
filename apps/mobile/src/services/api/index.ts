/**
 * @mobile/services/api
 *
 * HTTP 客户端与 REST API 封装。
 *
 * 模块规划:
 * - `client.ts`  HTTP client（fetch 封装，自动带 token）。
 * - `endpoints.ts` API 路径常量。
 *
 * 约定:
 * - 所有网络请求走此模块，不在 feature 中直接调 fetch。
 * - Token 从 useConnectionStore.getState().token 取（不落盘）。
 * - 错误处理统一做（非 2xx → DescriptiveError）。
 */

// 占位 — 实现待补。
