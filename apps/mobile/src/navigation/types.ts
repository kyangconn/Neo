/**
 * @mobile/navigation/types
 *
 * React Navigation 路由参数类型定义。
 * 所有 screen 的路由参数在此集中声明，保障类型安全。
 */

import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import type { CompositeScreenProps, NavigatorScreenParams } from "@react-navigation/native";

// ── Root Tab ──────────────────────────────────────

export type RootTabParamList = {
  HomeTab: NavigatorScreenParams<HomeStackParamList>;
  ChatTab: NavigatorScreenParams<ChatStackParamList>;
  SettingsTab: NavigatorScreenParams<SettingsStackParamList>;
};

// ── Home Stack ─────────────────────────────────────

export type HomeStackParamList = {
  CharacterList: undefined;
  CharacterDetail: { characterId: string };
  Builder: undefined;
  Agentic: { characterId?: string };
};

// ── Chat Stack ─────────────────────────────────────

export type ChatStackParamList = {
  ChatMain: undefined;
  Agentic: { characterId?: string };
};

// ── Settings Stack ─────────────────────────────────

export type SettingsStackParamList = {
  SettingsMain: undefined;
  About: undefined;
};

// ── Screen props helpers ──────────────────────────

export type HomeTabScreenProps = CompositeScreenProps<
  BottomTabScreenProps<RootTabParamList, "HomeTab">,
  NativeStackScreenProps<RootTabParamList>
>;

export type ChatTabScreenProps = CompositeScreenProps<
  BottomTabScreenProps<RootTabParamList, "ChatTab">,
  NativeStackScreenProps<RootTabParamList>
>;

export type SettingsTabScreenProps = CompositeScreenProps<
  BottomTabScreenProps<RootTabParamList, "SettingsTab">,
  NativeStackScreenProps<RootTabParamList>
>;
