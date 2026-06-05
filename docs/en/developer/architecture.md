# Architecture

Whale Play is a **Tauri v2 + React monorepo** — a desktop application for character card creation and roleplay chat. This document describes the monorepo layout, package dependency flow, and key design decisions.

## Monorepo Layout

```
Neo/
├── apps/
│   └── desktop/                  # Tauri application
│       ├── src/                  #   React frontend source
│       │   ├── app/              #     App entry, theme store, router, seed data
│       │   ├── components/       #     Shared UI components (Layout, LoginGate, etc.)
│       │   ├── db/               #     Storage abstraction & repositories
│       │   │   └── repositories/ #       Data access layer per entity
│       │   ├── features/         #     Feature modules
│       │   │   ├── character/    #       Character management
│       │   │   ├── chat/         #       Chat store, types, memory utilities
│       │   │   ├── preset/       #       Prompt preset management
│       │   │   ├── settings/     #       Model configs, regex rules, worldbooks
│       │   │   ├── billing/      #       Usage cost tracking
│       │   │   ├── image-generation/
│       │   │   └── agentic-play/ #       Experimental game-master mode
│       │   ├── pages/            #     Page-level components
│       │   │   ├── chat/         #       Chat UI sub-components
│       │   │   ├── neo-builder/  #       Character builder page
│       │   │   └── settings/     #       Settings page
│       │   ├── i18n/             #     i18next initialization
│       │   ├── locales/          #     Translation JSON files (en, zh)
│       │   └── utils/            #     Small utilities (parse, toast)
│       └── src-tauri/            #   Rust/Tauri backend (commands, plugins, SQLite)
├── packages/
│   ├── core/                     # Core logic: prompt building, regex, memory, worldbook
│   ├── shared/                   # Shared TypeScript types and utilities
│   └── ui/                       # Radix-based UI component library
├── pnpm-workspace.yaml
├── package.json
├── eslint.config.mts
└── tsconfig.base.json
```

## Dependency Flow

The dependency graph follows a strict **bottom-up hierarchy**:

```
desktop (@neo-tavern/desktop)
  ├── core (@neo-tavern/core)          →  shared (@neo-tavern/shared)
  └── ui   (@neo-tavern/ui)            →  shared (@neo-tavern/shared)
```

### Packages

| Package               | Dependencies               | Purpose                                                                                                                                                      |
| --------------------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `@neo-tavern/shared`  | —                          | Pure TypeScript types, interfaces, and small utilities. Zero runtime dependencies.                                                                           |
| `@neo-tavern/core`    | `shared`                   | Prompt building, regex rule processing, worldbook resolution, long-term memory, token estimation. No DOM or UI dependencies. Testable with `vitest` in Node. |
| `@neo-tavern/ui`      | `shared`, Radix primitives | Reusable component library: buttons, cards, dialogs, textareas, scroll areas, toasts.                                                                        |
| `@neo-tavern/desktop` | `core`, `shared`, `ui`     | The Tauri application — React frontend wired to Tauri IPC, feature stores, page components, and repositories.                                                |

### Key Rules

- **`core` has no UI dependencies.** It never imports from `ui` or `react`. This keeps prompt processing and regex logic testable in a plain Node environment.
- **`desktop` is the only consumer** that imports all three packages. Feature modules inside `apps/desktop/src/features/` hold Zustand stores and page-specific logic.
- **`shared` is a leaf package.** Nothing depends on it except `core`, `ui`, and `desktop`.

## Bundling & Build Pipeline

- `pnpm-workspace.yaml` registers `apps/*` and `packages/*` as workspace packages.
- Each package defines its own `tsconfig.json` extending `tsconfig.base.json` from the root.
- The `@vitejs/plugin-react` plugin handles React JSX compilation in the desktop app.
- `core` exports its source directly (`"main": "./src/index.ts"`) so Vite can compile it inline with the app — no separate build step needed for workspace packages during development.

## Folder Conventions

```
apps/desktop/src/features/{feature}/
├── {feature}.store.ts       # Zustand store
├── {feature}.types.ts       # Feature-specific types
└── [...]                    # Hooks, utilities, sub-components
```

Repositories mirror this pattern:

```
apps/desktop/src/db/repositories/
├── {entity}.repository.ts   # CRUD operations via storage abstraction
└── index.ts                 # Re-exports
```

Pages are thin components that compose feature stores and repository functions together.
