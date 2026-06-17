/**
 * @mobile/__tests__
 *
 * 测试目录。
 *
 * 结构: 与 src/ 目录镜像。
 *
 *   src/storage/storage.ts  →  __tests__/storage/storage.test.ts
 *   src/store/connection.store.ts → __tests__/store/connection.store.test.ts
 *   src/features/chat/ChatScreen.tsx → __tests__/features/chat/ChatScreen.test.tsx
 *
 * 约定:
 * - 单元测试覆盖 utils / hooks / storage / store。
 * - 集成测试覆盖 screen（React Navigation + store）。
 * - Vitest（与 monorepo 根统一）或 Jest。
 */
