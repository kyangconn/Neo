# Theming

The theme system uses **CSS custom properties (variables)** toggled by CSS classes on the `<html>` element, managed through a Zustand store.

## Available Themes

| Theme    | CSS Class   | Color Scheme   | Use Case                       |
| -------- | ----------- | -------------- | ------------------------------ |
| `light`  | _(none)_    | `light`        | Default bright mode            |
| `dark`   | `.dark`     | `dark`         | Low-light environment          |
| `sepia`  | `.sepia`    | `light`        | Warm paper-like reading        |
| `blue`   | `.blue`     | `dark`         | Blue-tinted dark theme         |
| `system` | _(dynamic)_ | _(follows OS)_ | Auto-switch between light/dark |

> The `system` theme resolves to either `light` or `dark` based on `prefers-color-scheme`. It is not one of the CSS variable sets — it maps to the resolved theme at runtime.

## CSS Variables

All theme tokens are defined as HSL values in `apps/desktop/src/index.css` inside `:root` blocks. The base set is declared at the top level:

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
  /* ... more variables */
}
```

Each theme variant overrides these variables with different HSL values:

```css
:root.dark {
  --background: 220 10% 4.5%;
  --foreground: 0 0% 98%;
  /* ... dark palette */
}

:root.sepia {
  --background: 42 55% 88%;
  --foreground: 28 28% 16%;
  /* ... sepia palette */
}

:root.blue {
  --background: 213 43% 9%;
  --foreground: 205 46% 94%;
  /* ... blue palette */
}
```

Custom scrollbar styles also adapt to each theme via their own variables (`--scrollbar-track`, `--scrollbar-thumb`, `--scrollbar-thumb-hover`).

### Usage in Tailwind

The `@layer base` block in `index.css` maps CSS variables to Tailwind utility classes:

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

This means all Tailwind classes like `bg-background`, `text-foreground`, `border-border` resolve dynamically based on the active theme.

## Theme Store (`app/theme.store.ts`)

The Zustand store `useThemeStore` manages theme state and persistence:

```typescript
interface ThemeStore {
  theme: Theme; // User's selected theme ("light" | "dark" | "sepia" | "blue" | "system")
  resolvedTheme: ResolvedTheme; // Actually applied theme (never "system")
  init: () => Promise<void>;
  setTheme: (t: Theme) => void;
}
```

### `init()` — Restore saved theme

Called once on app mount (in `App.tsx`):

1. Reads `neotavern_theme` from storage via `getStorageItem()`
2. If a valid theme is found, resolves and applies it
3. On first launch (no saved theme), defaults to `"system"` and persists it

### `setTheme()` — Change & persist

1. Resolves the theme (if `"system"`, determines via `matchMedia`)
2. Updates the store state
3. Applies DOM classes:
   - Adds `.dark` / `.sepia` / `.blue` to `document.documentElement.classList`
   - Removes the other class names
   - Sets `document.documentElement.style.colorScheme` to `"dark"` or `"light"`
4. Persists the choice to storage via `setStorageItem()`

### System Theme Listener

A global `matchMedia` listener watches `prefers-color-scheme` changes. When the user has `theme === "system"`, it updates the resolved theme in real time:

```typescript
window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
  const { theme } = useThemeStore.getState();
  if (theme !== "system") return;
  const resolved = e.matches ? "dark" : "light";
  useThemeStore.setState({ resolvedTheme: resolved });
  applyDOMTheme(resolved);
});
```

## Theme Integration

```
App.tsx (mount)
  └─ useThemeStore.init()   → reads storage, applies saved theme
      └─ setTheme("dark")   → toggle classes on <html>, persist

CSS Variables (#index.css)
  :root                     → light values
  :root.dark                → dark values
  :root.sepia               → sepia values
  :root.blue                → blue values

Tailwind Classes
  bg-background             → hsl(var(--background))
  text-foreground           → hsl(var(--foreground))
  border-border             → hsl(var(--border))
```

The `<ThemeProvider>` in `providers.tsx` is intentionally minimal — theme application is handled entirely by the store's `init()` call. The actual provider component is a pass-through wrapper for future convenience.
