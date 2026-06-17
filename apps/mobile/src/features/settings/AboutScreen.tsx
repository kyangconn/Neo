/**
 * 关于页面。
 */

import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function AboutScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Whale Play</Text>
      <Text style={styles.version}>移动端 v0.0.1</Text>
      <Text style={styles.desc}>角色创作与角色扮演聊天</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", gap: 8 },
  title: { fontSize: 24, fontWeight: "700" },
  version: { fontSize: 14, color: "#888" },
  desc: { fontSize: 14, color: "#666", marginTop: 4 },
});
