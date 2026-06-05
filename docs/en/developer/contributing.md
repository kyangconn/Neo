# Contributing

## Code Style

### TypeScript

The project uses **strict TypeScript** mode. The base configuration (`tsconfig.base.json`) sets:

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": false,
    "exactOptionalPropertyTypes": false
  }
}
```

Key rules:

- **No `any`** — use `unknown` and type narrowing instead. ESLint warns on `@typescript-eslint/no-explicit-any`.
- **No unused variables** — prefix unused parameters with `_` (e.g. `_event`, `_unused`). ESLint warns on `@typescript-eslint/no-unused-vars`.
- **`no-console`** — `console.log` is not allowed. Use `console.warn` or `console.error` for debugging output that should remain in code; otherwise remove before committing.
- **ES2020 target** — modern JS features are available (optional chaining, nullish coalescing, etc.).
- **ESNext modules** — use `import`/`export` syntax throughout.

### React

- **Functional components only** — no class components.
- **JSX in `.tsx` files** — non-JSX files use `.ts`.
- **Props are typed** — define interfaces or types for all component props.
- **No `prop-types`** runtime checks — TypeScript handles prop validation at build time.
- **Hooks rules** — follow the Rules of Hooks. The `react-hooks/exhaustive-deps` lint rule is enabled.

### File Naming

| Type             | Convention                    | Example                  |
| ---------------- | ----------------------------- | ------------------------ |
| React components | PascalCase                    | `ChatInputArea.tsx`      |
| Stores           | kebab-case + `.store.ts`      | `theme.store.ts`         |
| Types            | kebab-case + `.types.ts`      | `chat.types.ts`          |
| Repositories     | kebab-case + `.repository.ts` | `settings.repository.ts` |
| Hooks            | camelCase in `hooks/`         | `useSendMessage.ts`      |
| Utilities        | kebab-case                    | `storage.ts`             |

### Imports

- Use `@/` path alias for `apps/desktop/src/` imports (configured in `vite.config.ts`).
- Workspace packages use their npm scope: `@neo-tavern/core`, `@neo-tavern/shared`, `@neo-tavern/ui`.
- Group imports: external → workspace → internal aliases.

## ESLint Configuration

The project uses ESLint v10 with a flat config file (`eslint.config.mts`):

```bash
pnpm lint          # Check all files
pnpm lint:fix      # Auto-fix where possible
```

The config ignores `dist/`, `node_modules/`, `src-tauri/`, and `gen/` directories.

## Commit Message Format

Commits follow the **Conventional Commits** specification:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types

| Type       | Usage                                                   |
| ---------- | ------------------------------------------------------- |
| `feat`     | A new feature                                           |
| `fix`      | A bug fix                                               |
| `docs`     | Documentation only changes                              |
| `style`    | Code style changes (formatting, missing semicolons)     |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `perf`     | Performance improvement                                 |
| `test`     | Adding or correcting tests                              |
| `chore`    | Build process, dependencies, tooling                    |

### Scopes

| Scope     | Area                      |
| --------- | ------------------------- |
| `desktop` | `apps/desktop/`           |
| `core`    | `packages/core/`          |
| `shared`  | `packages/shared/`        |
| `ui`      | `packages/ui/`            |
| `tauri`   | `apps/desktop/src-tauri/` |
| `docs`    | `docs/`                   |
| `ci`      | `.github/`                |

### Examples

```
feat(chat): add message search functionality

fix(core): handle empty pattern in regex rule processing

docs(storage): document three-layer fallback architecture

chore(deps): upgrade react-router to v7
```

## Pull Request Workflow

1. **Branch from `main`** — use feature branches (`feat/`, `fix/`, `docs/`).
2. **Keep PRs focused** — one feature or fix per PR. Large changes should be broken into logical commits.
3. **TypeScript must pass** — `pnpm --filter @neo-tavern/desktop exec tsc --noEmit` must succeed.
4. **Lint must pass** — `pnpm lint` should report no errors.
5. **Tests should pass** — `pnpm test` should pass. If you add new functionality, include tests.
6. **Write meaningful commit messages** — follow the Conventional Commits format above.
7. **Update docs** — if you change public APIs, storage schemas, or build workflows, update the relevant docs in `docs/`.
8. **Request review** — at least one maintainer review is required before merging.

## Testing Requirements

- **`core` package** — all new logic should have vitest tests in `packages/core/src/**/__tests__/`. This includes prompt building, regex processing, worldbook resolution, and memory utilities.
- **`desktop` app** — store logic and utilities should be tested. UI component tests are not required for most changes but are appreciated.
- **Test files** — use the `.test.ts` extension. Place tests in a `__tests__` directory next to the source file.
- **Run tests** — `pnpm test` runs all tests across the workspace.

## Getting Started

1. Clone the repository.
2. Run `pnpm install` to install dependencies.
3. Run `pnpm dev` to start the development server.
4. Make your changes.
5. Run `pnpm lint` and `pnpm test` to verify.
6. Submit a PR.
