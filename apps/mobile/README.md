# Whale Play 移动端（`apps/mobile`）

Whale Play 的 React Native 移动端工程骨架。本分支（`feat/mobile-app`）**只负责移动端工程搭建、能跑起来连接到真机**；同步协议、共享逻辑收口等由桌面端 `dev` 主线推进，完成后 merge 进来再做具体 UI 与功能（见根目录 `todo.md` 的「分支协作」与「实现阶段」）。

---

## 当前状态

| 模块         | 状态 | 说明                                                                                          |
| ------------ | ---- | --------------------------------------------------------------------------------------------- |
| 工程配置     | ✅   | `package.json` / `metro.config.js` / `babel.config.js` / `tsconfig.json`，已接入 pnpm workspace |
| Android 原生 | ✅   | `MainActivity.kt` / `MainApplication.kt` 已补齐，`./gradlew :app:assembleDebug` 通过          |
| Android 真机 | ✅   | APK 构建 + Metro JS bundle 均通过；`pnpm mobile android` 可部署到真机                          |
| 鸿蒙原生     | ✅   | `harmony/` 工程已由 `init-harmony` 生成；`bundle-harmony` 产出通过；DevEco Studio 打开即可构建 |
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

### HarmonyOS

| 工具 | 版本 | 说明 |
| --- | --- | --- |
| DevEco Studio | 6.x（本机 6.1.1.280） | 需 API 20+ SDK；5.x 只到 API 15，不满足 RNOH 0.84 target |
| HarmonyOS SDK | compatibleSdk `5.0.0(12)`、target `6.0.0(20)`（本机装了 API 23） | 由 DevEco 管理 |
| `DEVECO_SDK_HOME` | 指向 SDK 目录 | `react-native run-harmony` 需要；DevEco Studio GUI 构建不强制 |

> ⚠️ Node 24 兼容性：RNOH CLI 0.84.1 的 `RealFS.js` 用了 Node 24 已删除的 `Dirent.path`（改名为 `parentPath`）。本仓库已通过 `pnpm patch` 持久化修复（见 `patches/@react-native-oh__react-native-harmony-cli@0.84.1.patch`）。

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
├── harmony/                          鸿蒙原生工程（ArkTS + C++）
│   ├── entry/src/main/ets/pages/Index.ets   RNApp，appKey="mobile"
│   ├── entry/src/main/cpp/CMakeLists.txt
│   ├── build-profile.json5            compatibleSdk 12 / targetSdk 20
│   └── oh-package.json5               引用 @rnoh/react-native-openharmony
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

## 鸿蒙（HarmonyOS NEXT）桥接

RNOH（React Native OpenHarmony）让**同一套 `App.tsx` + `index.js`** 同时跑在 Android 和 HarmonyOS 上，无需平台入口分支。鸿蒙工程已生成。

### 生成命令（已完成，仅记录）

> `init-harmony` 是一次性脚手架命令，已执行过，正常开发无需重跑。

```bash
cd apps/mobile
pnpm react-native init-harmony --bundle-name com.whaleplay.mobile --app-name "WhalePlay"
```

关键点：
- **不要**传 `--project-root-path harmony`。该参数指「项目根」（`package.json`/`node_modules` 所在目录），默认 `.`（即 `apps/mobile`）就对了；`harmony/` 输出目录是 CLI 自动拼的。
- **不要**传 `--app-name` 给 `appKey` 用——`appKey` 必须等于 `index.js` 里 `AppRegistry.registerComponent` 的名字（`"mobile"`，来自 `app.json`）。本仓库 `Index.ets` 已手动改回 `appKey: "mobile"`，否则鸿蒙端白屏。

### 在 DevEco Studio 中运行

1. 启动 Metro：`pnpm --filter @neo-tavern/mobile start`。
2. 用 DevEco Studio 打开 `apps/mobile/harmony/`，等待后台 sync / autolinking 完成（会生成 `RNOHPackagesFactory.ets`、`autolinking.cmake` 等）。
3. File → Project Structure → Signing Configs → 勾选「Automatically generate signature」→ OK。
4. 顶部选 `entry` run 配置，点 Debug/Run 部署到鸿蒙真机。

### JS bundle

```bash
# 预打包 release bundle（dev 模式下设备从 Metro 实时拉取，无需预打包）
pnpm --filter @neo-tavern/mobile harmony
```

产出到 `harmony/entry/src/main/resources/rawfile/bundle.harmony.js`。

### Android / 鸿蒙差异要点

- JS 完全共享；原生模块需要鸿蒙 port（纯 JS 库直接可用）。当前 `react-native-safe-area-context` 已装鸿蒙 port `@react-native-ohos/react-native-safe-area-context`。
- `Platform.OS === 'harmony'` 可做平台判断。

### 参考文档

- RNOH 主仓库：`gitee.com/rnoh/rnoh`
- 第三方库适配文档：`gitee.com/react-native-oh-library/usage-docs`
- RNOH 英文 codelab：`docs.oniroproject.org`（Oniro Project）
