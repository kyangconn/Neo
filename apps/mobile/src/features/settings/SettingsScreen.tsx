/**
 * 设置主页（Settings Tab 首页）。
 */

import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { SettingsStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<SettingsStackParamList, "SettingsMain">;

export default function SettingsScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>设置</Text>
      <Text style={styles.hint}>API Key / 模型配置 / 偏好（待实现）</Text>
      <TouchableOpacity onPress={() => navigation.navigate("About")}>
        <Text style={styles.link}>关于</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12 },
  title: { fontSize: 20, fontWeight: "600" },
  hint: { fontSize: 14, color: "#888" },
  link: { fontSize: 16, color: "#4A90D9", marginTop: 8 },
});
