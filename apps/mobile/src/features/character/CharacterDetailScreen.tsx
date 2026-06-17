/**
 * 角色详情页。
 */

import React from "react";
import { View, Text } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { HomeStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<HomeStackParamList, "CharacterDetail">;

export default function CharacterDetailScreen({ route }: Props) {
  return (
    <View style={styles.container}>
      <Text>角色详情 — {route.params.characterId}</Text>
      <Text style={styles.hint}>待实现</Text>
    </View>
  );
}

import { StyleSheet } from "react-native";
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  hint: { fontSize: 12, color: "#888", marginTop: 8 },
});
