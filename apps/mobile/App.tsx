/**
 * Whale Play 移动端 — 根组件。
 *
 * 启动顺序：initStorage → Providers → 首页。
 *
 * 后续步骤：
 * 1. 替换 NewAppScreen 为 RootNavigator（React Navigation）。
 * 2. 在 RootNavigator 中接入 features/ 的各个 screen。
 */

import { useEffect, useState } from 'react';
import { NewAppScreen } from '@react-native/new-app-screen';
import { StatusBar, StyleSheet, useColorScheme, View, Text } from 'react-native';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { initStorage, createNamespacedStorage, NAMESPACE_CONNECTION } from './src/storage';

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <AppContent />
    </SafeAreaProvider>
  );
}

function AppContent() {
  const safeAreaInsets = useSafeAreaInsets();
  const [storageReady, setStorageReady] = useState(false);

  useEffect(() => {
    // 启动时初始化 KV 存储。
    // 真机/模拟器走 AsyncStorage（Android SQLite / 鸿蒙 Preferences）。
    // 测试环境可注入 MemoryKVAdapter：initStorage(new MemoryKVAdapter()).
    initStorage();
    // 验证存储可读写（启动日志，后续移除）。
    const conn = createNamespacedStorage(NAMESPACE_CONNECTION);
    conn.get<string>('baseUrl' as never).then((v) => {
      console.log('[app] storage initialized. current baseUrl:', v ?? '(not set)');
      setStorageReady(true);
    });
  }, []);

  return (
    <View style={styles.container}>
      <NewAppScreen
        templateFileName="App.tsx"
        safeAreaInsets={safeAreaInsets}
      />
      {/* storage 就绪标记（仅供开发验证，后续删） */}
      <Text style={[styles.status, storageReady ? styles.ready : styles.pending]}>
        {storageReady ? 'KV ready' : 'initializing...'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  status: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    fontSize: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    overflow: 'hidden',
  },
  ready: {
    backgroundColor: 'rgba(45, 164, 78, 0.85)',
    color: '#fff',
  },
  pending: {
    backgroundColor: 'rgba(212, 167, 44, 0.85)',
    color: '#fff',
  },
});

export default App;
