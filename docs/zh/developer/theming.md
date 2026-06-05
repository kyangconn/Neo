# 主题

主题系统使用 **CSS 自定义属性（变量）**，通过在 `<html>` 元素上切换 CSS 类来控制，并由 Zustand store 管理。

## 可用主题

| 主题 | CSS 类 | 配色方案 | 适用场景 |
|-------|-----------|-------------|----------|
| `light` | （无） | `light` | 默认亮色模式 |
| `dark` | `.dark` | `dark` | 低光环境 |
| `sepia` | `.sepia` | `light` | 暖色纸质阅读风格 |
| `blue` | `.blue` | `dark` | 蓝色调暗色主题 |
| `system` | （动态） | （跟随系统） | 在亮色/暗色间自动切换 |

> `system` 主题会根据 `prefers-color-scheme` 解析为 `light` 或 `dark`。它不属于 CSS 变量集之一——而是在运行时映射到已解析的主题。

## CSS 变量

所有主题 token 在 `apps/desktop/src/index.css` 中的 `:root` 块内定义为 HSL 值。基础集在顶层声明：

```css
:root {
  --background: 0 0% 100%;
  --foreground: 0 0% 3.9%;
  --primary: 0 0% 9%;
  --primary-foreground: 0 0% 98%;
  --border: 0 0% 89.8%;
  --radius: 0.5rem;
  --scrollbar-track: 0 0% 96.1%;
  --scrollbar-thumb: 0 0% 72%;
  /* ... 更多变量 */
}
```

每个主题变体用不同的 HSL 值覆盖这些变量：

```css
:root.dark {
  --background: 220 10% 4.5%;
  --foreground: 0 0% 98%;
  /* ... 暗色配色 */
}

:root.sepia {
  --background: 42 55% 88%;
  --foreground: 28 28% 16%;
  /* ... 暖黄配色 */
}

:root.blue {
  --background: 213 43% 9%;
  --foreground: 205 46% 94%;
  /* ... 蓝色配色 */
}
```

自定义滚动条样式也会通过其自身的变量（`--scrollbar-track`、`--scrollbar-thumb`、`--scrollbar-thumb-hover`）适配每个主题。

### 在 Tailwind 中使用

`index.css` 中的 `@layer base` 块将 CSS 变量映射到 Tailwind 工具类：

```css
@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

这意味着所有 Tailwind 类（如 `bg-background`、`text-foreground`、`border-border`）会根据当前激活的主题动态解析。

## 主题 Store（`app/theme.store.ts`）

Zustand store `useThemeStore` 管理主题状态和持久化：

```typescript
interface ThemeStore {
  theme: Theme;              // 用户选择的主题（"light" | "dark" | "sepia" | "blue" | "system"）
  resolvedTheme: ResolvedTheme;  // 实际应用的主题（永远不会是 "system"）
  init: () => Promise<void>;
  setTheme: (t: Theme) => void;
}
```

### `init()`——恢复已保存的主题

在应用挂载时调用一次（在 `App.tsx` 中）：

1. 通过 `getStorageItem()` 从存储中读取 `neotavern_theme`
2. 如果找到有效主题，则解析并应用
3. 首次启动（无已保存主题）时，默认为 `"system"` 并持久化

### `setTheme()`——切换并持久化

1. 解析主题（如果是 `"system"`，通过 `matchMedia` 确定）
2. 更新 store 状态
3. 应用 DOM 类：
   - 将 `.dark` / `.sepia` / `.blue` 添加到 `document.documentElement.classList`
   - 移除其他类名
   - 设置 `document.documentElement.style.colorScheme` 为 `"dark"` 或 `"light"`
4. 通过 `setStorageItem()` 将选择持久化到存储

### 系统主题监听器

一个全局的 `matchMedia` 监听器会监听 `prefers-color-scheme` 的变化。当用户的 `theme === "system"` 时，它会实时更新已解析的主题：

```typescript
window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
  const { theme } = useThemeStore.getState();
  if (theme !== "system") return;
  const resolved = e.matches ? "dark" : "light";
  useThemeStore.setState({ resolvedTheme: resolved });
  applyDOMTheme(resolved);
});
```

## 主题集成

```
App.tsx（挂载）
  └─ useThemeStore.init()   → 读取存储，应用已保存的主题
      └─ setTheme("dark")   → 切换 <html> 上的类，持久化

CSS 变量（#index.css）
  :root                     → 亮色值
  :root.dark                → 暗色值
  :root.sepia               → 暖黄值
  :root.blue                → 蓝色值

Tailwind 类
  bg-background             → hsl(var(--background))
  text-foreground           → hsl(var(--foreground))
  border-border             → hsl(var(--border))
```

`providers.tsx` 中的 `<ThemeProvider>` 有意保持简洁——主题应用完全由 store 的 `init()` 调用处理。实际的 provider 组件是一个透传包装器，为将来使用提供便利。
