/**
 * Agentic Play 页面。
 * AI 当主持人，推剧情 + 掷骰 + 行动选项。
 */

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { HomeStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<HomeStackParamList, "Agentic">;

export default function AgenticScreen({ route }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Agentic Play</Text>
      {route.params.characterId && <Text style={styles.hint}>角色: {route.params.characterId}</Text>}
      <Text style={styles.hint}>AI 主持人模式（待实现）</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", gap: 8 },
  title: { fontSize: 20, fontWeight: "600" },
  hint: { fontSize: 14, color: "#888" },
});
