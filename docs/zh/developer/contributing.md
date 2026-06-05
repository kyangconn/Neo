# 贡献指南

## 代码风格

### TypeScript

本项目使用**严格 TypeScript** 模式。基础配置（`tsconfig.base.json`）设置如下：

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": false,
    "exactOptionalPropertyTypes": false
  }
}
```

关键规则：

- **禁止使用 `any`**——请使用 `unknown` 加类型收窄。ESLint 会对 `@typescript-eslint/no-explicit-any` 发出警告。
- **无未使用变量**——未使用的参数请以 `_` 开头（例如 `_event`、`_unused`）。ESLint 会对 `@typescript-eslint/no-unused-vars` 发出警告。
- **`no-console`**——不允许使用 `console.log`。如需保留调试输出，请使用 `console.warn` 或 `console.error`；否则请在提交前移除。
- **ES2020 目标**——可使用现代 JS 特性（可选链、空值合并等）。
- **ESNext 模块**——全程使用 `import`/`export` 语法。

### React

- **仅使用函数组件**——不使用类组件。
- **JSX 放在 `.tsx` 文件中**——非 JSX 文件使用 `.ts`。
- **Props 需要类型定义**——为所有组件 props 定义接口或类型。
- **不使用 `prop-types` 运行时检查**——TypeScript 在构建时处理 prop 验证。
- **Hooks 规则**——遵循 Hooks 规则。已启用 `react-hooks/exhaustive-deps` 检查规则。

### 文件命名

| 类型 | 命名规范 | 示例 |
|------|-----------|---------|
| React 组件 | 帕斯卡命名法（PascalCase） | `ChatInputArea.tsx` |
| Store | 短横线命名法（kebab-case）+ `.store.ts` | `theme.store.ts` |
| 类型 | 短横线命名法 + `.types.ts` | `chat.types.ts` |
| 仓库 | 短横线命名法 + `.repository.ts` | `settings.repository.ts` |
| 钩子 | 驼峰命名法（camelCase），放在 `hooks/` 中 | `useSendMessage.ts` |
| 工具 | 短横线命名法 | `storage.ts` |

### 导入

- 从 `apps/desktop/src/` 导入时使用 `@/` 路径别名（在 `vite.config.ts` 中配置）。
- 工作区包使用其 npm scope：`@neo-tavern/core`、`@neo-tavern/shared`、`@neo-tavern/ui`。
- 导入分组顺序：外部包 → 工作区包 → 内部别名。

## ESLint 配置

项目使用 ESLint v10 和扁平配置文件（`eslint.config.mts`）：

```bash
pnpm lint          # 检查所有文件
pnpm lint:fix      # 尽可能自动修复
```

配置会忽略 `dist/`、`node_modules/`、`src-tauri/` 和 `gen/` 目录。

## 提交信息格式

提交信息遵循**约定式提交（Conventional Commits）**规范：

```
<类型>(<作用域>): <描述>

[可选的正文]

[可选的脚注]
```

### 类型

| 类型 | 用途 |
|------|-------|
| `feat` | 新功能 |
| `fix` | 错误修复 |
| `docs` | 仅文档变更 |
| `style` | 代码风格变更（格式化、缺失的分号等） |
| `refactor` | 既不修复错误也不添加功能的代码变更 |
| `perf` | 性能改进 |
| `test` | 添加或修正测试 |
| `chore` | 构建流程、依赖项、工具配置 |

### 作用域

| 作用域 | 区域 |
|-------|------|
| `desktop` | `apps/desktop/` |
| `core` | `packages/core/` |
| `shared` | `packages/shared/` |
| `ui` | `packages/ui/` |
| `tauri` | `apps/desktop/src-tauri/` |
| `docs` | `docs/` |
| `ci` | `.github/` |

### 示例

```
feat(chat): 添加消息搜索功能

fix(core): 处理正则规则处理中的空模式

docs(storage): 记录三层回退架构

chore(deps): 升级 react-router 到 v7
```

## Pull Request 工作流

1. **从 `main` 创建分支**——使用功能分支（`feat/`、`fix/`、`docs/`）。
2. **保持 PR 聚焦**——每个 PR 只包含一个功能或修复。大的变更应拆分为逻辑清晰的多次提交。
3. **TypeScript 必须通过**——`pnpm --filter @neo-tavern/desktop exec tsc --noEmit` 必须成功。
4. **代码检查必须通过**——`pnpm lint` 应无错误报告。
5. **测试应通过**——`pnpm test` 应通过。如果添加了新功能，请包含测试。
6. **撰写有意义的提交信息**——遵循上述约定式提交格式。
7. **更新文档**——如果修改了公开 API、存储 schema 或构建工作流，请更新 `docs/` 中的相关文档。
8. **请求评审**——合并前至少需要一位维护者评审。

## 测试要求

- **`core` 包**——所有新逻辑应在 `packages/core/src/**/__tests__/` 中包含 vitest 测试。这包括提示词构建、正则处理、世界书解析和记忆工具。
- **`desktop` 应用**——store 逻辑和工具应进行测试。大多数变更不要求 UI 组件测试，但我们鼓励添加。
- **测试文件**——使用 `.test.ts` 扩展名。将测试放在源文件旁边的 `__tests__` 目录中。
- **运行测试**——`pnpm test` 运行工作区中所有测试。

## 开始贡献

1. 克隆仓库。
2. 运行 `pnpm install` 安装依赖。
3. 运行 `pnpm dev` 启动开发服务器。
4. 进行你的修改。
5. 运行 `pnpm lint` 和 `pnpm test` 进行验证。
6. 提交 PR。
