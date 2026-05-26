# NeoTavern

NeoTavern 是一个面向角色扮演的 AI 聊天桌面客户端，重点服务长上下文、角色卡、预设提示词、世界书和正则后处理工作流。项目基于 Tauri v2、React、TypeScript 和 pnpm workspace 构建，适合接入 DeepSeek、OpenAI 以及其他 OpenAI-compatible API。

## 适合谁

- 想用 DeepSeek 做长上下文角色扮演的人。
- 需要管理多个角色、预设、世界书和 API 配置的人。
- 希望把提示词拆成可排序、可开关、可导入导出的卡片的人。
- 想在本地桌面应用里保存配置和聊天数据的人。

## 功能概览

### 聊天体验

- 角色聊天界面，支持角色头像、开场白、消息编辑、复制、删除和重新生成。
- 用户消息删除时可同步删除紧跟的 assistant 回复，保持问答轮次干净。
- 支持停止生成、Prompt Preview、完整提示词查看。
- 右上角显示 token 统计、缓存命中率，以及 DeepSeek 100 万上下文使用进度条。
- Token 统计弹窗展示 Prompt、Completion、Total、Cache Hit、Hit Rate 和 1M Context。

### 角色与世界书

- 创建、编辑、删除角色卡。
- 支持角色描述、性格、场景、开场白、示例对话、头像和标签。
- 角色页支持“选择查看 / 单独编辑”的工作流。
- 世界书条目可按关键词触发并注入上下文。
- 内置示例角色 Seraphina 和艾尔多利亚世界书。

### 预设提示词

- 一个预设可以包含多张 prompt 卡片。
- 每张卡片支持启用/禁用、system/user role、内容编辑和排序。
- 条目支持拖拽排序，并真实写回 `injectionOrder`。
- Prompt builder 会按 `injectionOrder` 注入预设条目，因此页面顺序会真实影响提示词组成。
- 支持导入/导出 JSON，兼容部分 SillyTavern 预设结构。

### 正则后处理

- 支持正则预设和规则管理。
- 可将 AI 输出拆成正文、摘要、思考块、行动按钮等展示结构。
- 可配置 strip from prompt，避免展示用内容进入下一轮上下文。
- `$actions` 规则可以把“请选择下一步行动”列表渲染成可点击按钮。

### 配置与存储

- 支持多个 OpenAI-compatible API 配置。
- 支持主题切换：Light / Dark / System。
- 数据优先写入 Tauri app-data 目录下的 `store.json`。
- 浏览器开发环境保留 localStorage fallback。
- 启动时会迁移旧的 `neotavern*` localStorage 数据。
- Tauri CSP 已启用显式策略，减少不必要的 WebView 权限暴露。

## 技术栈

| 模块 | 技术 |
| --- | --- |
| 桌面壳 | Tauri v2 + Rust |
| 前端 | React 18 + TypeScript + Vite |
| 状态管理 | Zustand |
| UI | Tailwind CSS + Radix UI + Lucide Icons |
| 核心逻辑 | Workspace package `@neo-tavern/core` |
| 类型共享 | Workspace package `@neo-tavern/shared` |
| 包管理 | pnpm workspace |
| 本地存储 | Tauri app-data JSON store + browser fallback |

## 项目结构

```text
Neo/
├── apps/
│   └── desktop/
│       ├── public/                 # 静态资源
│       ├── src/
│       │   ├── app/                # 应用启动、主题、种子数据
│       │   ├── db/                 # 存储适配器和 repositories
│       │   ├── features/           # chat / character / settings / preset stores
│       │   ├── pages/              # 页面组件
│       │   └── main.tsx
│       └── src-tauri/              # Tauri Rust 后端
├── packages/
│   ├── core/                       # Prompt builder、模型 provider、regex、worldbook 逻辑
│   ├── shared/                     # 共享类型和工具
│   └── ui/                         # 共享 UI 组件
├── docs/
│   └── current-changes.md          # 当前改动记录
├── setup.ps1                       # Windows 安装启动脚本
├── 一键安装启动.bat                 # Windows 一键入口
├── package.json
└── pnpm-workspace.yaml
```

## 快速开始

### 环境要求

- Node.js 18 或更高版本。
- pnpm。
- Rust stable。运行 Tauri 桌面应用或构建安装包时需要。

### 安装依赖

```bash
git clone https://github.com/YELEBAI/Neo.git
cd Neo
pnpm install
```

### Web 开发模式

```bash
pnpm dev
```

默认地址：

```text
http://localhost:1420
```

### Tauri 桌面开发模式

```bash
pnpm tauri dev
```

也可以使用更显式的命令：

```bash
pnpm --filter @neo-tavern/desktop tauri dev
```

### Windows 一键启动

在 Windows 上可以直接运行：

```text
一键安装启动.bat
```

或：

```powershell
./setup.ps1
```

脚本会检查 Node.js、pnpm 和 Rust，并尝试安装缺失依赖。

## 构建

### 构建前端

```bash
pnpm build
```

### 构建 Tauri 应用

```bash
pnpm --filter @neo-tavern/desktop tauri build
```

## 测试与检查

```bash
pnpm --filter @neo-tavern/desktop exec tsc -p tsconfig.json --noEmit --incremental false
pnpm --filter @neo-tavern/core test
pnpm --filter @neo-tavern/desktop test
```

Rust 检查：

```bash
cd apps/desktop/src-tauri
cargo check
```

## 使用 DeepSeek

1. 打开 Settings。
2. 新增或编辑 API 配置。
3. Base URL 填写你的 DeepSeek OpenAI-compatible endpoint。
4. 填写 API Key 和模型名。
5. 保存并切换到该配置。
6. 在聊天页右上角查看 token 数据、缓存命中率和 `1M` 上下文占用条。

`1M` 上下文进度条按当前会话最近一轮 usage 的 `totalTokens` 估算。如果接口没有返回 `totalTokens`，会使用 `promptTokens + completionTokens` 作为兜底。

## 预设排序如何影响提示词

预设页面中的卡片顺序不是纯 UI 展示。拖拽排序后，应用会重写每张卡片的 `injectionOrder`：

```text
Prompt #1 -> injectionOrder 10
Prompt #2 -> injectionOrder 20
Prompt #3 -> injectionOrder 30
```

生成提示词时，`@neo-tavern/core` 会按 `injectionOrder` 从小到大注入这些卡片。因此你在预设页看到的顺序，就是实际发给模型的预设提示词顺序。

## 数据位置

Tauri 环境下，NeoTavern 会把应用数据写入系统 app-data 目录中的 `store.json`。浏览器开发模式下会 fallback 到 localStorage。

迁移逻辑会在启动时读取旧的 `neotavern*` localStorage key，并复制到 Tauri app-data store。迁移不会主动删除旧 localStorage 数据。

## 文档

- 当前改动记录：[docs/current-changes.md](docs/current-changes.md)

## 许可证

当前仓库尚未提供明确 LICENSE 文件。发布或分发前请先补充许可证信息。
