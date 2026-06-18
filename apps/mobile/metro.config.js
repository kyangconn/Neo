const path = require("path");
const { getDefaultConfig, mergeConfig } = require("@react-native/metro-config");
const { createHarmonyMetroConfig } = require("@react-native-oh/react-native-harmony/metro.config");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const defaultConfig = getDefaultConfig(__dirname);

// monorepo 里 desktop 用 react@^19.2.7、mobile 用 react@19.2.3，两份 React 会同时进 bundle，
// 导致鸿蒙端 React hooks 报错（invalid hook call / useContext of null）。用 extraNodeModules
// 把 react / react-native 及其子路径锁到 mobile 自己的副本，保证 bundle 里只有一份 React。
const mobileNodeModules = path.resolve(projectRoot, "node_modules");
const extraNodeModules = {
  react: path.resolve(mobileNodeModules, "react"),
  "react-native": path.resolve(mobileNodeModules, "react-native"),
  "react/jsx-runtime": path.resolve(mobileNodeModules, "react/jsx-runtime"),
};

// RNOH 0.84.1 的 metro.config 在 harmony 平台的最终回退里只用了单平台解析
// (ctx.resolveRequest(ctx, moduleName, 'harmony'))，没有像它自己的
// resolveWithHarmonyFallback 那样回退到 'ios'。导致 react-native 内部用相对路径
// 引入的、只带 .android.js/.ios.js 扩展名的模块（例如 0.84 新增的
// src/private/devsupport/rndevtools/ReactDevToolsSettingsManager）在 harmony 上解析失败。
// 这里包一层 resolveRequest：harmony 解析失败时，对 react-native 包内的相对路径
// 导入回退到 RNOH 约定的 fallback 平台 'ios'。
const harmonyConfig = createHarmonyMetroConfig({
  reactNativeHarmonyPackageName: "@react-native-oh/react-native-harmony",
});
const harmonyResolveRequest = harmonyConfig.resolver?.resolveRequest;
const REACT_NATIVE_SEGMENT = `${path.sep}node_modules${path.sep}react-native${path.sep}`;
// 锁定 React：裸导入 react / react/* 一律指向 mobile 自己的 react@19.2.3，
// 避免 monorepo 里 desktop 的 react@19.2.7 通过 pnpm store 符号链接被一起打包，
// 造成两份 React / hooks 报错。
const MOBILE_REACT_DIR = path.resolve(mobileNodeModules, "react");
// 鸿蒙 port 的 react-native-screens 硬依赖 gesture-handler，
// 但 enableScreens(false) 降级 JS View 后该代码路径是死代码，不需要真实实现。
// 用 mock 填坑，避免装不必要的 native 依赖。
const GESTURE_HANDLER_MOCK = path.resolve(__dirname, "src/mocks/noop.js");
const SCREENS_OHOS_SEGMENT = `${path.sep}@react-native-ohos${path.sep}react-native-screens${path.sep}`;
function isReactBareImport(moduleName) {
  return moduleName === "react" || moduleName.startsWith("react/");
}
function resolveRequest(context, moduleName, platform) {
  // 鸿蒙: react-native-screens OHOS port 硬依赖 gesture-handler / reanimated，
  // 但 enableScreens(false) 降级 JS View 后该代码路径是死代码，mock 掉。
  if (
    platform === "harmony" &&
    (moduleName === "react-native-gesture-handler" || moduleName === "react-native-reanimated") &&
    typeof context.originModulePath === "string" &&
    context.originModulePath.includes(SCREENS_OHOS_SEGMENT)
  ) {
    return context.resolveRequest(context, GESTURE_HANDLER_MOCK, platform);
  }
  // 必须最先处理，在 RNOH 与默认解析之前把 React 钉死到 mobile 副本。
  if (isReactBareImport(moduleName)) {
    return context.resolveRequest(context, path.join(MOBILE_REACT_DIR, moduleName.slice("react".length)), platform);
  }
  if (platform !== "harmony" || typeof harmonyResolveRequest !== "function") {
    return harmonyResolveRequest
      ? harmonyResolveRequest(context, moduleName, platform)
      : context.resolveRequest(context, moduleName, platform);
  }
  try {
    return harmonyResolveRequest(context, moduleName, platform);
  } catch (_err) {
    // 只对 react-native 包内部的相对路径导入做平台回退，避免误伤业务代码。
    const fromReactNative =
      (moduleName.startsWith(".") || moduleName.startsWith("..")) &&
      typeof context.originModulePath === "string" &&
      context.originModulePath.includes(REACT_NATIVE_SEGMENT);
    if (fromReactNative) {
      return context.resolveRequest(context, moduleName, "ios");
    }
    throw _err;
  }
}

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
// 默认配置会在主模块前运行 InitializeCore（设置 global/window 等全局）。
// RNOH 的 getModulesRunBeforeMainModule 只在 harmony 平台返回 [InitializeCore]，
// 其他平台返回 []，会丢掉 InitializeCore 导致 global.window 未定义（Android 报
// ReferenceError: Property 'window' doesn't exist）。这里合并：harmony 用 RNOH 的
// InitializeCore，其他平台回退到默认的 InitializeCore。
const harmonyRunBeforeMain = harmonyConfig.serializer?.getModulesRunBeforeMainModule;
const defaultRunBeforeMain = defaultConfig.serializer?.getModulesRunBeforeMainModule;
const config = {
  projectRoot,
  // pnpm stores the real package files under the workspace-level node_modules/.pnpm
  // directory. Metro must be able to see those symlink targets, so the workspace
  // root stays in watchFolders; resolver.blockList below keeps native/build
  // directories from participating in the live file map.
  watchFolders: [workspaceRoot],
  resolver: {
    ...defaultConfig.resolver,
    unstable_enableSymlinks: true,
    unstable_enablePackageExports: true,
    nodeModulesPaths: [path.resolve(projectRoot, "node_modules"), path.resolve(workspaceRoot, "node_modules")],
    extraNodeModules,
    // 排除原生工程和构建产物，避免 Gradle/Hvigor 写文件时触发 Metro 重扫或退出。
    // 不要在这里排除 node_modules：pnpm 依赖通过 symlink 解析，Metro 仍需要能读取依赖文件。
    blockList: [
      /apps[\\/]desktop[\\/]/,
      /apps[\\/]mobile[\\/]android[\\/]/,
      /apps[\\/]mobile[\\/]harmony[\\/]/,
      /apps[\\/]mobile[\\/]ios[\\/]/,
      /apps[\\/]mobile[\\/]__tests__[\\/]/,
      /apps[\\/]mobile[\\/]\.bundle[\\/]/,
      /apps[\\/]mobile[\\/]dist[\\/]/,
      /[\\/]node_modules[\\/]\.pnpm[\\/].*[\\/](?:android|ios|\.gradle|\.cxx|oh_modules)[\\/]/,
      /\.pnpm-store[\\/]/,
      /[\\/]src-tauri[\\/]target[\\/]/,
      /docs[\\/]/,
    ],
    // RNOH 的 serializer 也用到 REQUEST_RESOLUTION_LATEST_PLATFORM 副作用，
    // 所以即便在非 harmony 平台也必须经过 harmonyResolveRequest。
    resolveRequest,
  },
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
  },
  serializer: {
    getModulesRunBeforeMainModule: () => {
      const harmonyModules = harmonyRunBeforeMain ? harmonyRunBeforeMain() : [];
      if (harmonyModules.length > 0) {
        return harmonyModules;
      }
      return defaultRunBeforeMain ? defaultRunBeforeMain() : [];
    },
  },
};

module.exports = mergeConfig(defaultConfig, config);
