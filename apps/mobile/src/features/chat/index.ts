/**
 * @mobile/features/chat
 *
 * 角色扮演聊天。
 *
 * 模块规划:
 * - `ChatScreen.tsx`         聊天主界面。
 * - `MessageBubble.tsx`      单条消息气泡。
 * - `MessageList.tsx`        虚拟列表容器（首版 FlatList ，后续 VirtualList）。
 * - `ChatInput.tsx`          输入框 + 发送/停止/重试。
 * - `chat.store.ts`          当前聊天状态（消息、流式输出 token）。
 *
 * 约定:
 * - 核心逻辑（prompt 构建 / 正则 / 世界书召回 / model-provider）从 packages/core 复用。
 * - UI 全新编写，不复制桌面端页面。
 * - 消息数据模型使用 @neo-tavern/shared 的 Message 类型。
 */

// 占位 — 实现待补。
