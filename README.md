# Whale Play

Whale Play 是一个面向角色卡创作和角色扮演聊天的桌面应用。它把角色卡、世界书、预设提示词、长上下文聊天、实验性主持人模式和 Whale Builder 创作工作流放在同一个本地客户端里。

项目基于 Tauri v2、React、TypeScript、Vite 和 pnpm workspace 构建，模型接口使用 OpenAI-compatible API，可接入 DeepSeek、OpenAI 兼容服务或其他同协议模型。

## 当前重点

- 角色卡聊天：多角色、多会话、开场白、消息编辑、删除、复制、重新生成和停止生成。
- Agentic Play 实验模式：使用专用主持人提示词、结构化场景状态、真实骰子工具和可点击行动选项。
- Whale Builder：通过聊天式流程生成角色卡、世界书、性格调色盘、创作规划和可保存产物。
- 世界书：管理世界书与条目，按上下文召回并注入提示词。
- 预设提示词：管理 system/user prompt 卡片，支持排序、启用/禁用、导入和导出。
- 正则后处理：把模型输出拆成正文、展示块、图片标记、按钮等前端结构，并可控制是否进入下一轮提示词。
- 用量与调试：显示 token、缓存命中、费用估算、Prompt Preview 和调试 prompt 文件。

## Agentic Play

Agentic Play 是聊天页里的实验模式。它不使用普通预设组，而是替换为一组专用主持人模块：

- `core_rules`
- `writing_style`
- `specific_rules`
- `host_style`

该模式会继续读取角色卡、世界书、记忆和聊天历史，但会额外注入结构化场景状态。模型可使用这些工具：

- `present_player_options`：在剧情断点发起 5 个结构化行动选项，选项显示在输入栏上方，不写进正文。
- `roll_dice`：根据成功率或难度进行真实骰子判定。
- `update_game_state`：更新位置、任务、NPC、物品、危险等级、flags 等场景状态。

开局时会读取角色卡 first message，并在第一个需要玩家选择的断点给出行动选项。玩家也可以直接输入自定义行动。

## Whale Builder

Whale Builder 是内置的角色卡与世界书创作工作流。它会先收集方向和必要设定，再进入规划与逐条创作阶段。

当前能力包括：

- 一次性批量询问同一创作阶段的问题。
- 使用结构化选项栏收集用户选择。
- 读取内置 skill references。
- 生成并维护创作规划。
- 后台逐条创作，并在右侧监控世界书条目进度。
- 生成角色卡、世界书、性格调色盘、MVU 相关材料和评估报告。
- 保存到 Whale Play，或导出到文件夹。

Builder 相关逻辑位于：

```text
apps/desktop/src/features/character/builder/
```

## 技术栈

| 模块 | 技术 |
| --- | --- |
| 桌面壳 | Tauri v2 + Rust |
| 前端 | React 18 + TypeScript + Vite |
| 状态管理 | Zustand |
| UI | Tailwind CSS + Radix UI + Lucide Icons |
| 虚拟列表 | @tanstack/react-virtual |
| Prompt / Regex / Worldbook | `@neo-tavern/core` |
| 共享类型 | `@neo-tavern/shared` |
| 共享 UI | `@neo-tavern/ui` |
| 包管理 | pnpm workspace |

## 项目结构

```text
Whaleplay/
├── apps/
│   └── desktop/
│       ├── src/
│       │   ├── app/                # 路由、启动、主题、种子数据
│       │   ├── components/         # 通用前端组件
│       │   ├── db/                 # 存储适配器和 repositories
│       │   ├── features/           # chat / character / builder / settings 等业务逻辑
│       │   ├── pages/              # 页面和页面局部组件
│       │   └── main.tsx
│       ├── public/                 # 静态资源
│       └── src-tauri/              # Tauri Rust 后端
├── packages/
│   ├── core/                       # prompt builder、模型 provider、regex、worldbook
│   ├── shared/                     # 共享类型和工具
│   └── ui/                         # 共享 UI 组件
├── setup.ps1                       # Windows 安装启动脚本
├── uninstall-project.ps1           # Windows 清理脚本
├── 一键安装启动.bat
├── 一键清理卸载.bat
├── package.json
└── pnpm-workspace.yaml
```

## 环境要求

- Node.js 20 或更高版本。
- pnpm。
- Rust stable。仅在运行 Tauri 桌面开发模式或构建桌面安装包时需要。

## 安装

```bash
git clone https://github.com/YELEBAI/Whaleplay.git
cd Whaleplay
pnpm install
```

Windows 上也可以直接运行：

```text
一键安装启动.bat
```

或：

```powershell
./setup.ps1
```

## 开发

Web/Vite 开发模式：

```bash
pnpm dev
```

Tauri 桌面开发模式：

```bash
pnpm tauri dev
```

等价显式命令：

```bash
pnpm --filter @neo-tavern/desktop tauri dev
```

## 构建

前端构建：

```bash
pnpm build
```

桌面应用构建：

```bash
pnpm build:desktop
```

或：

```bash
pnpm --filter @neo-tavern/desktop tauri build
```

## 测试与检查

桌面端测试：

```bash
pnpm --filter @neo-tavern/desktop test
```

桌面端类型检查和前端构建：

```bash
pnpm --filter @neo-tavern/desktop build
```

Rust 检查：

```bash
cd apps/desktop/src-tauri
cargo check
```

## 模型配置

在应用 Settings 中新增 API 配置：

1. 选择或新增 OpenAI-compatible 配置。
2. 填写 Base URL。
3. 填写 API Key。
4. 填写模型名。
5. 保存并切换到该配置。

聊天、Agentic Play、Whale Builder、图片规划和记忆压缩都会读取当前设置中的模型配置。部分辅助功能可以单独配置次级模型。

## 本地数据

Tauri 环境下，应用数据写入系统 app-data 目录。

- 聊天消息使用 SQLite：`neotavern.sqlite3`
- 其他配置和资源使用 JSON store：`store.json`
- 浏览器开发环境会 fallback 到 localStorage 或本地 REST fallback

应用保留了旧 `neotavern*` localStorage 数据迁移逻辑，用于兼容早期开发版本。

## 注意事项

- Agentic Play 仍是实验模式，提示词、状态结构和工具协议还会继续调整。
- Whale Builder 角色卡生成器中的内置 skill 基于 **Tavern Cards — SillyTavern 角色卡与世界书编写工具** 修改适配，原作者：`ai4rpg`。
- Whale Builder 的内置 skill references 和 `tavern-cards-forge.mjs` 主要服务角色卡/世界书生成工作流，不等同于独立发布的 CLI 产品。

## 许可证

本项目使用 MIT License，详见 [LICENSE](./LICENSE)。
