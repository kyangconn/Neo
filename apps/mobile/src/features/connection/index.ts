/**
 * @mobile/features/connection
 *
 * 局域网连接与配对。
 *
 * 模块规划:
 * - `ConnectionService.ts`    LAN 发现 + 配对 + 心跳（单例 service）。
 * - `PairingScreen.tsx`       配对 UI（输入 URL + 密码）。
 * - `ConnectionBanner.tsx`    顶部连接状态条（online / offline / paired）。
 *
 * 约定:
 * - service 是无 UI 的纯逻辑模块，不依赖 React。
 * - screen / component 依赖 service + store。
 * - 连接状态通过 useConnectionStore 消费。
 */

// 占位 — 实现待补。
