/**
 * Whale Play 移动端 — 根组件。
 *
 * 启动顺序：initStorage → AppProviders（含导航）。
 */

import { useEffect, useState } from "react";
import { StatusBar, useColorScheme } from "react-native";
import { initStorage, createNamespacedStorage, NAMESPACE_CONNECTION } from "./src/storage";
import AppProviders from "./src/app/providers/AppProviders";

function App() {
  const isDarkMode = useColorScheme() === "dark";
  const [ready, setReady] = useState(false);

  useEffect(() => {
    initStorage();
    const conn = createNamespacedStorage(NAMESPACE_CONNECTION);
    conn.get<string>("baseUrl" as never).then((v) => {
      console.log("[app] storage ready. baseUrl:", v ?? "(not set)");
      setReady(true);
    });
  }, []);

  if (!ready) {
    // 存储未就绪时不渲染 UI，避免 zustand persist hydration 竞态。
    return <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />;
  }

  return (
    <>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
      <AppProviders />
    </>
  );
}

export default App;
