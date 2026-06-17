# 移动端架构（`apps/mobile`）

> Phase 0 可交付物。记录移动端目标、目录规划、依赖规则、存储策略、测试约定。

---

## 目标

移动端是一套**独立 UI，两种运行模式**（局域网在线 / 离线本地），与桌面端共享类型和核心逻辑，但是 UI 全新编写。

|          | Android                                  | HarmonyOS NEXT                                        |
| -------- | ---------------------------------------- | ----------------------------------------------------- |
| 技术栈   | React Native 0.84.1 (New Arch + Hermes)  | RNOH 0.84.1 (`@react-native-oh/react-native-harmony`) |
| 原生入口 | `MainActivity.kt` / `MainApplication.kt` | `EntryAbility.ets` / `Index.ets`                      |
| JS 入口  | `index.js` (同一份)                      | `index.js` (同一份，metro 重定向)                     |

---

## 目录结构

```
apps/mobile/src/
├── app/                    # App shell：Provider + 启动逻辑
│   └── providers/          # SafeArea / Store / Theme providers
├── storage/                # ★ 唯一持久化入口（KV）
│   ├── storage.ts          # KVStorage 接口 + AsyncStorage 实现
│   ├── keys.ts             # 命名空间化的 key 定义
│   └── index.ts
├── store/                  # zustand stores（全局状态管理）
│   ├── connection.store.ts # 连接状态（persist baseUrl）
│   ├── index.ts
│   └── (settings.store.ts) # 设置（后续）
├── features/               # 功能模块（self-contained）
│   ├── connection/         # LAN 配对 / 连接服务
│   ├── character/          # 角色列表 / 详情
│   ├── chat/               # 聊天
│   ├── settings/           # 设置
│   ├── personapreset/      # 用户人设 + 预设提示词
│   ├── worldbook/          # 世界书
│   ├── sync/               # 同步客户端（待 dev 主线 API 就绪）
│   └── _template/          # 新 feature 模板与约定说明
├── services/               # 跨 feature 的基础设施
│   ├── api/                # HTTP client（自动带 token）
│   ├── model/              # LLM 模型调用
│   └── repository/         # SQLite repository adapter（后续）
├── navigation/             # React Navigation 配置
├── theme/                  # 语义颜色 / 间距 token
├── components/             # 共享 UI 组件
├── hooks/                  # 共享 hooks
├── utils/                  # 纯工具函数
├── i18n/                   # 多语言
└── __tests__/              # 测试（与 src/ 结构镜像）
```

---

## 依赖方向

```
┌──────────────────────────────────────────────┐
│                    features/                 │  ← 业务 UI + store
│  (可依赖 packages/core, packages/shared,      │
│   storage, services, theme, components)       │
├──────────────────────────────────────────────┤
│  services/  │  store/  │  components/  │ ... │  ← 基础设施
├──────────────────────────────────────────────┤
│            storage/ (唯一持久化)              │  ← 底层
└──────────────────────────────────────────────┘
```

**硬性规则：**

- `storage/` 不依赖任何 React / UI 模块。
- `services/` 不 import `features/`。
- `features/` 之间不能直接 import 内部文件（仅通过 store 或 React Navigation params 通信）。
- `theme/` / `utils/` / `hooks/` 是纯基础设施，不依赖 `features/`。

---

## 存储策略

### 当前（首版）— KV only

| 存储层级                      | 定位                                | 实现                                                                                                |
| ----------------------------- | ----------------------------------- | --------------------------------------------------------------------------------------------------- |
| `KVStorage` 接口              | 通用 KV 抽象                        | `src/storage/storage.ts`                                                                            |
| AsyncStorage 适配             | Android: SQLite / 鸿蒙: Preferences | `@react-native-async-storage/async-storage@2.2.0` + `@react-native-ohos/async-storage@2.3.0-beta.1` |
| `createNamespacedStorage(ns)` | typed, namespaced 读写              | `src/storage/storage.ts`                                                                            |
| zustand persist               | store 持久化                        | `zustand/middleware/persist` → `zustandStorageAdapter`                                              |

**鸿蒙 Preferences 容量限制**：约 16 MB。除设置 / token 等小数据外的大数据（消息 / 角色长文本 / sync change log）后续必须走 SQLite。

### 后续（Phase 5+）— KV + SQLite

