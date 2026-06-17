/**
 * @mobile/app/providers
 *
 * 全局 Provider 层。
 * 启动顺序: initStorage → SafeArea → Navigation → App。
 */

import React, { useEffect } from "react";
import { Platform } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { enableScreens } from "react-native-screens";

import RootNavigator from "../../navigation/RootNavigator";

/**
 * 鸿蒙: ArkUI 未提供 C-API → 原生屏幕容器不可用 → 关闭原生屏幕切换，降级到 JS View。
 * Android: 原生屏幕正常启用。
 * 未来鸿蒙 port 就绪后删除即可。
 */
// Platform.OS === 'harmony' 运行时由 RNOH 返回，标准 RN 的 TS 类型未包含。
if ((Platform.OS as string) === "harmony") {
  enableScreens(false);
}

interface AppProvidersProps {
  children?: React.ReactNode;
}

export default function AppProviders({ children }: AppProvidersProps) {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <RootNavigator />
        {children}
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
