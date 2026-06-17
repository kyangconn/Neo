/**
 * @mobile/services/model
 *
 * LLM 模型调用封装。
 *
 * 模块规划:
 * - `model-provider.ts`  对接模型 API（流式 / 非流式）。
 * - `prompt-builder.ts`  提示词构建（从 packages/core 复用 core 逻辑）。
 *
 * 约定:
 * - 首版直接调 API；后续从 packages/core 复用 model-provider。
 * - 流式请求不下线（chat switch 不打断生成，生成任务挂全局队列）。
 */

// 占位 — 实现待补。
