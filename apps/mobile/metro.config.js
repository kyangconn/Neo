const path = require('path');
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const { createHarmonyMetroConfig } = require('@react-native-oh/react-native-harmony/metro.config');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const defaultConfig = getDefaultConfig(__dirname);

// monorepo 里 desktop 用 react@^19.2.7、mobile 用 react@19.2.3，两份 React 会同时进 bundle，
// 导致鸿蒙端 React hooks 报错（invalid hook call / useContext of null）。用 extraNodeModules
// 把 react / react-native 及其子路径锁到 mobile 自己的副本，保证 bundle 里只有一份 React。
const mobileNodeModules = path.resolve(projectRoot, 'node_modules');
const extraNodeModules = {
  react: path.resolve(mobileNodeModules, 'react'),
  'react-native': path.resolve(mobileNodeModules, 'react-native'),
  'react/jsx-runtime': path.resolve(mobileNodeModules, 'react/jsx-runtime'),
};

// RNOH 0.84.1 的 metro.config 在 harmony 平台的最终回退里只用了单平台解析
// (ctx.resolveRequest(ctx, moduleName, 'harmony'))，没有像它自己的
// resolveWithHarmonyFallback 那样回退到 'ios'。导致 react-native 内部用相对路径
// 引入的、只带 .android.js/.ios.js 扩展名的模块（例如 0.84 新增的
// src/private/devsupport/rndevtools/ReactDevToolsSettingsManager）在 harmony 上解析失败。
// 这里包一层 resolveRequest：harmony 解析失败时，对 react-native 包内的相对路径
// 导入回退到 RNOH 约定的 fallback 平台 'ios'。
const harmonyConfig = createHarmonyMetroConfig({
  reactNativeHarmonyPackageName: '@react-native-oh/react-native-harmony',
});
const harmonyResolveRequest = harmonyConfig.resolver?.resolveRequest;
const REACT_NATIVE_SEGMENT = `${path.sep}node_modules${path.sep}react-native${path.sep}`;
// 锁定 React：裸导入 react / react/* 一律指向 mobile 自己的 react@19.2.3，
// 避免 monorepo 里 desktop 的 react@19.2.7 通过 pnpm store 符号链接被一起打包，
// 造成两份 React / hooks 报错。
const MOBILE_REACT_DIR = path.resolve(mobileNodeModules, 'react');
function isReactBareImport(moduleName) {
  return moduleName === 'react' || moduleName.startsWith('react/');
}
function resolveRequest(context, moduleName, platform) {
  // 必须最先处理，在 RNOH 与默认解析之前把 React 钉死到 mobile 副本。
  if (isReactBareImport(moduleName)) {
    return context.resolveRequest(
      context,
      path.join(MOBILE_REACT_DIR, moduleName.slice('react'.length)),
      platform,
    );
  }
  if (platform !== 'harmony' || typeof harmonyResolveRequest !== 'function') {
    return harmonyResolveRequest
      ? harmonyResolveRequest(context, moduleName, platform)
      : context.resolveRequest(context, moduleName, platform);
  }
  try {
    return harmonyResolveRequest(context, moduleName, platform);
  } catch (_err) {
    // 只对 react-native 包内部的相对路径导入做平台回退，避免误伤业务代码。
    const fromReactNative =
      (moduleName.startsWith('.') || moduleName.startsWith('..')) &&
      typeof context.originModulePath === 'string' &&
      context.originModulePath.includes(REACT_NATIVE_SEGMENT);
    if (fromReactNative) {
      return context.resolveRequest(context, moduleName, 'ios');
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
  watchFolders: [workspaceRoot],
  resolver: {
    ...defaultConfig.resolver,
    unstable_enableSymlinks: true,
    unstable_enablePackageExports: true,
    nodeModulesPaths: [
      path.resolve(projectRoot, 'node_modules'),
      path.resolve(workspaceRoot, 'node_modules'),
    ],
    extraNodeModules,
    // 排除 desktop app、构建产物、.pnpm-store 等，加速 Metro 启动并避免误打包 desktop 依赖。
    blockList: [
      /apps[\\/]desktop[\\/]/,
      /apps[\\/]mobile[\\/]android[\\/](?:build|\.gradle|\.cxx)[\\/]/,
      /apps[\\/]mobile[\\/]harmony[\\/](?:build|\.hvigor|\.cxx|oh_modules)[\\/]/,
      /apps[\\/]mobile[\\/]ios[\\/]/,
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
      const harmonyModules = harmonyRunBeforeMain
        ? harmonyRunBeforeMain()
        : [];
      if (harmonyModules.length > 0) {
        return harmonyModules;
      }
      return defaultRunBeforeMain ? defaultRunBeforeMain() : [];
    },
  },
};

module.exports = mergeConfig(defaultConfig, config);
