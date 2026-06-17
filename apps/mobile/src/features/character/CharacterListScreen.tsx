/**
 * 角色列表页（Home Tab 首页）。
 *
 * 后续内容:
 * - 角色卡片 grid / list
 * - 创建角色入口
 * - 最近聊天快捷跳转
 */

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { HomeStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<HomeStackParamList, "CharacterList">;

export default function CharacterListScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Whale Play</Text>
      <Text style={styles.subtitle}>角色列表（待实现）</Text>
      <Text style={styles.hint} onPress={() => navigation.navigate("Builder")}>
        → Whale Builder
      </Text>
      <Text style={styles.hint} onPress={() => navigation.navigate("Agentic", {})}>
        → Agentic Play
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12 },
  title: { fontSize: 24, fontWeight: "700" },
  subtitle: { fontSize: 14, color: "#888" },
  hint: { fontSize: 14, color: "#4A90D9", marginTop: 8 },
});
