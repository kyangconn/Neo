/**
 * @mobile/features/_template
 *
 * 新增 feature 时复制此文件夹作为模板。
 *
 * 每个 feature 应是一个自包含的功能模块：
 * - 自己的 store（如有状态）。
 * - 自己的 screen / component。
 * - 通过 index.ts 公开对外 API。
 *
 * Feature 之间只能通过以下方式通信：
 * - store（读同一 zustand store）。
 * - navigation params（React Navigation）。
 * - shared types（@neo-tavern/shared）。
 *
 * 禁止：
 * - 直接 import 另一个 feature 的内部文件（破坏封装）。
 * - 在 feature 内直接操作 DOM / native module（通过 services 层）。
 */

// 本文件为模板说明，不要在此目录下写业务代码。
