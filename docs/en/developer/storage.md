# Storage

Whale Play uses a **three-layer storage architecture** that adapts to the runtime environment. The same storage API works whether the app is running as a native Tauri window or in a browser.

## Three-Layer Fallback

When any storage operation is performed, the system tries layers in order:

```
  Tauri App Store (SQLite)
        │
        ▼  Tauri invoke fails?
  REST API (LAN browser fallback)
        │
        ▼  Network unavailable?
  localStorage (last resort)
```

### Layer 1: Tauri App Store (SQLite)

When running as a native Tauri application, all data goes through Rust commands backed by a local SQLite database:

- `app_store_get(key)` — retrieve a value by key
- `app_store_set(key, value)` — persist a value
- `app_store_remove(key)` — delete a key
- `app_store_entries()` — retrieve all key-value pairs

These are implemented as Tauri `invoke` calls (`@tauri-apps/api/core`). On first successful call, the system caches `appStoreAvailable = true` and skips the Tauri layer on subsequent calls if it was ever found unavailable.

### Layer 2: REST API Fallback

In browser mode (e.g. a local dev server on LAN), the frontend attempts to reach a REST API at `/api/store/{key}`:

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET` | `/api/store/{key}` | Get value |
| `PUT` | `/api/store/{key}` | Set value (body: `{ value }`) |
| `DELETE` | `/api/store/{key}` | Remove key |
| `GET` | `/api/store` | List all entries |

The API also reads an optional JWT from `sessionStorage.getItem("neo_token")` for authorization.

### Layer 3: localStorage Fallback

If neither Tauri nor REST is available, the system falls back to `window.localStorage`. All keys are prefixed with `neotavern` to avoid collisions.

## Storage Abstraction (`db/storage.ts`)

The file `apps/desktop/src/db/storage.ts` exposes these async functions:

| Function | Purpose |
|----------|---------|
| `getStorageItem(key)` | Read a value, trying all 3 layers |
| `setStorageItem(key, value)` | Write a value through the best available layer |
| `removeStorageItem(key)` | Delete a key |
| `getStorageEntries(prefix)` | Enumerate all keys matching a prefix |
| `migrateLocalStorageToAppStore()` | One-time migration of localStorage data to Tauri app store |

All functions are **async** — even the localStorage layer, to maintain a consistent interface.

### Migration

On first launch, `migrateLocalStorageToAppStore()` copies all `neotavern`-prefixed entries from localStorage into the Tauri App Store. A dedicated key (`neotavern_app_store_migrated_v1`) tracks whether migration has already run.

## Repository Pattern (`db/repositories/`)

Repositories sit **above** the storage abstraction and provide a typed, entity-specific API. Each repository owns its storage key prefix and is responsible for serialization (typically `JSON.parse` / `JSON.stringify`).

```
apps/desktop/src/db/repositories/
├── agentic-play-state.repository.ts
├── character.repository.ts
├── chat.repository.ts
├── chat-memory.repository.ts
├── chat-savepoint.repository.ts
├── message.repository.ts
├── preset.repository.ts
├── secondary-api-usage.repository.ts
├── settings.repository.ts
├── worldbook.repository.ts
└── index.ts
```

### Example: `settings.repository.ts`

```typescript
async getAllModelConfigs(): Promise<ModelConfig[]> {
  const raw = await getStorageItem("neotavern_model_configs");
  return raw ? JSON.parse(raw) : [];
}

async saveModelConfig(config: ModelConfig): Promise<void> {
  const configs = (await loadFromStorage()).filter((c) => c.id !== config.id);
  configs.push(config);
  await saveToStorage(configs);
}

async deleteModelConfig(id: string): Promise<void> {
  const configs = (await loadFromStorage()).filter((c) => c.id !== id);
  await saveToStorage(configs);
}
```

Each repository handles:
- **Serialization** — JSON encoding/decoding of entities
- **Key scoping** — consistent prefixes (`neotavern_model_configs`, `neotavern_regex_presets`, etc.)
- **Business rules** — e.g. switching active config when the current one is deleted

## Data Flow

```
React Component
     │
     ▼
Zustand Store  (e.g. useSettingsStore)
     │
     ▼
Repository     (e.g. settingsRepository)
     │
     ▼
Storage Layer  (getStorageItem / setStorageItem)
     │
     ├─ Tauri App Store (SQLite)
     ├─ REST API
     └─ localStorage
```

Stores are the **single source of truth** for the UI. They load data on init (via `loadAllConfigs()`, `loadRegexRules()`, etc.) and persist changes immediately through repositories. This ensures data survives page reloads, app restarts, and even environment switches (browser ↔ native).
