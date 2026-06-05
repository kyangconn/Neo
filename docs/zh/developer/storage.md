# 存储

Whale Play 采用**三层存储架构**，根据运行环境自适应。无论应用是作为原生 Tauri 窗口运行还是在浏览器中运行，都使用同一套存储 API。

## 三层回退机制

执行任何存储操作时，系统按顺序尝试各层：

```
  Tauri App Store（SQLite）
        │
        ▼  Tauri invoke 失败？
  REST API（局域网浏览器回退）
        │
        ▼  网络不可用？
  localStorage（最后手段）
```

### 第一层：Tauri App Store（SQLite）

作为原生 Tauri 应用运行时，所有数据通过基于本地 SQLite 数据库的 Rust 命令进行处理：

- `app_store_get(key)`——按键获取值
- `app_store_set(key, value)`——持久化值
- `app_store_remove(key)`——删除键
- `app_store_entries()`——获取所有键值对

这些命令通过 Tauri `invoke` 调用实现（`@tauri-apps/api/core`）。首次成功调用后，系统会将 `appStoreAvailable = true` 缓存起来；如果 Tauri 层曾被检测为不可用，则后续调用会跳过该层。

### 第二层：REST API 回退

在浏览器模式下（例如局域网上的本地开发服务器），前端尝试访问 `/api/store/{key}` 的 REST API：

| 方法     | 端点               | 用途                          |
| -------- | ------------------ | ----------------------------- |
| `GET`    | `/api/store/{key}` | 获取值                        |
| `PUT`    | `/api/store/{key}` | 设置值（请求体：`{ value }`） |
| `DELETE` | `/api/store/{key}` | 删除键                        |
| `GET`    | `/api/store`       | 列出所有条目                  |

该 API 还可以从 `sessionStorage.getItem("neo_token")` 读取可选的 JWT 用于鉴权。

### 第三层：localStorage 回退

如果 Tauri 和 REST 均不可用，系统会回退到 `window.localStorage`。所有键都带有 `neotavern` 前缀以避免冲突。

## 存储抽象层（`db/storage.ts`）

`apps/desktop/src/db/storage.ts` 文件暴露了以下异步函数：

| 函数                              | 用途                                             |
| --------------------------------- | ------------------------------------------------ |
| `getStorageItem(key)`             | 读取值，依次尝试所有三层                         |
| `setStorageItem(key, value)`      | 通过最佳可用层写入值                             |
| `removeStorageItem(key)`          | 删除键                                           |
| `getStorageEntries(prefix)`       | 枚举匹配前缀的所有键                             |
| `migrateLocalStorageToAppStore()` | 一次性将 localStorage 数据迁移到 Tauri App Store |

所有函数都是**异步的**——即使是 localStorage 层，也是为了保持接口一致。

### 迁移

首次启动时，`migrateLocalStorageToAppStore()` 会将所有以 `neotavern` 为前缀的条目从 localStorage 复制到 Tauri App Store 中。使用专用键 `neotavern_app_store_migrated_v1` 来跟踪迁移是否已执行。

## 仓库模式（`db/repositories/`）

仓库位于**存储抽象层之上**，提供类型化、实体特定的 API。每个仓库拥有自己的存储键前缀，并负责序列化（通常使用 `JSON.parse` / `JSON.stringify`）。

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

### 示例：`settings.repository.ts`

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

每个仓库负责：

- **序列化**——实体的 JSON 编码/解码
- **键的作用域**——一致的前缀（`neotavern_model_configs`、`neotavern_regex_presets` 等）
- **业务规则**——例如，当当前活跃配置被删除时切换到其他配置

## 数据流

```
React 组件
     │
     ▼
Zustand Store（例如 useSettingsStore）
     │
     ▼
仓库（例如 settingsRepository）
     │
     ▼
存储层（getStorageItem / setStorageItem）
     │
     ├─ Tauri App Store（SQLite）
     ├─ REST API
     └─ localStorage
```

Store 是 UI 的**单一数据源**。它们在初始化时加载数据（通过 `loadAllConfigs()`、`loadRegexRules()` 等），并通过仓库立即持久化更改。这确保了数据在页面刷新、应用重启甚至环境切换（浏览器 ↔ 原生）后依然存在。