```
KV (async-storage)           SQLite (op-sqlite / expo-sqlite)
├── 设置 / 连接 / 偏好        ├── 消息
├── token / key（加密）        ├── 角色完整数据
├── 同步 cursor               ├── 世界书完整数据
└── 用户人设                  ├── 预设完整数据
                              └── sync change log
```

迁移策略：`repository` 接口不变，底层从 KV 切换到 SQLite 不碰上层。

### 桌面端对照（反面教材）

桌面端的 Persistent 数据散落在三类存储中，同类数据甚至拆在两处（settings 部分在 KV `neotavern_setting_*`，部分在 zustand persist `neotavern-settings`）。

| 桌面端                                                                         | 移动端设计                                      |
| ------------------------------------------------------------------------------ | ----------------------------------------------- |
| `storage.ts` 三级降级 (Tauri → REST → localStorage)                            | `KVStorage` 单实现（可注入 mock）               |
| `settings.repository.ts` (KV) + `settings.store.ts` (zustand persist) 各自维护 | 统一：zustand persist → `zustandStorageAdapter` |
| 裸字符串 key 散落全仓                                                          | `keys.ts` 集中声明，typed key                   |

---

## Key 命名规范

```
whaleplay:<namespace>:<item>

例:
  whaleplay:connection:baseUrl
  whaleplay:settings:theme
  whaleplay:sync:lastCursor
  whaleplay:character:list
```

- `namespace` 常量在 `keys.ts` 中声明（`NAMESPACE_CONNECTION` 等）。
- 新增 key 要求先在 `keys.ts` 中声明，再在代码中使用，杜绝裸字符串。

---

## Feature 设计约定

每个 feature 是自包含的功能模块，标准结构：

```
features/<name>/
├── index.ts            # 模块说明 + 公共 API re-export
├── <name>.store.ts     # zustand store（如有）
├── <name>.repository.ts # 数据存取（如有，实现尽量不依赖 React）
├── <name>.service.ts   # 非 UI 业务逻辑（如有）
├── <name>.screen.tsx   # 页面组件
├── components/         # feature 内专用组件
└── __tests__/          # feature 内测试
```

**Feature 间通信方式：**

1. **store** — 读同一 zustand store。
2. **navigation params** — React Navigation route params。
3. **shared types** — `@neo-tavern/shared` 类型定义。

禁止 feature A 直接 `import` feature B 的内部文件。

---

## 测试约定

```
__tests__/
├── storage/
│   └── storage.test.ts
├── store/
│   └── connection.store.test.ts
├── hooks/
│   └── useDebounce.test.ts
└── features/
    └── chat/
        └── ChatScreen.test.tsx
```

- **单元测试**：utils / hooks / storage / store（纯逻辑，不 mount 原生组件）。
- **集成测试**：screen + store + navigation（React Native Testing Library）。
- 与 monorepo 根统一使用 Vitest（如 Jest 工作流发生冲突，则评估迁移时机）。
- 测试 mock provider：`_setStorageForTesting(new MemoryKVStorage())` 替换真实 AsyncStorage。

---

## 与桌面端（`apps/desktop`）+ 共享包关系

```
packages/shared/          ← 共享类型（Character / Message / Preset / Worldbook / sync schema）
packages/core/            ← 核心逻辑（prompt / regex / worldbook / model-provider 等）
     ↓ (移动端复用)
apps/mobile/
     feat. sync client    ← 首版对齐 desktop sync API（/api/sync/*）
     feat. chat           ← 复用 packages/core 的 prompt / model-provider
```

移动端不复制桌面端页面，UI 全重写；只复用 `core` 的纯逻辑和 `shared` 的类型。

---

## 当前实现状态

| 模块             | 状态 | 文件                                                |
| ---------------- | ---- | --------------------------------------------------- |
| KVStorage 接口   | ✅   | `src/storage/storage.ts`                            |
| Key 命名体系     | ✅   | `src/storage/keys.ts`                               |
| Connection store | ✅   | `src/store/connection.store.ts` (zustand + persist) |
| React Navigation | ✅   | `src/navigation/` (Tab + 3 Stacks, 7 screens)      |
| enableScreens    | ✅   | 鸿蒙 `enableScreens(false)` 降级 JS View           |
| 目录骨架         | ✅   | 所有 feature / service / shared 文件夹均已初始化    |
| 其他 store       | ⏳   | 待功能开发时补充                                    |
| SQLite adapter   | ⏳   | Phase 5                                             |
| Sync client      | ⏳   | 待 dev 主线 /api/sync/\* 就绪                       |
