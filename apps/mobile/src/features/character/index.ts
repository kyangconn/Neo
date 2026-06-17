/**
 * @mobile/features/character
 *
 * 角色管理。
 *
 * 模块规划:
 * - `character.store.ts`   zustand store（角色列表 + 已选角色）。
 * - `CharacterListScreen.tsx` 角色列表（卡片 grid / list）。
 * - `CharacterDetailScreen.tsx` 角色详情（avatar / 描述 / 属性）。
 * - `character.repository.ts` 数据存取（首版用 KV，后续切 SQLite）。
 *
 * 约定:
 * - 角色数据最终会从 @neo-tavern/shared 接入 Character 类型。
 * - repository 接口一旦定义就不再大改；切换底层实现（KV → SQLite）不碰上层。
 */

// 占位 — 实现待补。
