/**
 * Whale Builder 页面。
 * 通过聊天对话，让 AI 引导完成角色卡创作。
 */

import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function BuilderScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Whale Builder</Text>
      <Text style={styles.hint}>AI 引导式角色卡创作（待实现）</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", gap: 8 },
  title: { fontSize: 20, fontWeight: "600" },
  hint: { fontSize: 14, color: "#888" },
});
