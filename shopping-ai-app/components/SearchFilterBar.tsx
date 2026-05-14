import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import type { FilterCondition } from "@/types/product";
import { blurActiveElementOnWeb } from "@/utils/webFocus";

type Props = {
  loading?: boolean;
  condition?: FilterCondition;
  onSubmit: (text: string) => void;
};

export function SearchFilterBar({ loading, condition, onSubmit }: Props) {
  const [text, setText] = useState("");
  const submit = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    blurActiveElementOnWeb();
    onSubmit(trimmed);
  };
  const chips = [
    condition?.max_price ? `¥${condition.max_price}以内` : undefined,
    condition?.shop_type === "official" ? "只看旗舰店" : undefined,
    condition?.sort_by === "price_asc" ? "价格从低到高" : undefined,
    ...(condition?.platforms ?? []),
  ].filter(Boolean);

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>AI 智能筛选</Text>
      <View style={styles.inputRow}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="例如：只看旗舰店，价格低一点"
          placeholderTextColor="#9aa4b2"
          style={styles.input}
          returnKeyType="send"
          onSubmitEditing={() => submit(text)}
        />
        <Pressable
          style={[styles.button, !text.trim() && styles.buttonDisabled]}
          disabled={!text.trim() || loading}
          onPress={() => submit(text)}
        >
          {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.buttonText}>发送</Text>}
        </Pressable>
      </View>
      {chips.length ? (
        <View style={styles.chips}>
          {chips.map((chip) => (
            <Text key={chip} style={styles.chip}>
              {chip}
            </Text>
          ))}
        </View>
      ) : (
        <View style={styles.quick}>
          {["便宜一点", "只看旗舰店", "预算2000以内"].map((item) => (
            <Pressable key={item} onPress={() => submit(item)}>
              <Text style={styles.quickChip}>{item}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e8eefb",
  },
  label: {
    color: "#1f2937",
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 9,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#c9d8f7",
    borderRadius: 20,
    paddingLeft: 12,
    backgroundColor: "#fbfdff",
  },
  input: {
    flex: 1,
    height: 40,
    color: "#111827",
    fontSize: 14,
  },
  button: {
    height: 34,
    minWidth: 62,
    borderRadius: 17,
    backgroundColor: "#2f6df6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 3,
  },
  buttonDisabled: {
    backgroundColor: "#a7bdf5",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 13,
  },
  quick: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 10,
  },
  quickChip: {
    backgroundColor: "#eef4ff",
    color: "#2f6df6",
    borderRadius: 13,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 12,
    fontWeight: "700",
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 10,
  },
  chip: {
    backgroundColor: "#edf7f0",
    color: "#16803c",
    borderRadius: 13,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 12,
    fontWeight: "700",
  },
});
