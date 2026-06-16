# Whale Play 移动端（`apps/mobile`）

Whale Play 的 React Native 移动端工程骨架。本分支（`feat/mobile-app`）**只负责移动端工程搭建、能跑起来连接到真机**；同步协议、共享逻辑收口等由桌面端 `dev` 主线推进，完成后 merge 进来再做具体 UI 与功能（见根目录 `todo.md` 的「分支协作」与「实现阶段」）。

---

## 当前状态

| 模块         | 状态 | 说明                                                                                          |
| ------------ | ---- | --------------------------------------------------------------------------------------------- |
| 工程配置     | ✅   | `package.json` / `metro.config.js` / `babel.config.js` / `tsconfig.json`，已接入 pnpm workspace |
| Android 原生 | ✅   | `MainActivity.kt` / `MainApplication.kt` 已补齐，`./gradlew :app:assembleDebug` 通过          |
| Android 真机 | ✅   | APK 构建 + Metro JS bundle 均通过；`pnpm mobile android` 可部署到真机                          |
| 鸿蒙原生     | ⏳   | npm 依赖 + metro 配置就位，需 `react-native init-harmony` 生成 `harmony/` 工程（见下文）       |
| workspace 复用 | ⏳ | `@neo-tavern/shared`/`core` 路径别名已配，待 dev 主线解耦后接入                                |
| 同步客户端   | ⏳   | 待 dev 主线 sync API（`/api/sync/*`）就绪                                                      |
| 本地 SQLite  | ⏳   | 待 repository adapter 设计落地                                                                 |

当前 `App.tsx` 是 React Native 模板页（`@react-native/new-app-screen`），后续会替换为真正的移动 UI。

---

## 技术栈

- **React Native 0.84.1**：New Architecture only（Fabric + TurboModules + Bridgeless），Hermes 引擎。
- **鸿蒙 RNOH**：`@react-native-oh/react-native-harmony@0.84.1`（华为 + Software Mansion 官方维护），同一套 JS 代码跑 Android 和 HarmonyOS NEXT。

---

## 环境要求

### 通用

| 工具 | 版本 |
| --- | --- |
| Node.js | >= 24（与 monorepo 根一致） |
| pnpm | 11.x |

### Android

| 工具 | 版本 | 说明 |
| --- | --- | --- |
| JDK | 21 | `java -version` 检查 |
| Android SDK | Platform 36、Build-Tools 36.0.0、NDK 27.1.12297006 | |
| `ANDROID_SDK_ROOT` | 指向 SDK 目录 | Gradle 与 RN CLI 读取 |

`apps/mobile/android/local.properties`（已 gitignore）需要指明 SDK 路径：

```properties
sdk.dir=C:\\SDK\\android
```

### HarmonyOS（待搭建）

| 工具 | 版本 | 说明 |
| --- | --- | --- |
| DevEco Studio | 6.x | 需 API 20 SDK；5.x 只到 API 15，不满足 RNOH 0.84 target |
| HarmonyOS SDK | compatibleSdk `5.0.0(12)`、target `6.0.0(20)` | 由 DevEco 管理 |
| `DEVECO_SDK_HOME` | 指向 DevEco 的 `sdk/` 目录 | `run-harmony` 读取 |

---

## 目录结构

```
apps/mobile/
├── index.js                          RN 入口，注册组件名 "mobile"
├── App.tsx                           根组件（当前为模板页）
├── app.json                          RN 应用名 {"name": "mobile"}
├── metro.config.js                   monorepo 符号链接 + 鸿蒙 platform 配置
├── babel.config.js
├── tsconfig.json                     含 @neo-tavern/* 路径别名
├── android/                          Android 原生工程
│   ├── app/src/main/java/com/whaleplay/mobile/
│   │   ├── MainActivity.kt
│   │   └── MainApplication.kt
│   ├── app/build.gradle              react { } 块，autolinkLibrariesWithApp()
│   └── gradle.properties             newArchEnabled=true, hermesEnabled=true
├── harmony/                          ⏳ 待 init-harmony 生成
└── README.md                         本文件
```

---

## 运行命令

从 monorepo 根目录：

```bash
# 启动 Metro（终端常驻）
pnpm --filter @neo-tavern/mobile start

# 构建并部署到 Android 真机（需先 adb 连接 + 授权）
pnpm mobile android

# 仅构建 debug APK（不部署）
cd apps/mobile/android && ./gradlew :app:assembleDebug
```

`pnpm mobile android` 等价于 `react-native run-android`：它会先确保 Metro 在跑，再编译安装 APK 并启动 App。

### Android 真机连接

1. 手机开启「开发者选项」→「USB 调试」。
2. USB 连接电脑，手机弹窗点「允许调试」。
3. `adb devices` 应显示设备且非 `unauthorized`。
4. `pnpm mobile android`。

### 清缓存

构建遇到奇怪问题时按需执行：

```bash
# 清 Gradle 缓存
cd apps/mobile/android && ./gradlew clean

# 清 Metro / Watchman 缓存
cd apps/mobile && npx react-native start --reset-cache

# 彻底清 Android build 产物
rm -rf apps/mobile/android/app/build apps/mobile/android/build apps/mobile/android/.gradle
```

---

## 鸿蒙（HarmonyOS NEXT）桥接计划

RNOH（React Native OpenHarmony）让**同一套 `App.tsx` + `index.js`** 同时跑在 Android 和 HarmonyOS 上，无需平台入口分支。

### 已就位

- `metro.config.js` 已合并 `createHarmonyMetroConfig`（注册 `harmony` platform + 模块替换）。
- `package.json` 有 `"harmony": "react-native bundle-harmony"` 脚本。
- 依赖已安装：`@react-native-oh/react-native-harmony`、`@react-native-oh/react-native-harmony-cli`、`@react-native-ohos/react-native-safe-area-context`。

### 待执行（Android 验证通过后）

1. 安装 DevEco Studio 6.x，设置 `DEVECO_SDK_HOME`。
2. 生成鸿蒙原生工程：

   ```bash
   cd apps/mobile
   npx react-native init-harmony --bundle-name com.whaleplay.mobile
   ```

   这会在 `apps/mobile/harmony/` 下生成 ArkTS + C++ 工程（`EntryAbility.ets`、`Index.ets`、`CMakeLists.txt` 等）。`appKey` 会自动匹配 `index.js` 里注册的 `"mobile"`。

3. 用 DevEco Studio 打开 `apps/mobile/harmony/`，完成签名（File → Project Structure → Signing Configs → 自动生成），run `entry` 到鸿蒙真机。

### Android / 鸿蒙差异要点

- JS 完全共享；原生模块需要鸿蒙 port（纯 JS 库直接可用）。
- `bundle-harmony` 产出到 `harmony/entry/src/main/resources/rawfile/bundle.harmony.js`（dev 模式下设备从 Metro 拉取，无需预打包）。
- `Platform.OS === 'harmony'` 可做平台判断。

### 参考文档

- RNOH 主仓库：`gitee.com/rnoh/rnoh`
- 第三方库适配文档：`gitee.com/react-native-oh-library/usage-docs`
- RNOH 英文 codelab：`docs.oniroproject.org`（Oniro Project）
