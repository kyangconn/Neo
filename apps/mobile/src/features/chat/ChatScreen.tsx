/**
 * 聊天主界面（Chat Tab 首页）。
 */

import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function ChatScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>聊天</Text>
      <Text style={styles.hint}>选择角色后开始对话（待实现）</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", gap: 8 },
  title: { fontSize: 20, fontWeight: "600" },
  hint: { fontSize: 14, color: "#888" },
});
