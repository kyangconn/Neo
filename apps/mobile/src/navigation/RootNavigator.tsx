/**
 * @mobile/navigation
 *
 * 根导航器：Bottom Tabs（Home / Chat / Settings）内嵌 Native Stack。
 *
 * Android: native-stack → react-native-screens（原生屏幕动画）
 * 鸿蒙:   enableScreens(false) → JS View 降级（ArkUI C-API 未就绪）
 */

import React from "react";
import { Text } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import type { RootTabParamList, HomeStackParamList, ChatStackParamList, SettingsStackParamList } from "./types";

import CharacterListScreen from "../features/character/CharacterListScreen";
import CharacterDetailScreen from "../features/character/CharacterDetailScreen";
import BuilderScreen from "../features/builder/BuilderScreen";
import AgenticScreen from "../features/agentic/AgenticScreen";
import ChatScreen from "../features/chat/ChatScreen";
import SettingsScreen from "../features/settings/SettingsScreen";
import AboutScreen from "../features/settings/AboutScreen";

// ── Stack navigators ─────────────────────────────

const HomeStack = createNativeStackNavigator<HomeStackParamList>();

function HomeStackNavigator() {
  return (
    <HomeStack.Navigator>
      <HomeStack.Screen name="CharacterList" component={CharacterListScreen} options={{ title: "角色" }} />
      <HomeStack.Screen name="CharacterDetail" component={CharacterDetailScreen} options={{ title: "角色详情" }} />
      <HomeStack.Screen name="Builder" component={BuilderScreen} options={{ title: "Whale Builder" }} />
      <HomeStack.Screen name="Agentic" component={AgenticScreen} options={{ title: "Agentic Play" }} />
    </HomeStack.Navigator>
  );
}

const ChatStack = createNativeStackNavigator<ChatStackParamList>();

function ChatStackNavigator() {
  return (
    <ChatStack.Navigator>
      <ChatStack.Screen name="ChatMain" component={ChatScreen} options={{ title: "聊天" }} />
      <ChatStack.Screen name="Agentic" component={AgenticScreen} options={{ title: "Agentic Play" }} />
    </ChatStack.Navigator>
  );
}

const SettingsStack = createNativeStackNavigator<SettingsStackParamList>();

function SettingsStackNavigator() {
  return (
    <SettingsStack.Navigator>
      <SettingsStack.Screen name="SettingsMain" component={SettingsScreen} options={{ title: "设置" }} />
      <SettingsStack.Screen name="About" component={AboutScreen} options={{ title: "关于" }} />
    </SettingsStack.Navigator>
  );
}

// ── Tab navigator ────────────────────────────────

const Tab = createBottomTabNavigator<RootTabParamList>();

/**
 * 简易图标（纯文字 fallback）。后续切 react-native-vector-icons 或自定义 SVG。
 */
function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  return <Text style={{ fontSize: 18, opacity: focused ? 1 : 0.5 }}>{label}</Text>;
}

export default function RootNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false, // 各 Stack 内部有自己的 header
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStackNavigator}
        options={{
          tabBarLabel: "角色",
          tabBarIcon: ({ focused }) => <TabIcon label="🎭" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="ChatTab"
        component={ChatStackNavigator}
        options={{
          tabBarLabel: "聊天",
          tabBarIcon: ({ focused }) => <TabIcon label="💬" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="SettingsTab"
        component={SettingsStackNavigator}
        options={{
          tabBarLabel: "设置",
          tabBarIcon: ({ focused }) => <TabIcon label="⚙️" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}
