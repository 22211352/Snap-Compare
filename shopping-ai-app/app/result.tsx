import { FlatList, Image, Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { ProductCard } from "@/components/ProductCard";
import { SearchFilterBar } from "@/components/SearchFilterBar";
import { useProductStore } from "@/store/productStore";
import type { Product } from "@/types/product";
import { blurActiveElementOnWeb } from "@/utils/webFocus";

export default function ResultScreen() {
  const { upload, recognized, products, loading, filterCondition, applyFilter, error } = useProductStore();
  const navigate = (href: Parameters<typeof router.push>[0]) => {
    blurActiveElementOnWeb();
    router.push(href);
  };

  const header = (
    <>
      <View style={styles.topCard}>
        <Image source={{ uri: upload?.image_url }} style={styles.recognizedImage} />
        <View style={styles.recognizedInfo}>
          <Text style={styles.badge}>识别结果</Text>
          <Text style={styles.name} numberOfLines={2}>
            {recognized ? `${recognized.brand ?? ""} ${recognized.color ?? ""} ${recognized.category}` : "等待识别结果"}
          </Text>
          <Text style={styles.meta}>品牌：{recognized?.brand ?? "未知"}</Text>
          <Text style={styles.meta}>颜色：{recognized?.color ?? "未知"} · 类型：{recognized?.style ?? recognized?.category ?? "未知"}</Text>
          <Text style={styles.keyword} numberOfLines={1}>
            关键词：{recognized?.keywords.join(" / ") ?? "-"}
          </Text>
        </View>
      </View>

      {recognized ? (
        <View style={styles.debugCard}>
          <View style={styles.debugRow}>
            <Text style={styles.debugLabel}>Provider</Text>
            <Text style={styles.debugValue}>{recognized.provider}</Text>
          </View>
          <View style={styles.debugRow}>
            <Text style={styles.debugLabel}>Mode</Text>
            <Text style={[styles.debugValue, recognized.is_mock ? styles.mockText : styles.realText]}>
              {recognized.is_mock ? "Mock" : "Real Gemini"}
            </Text>
          </View>
          {recognized.fallback_reason ? (
            <Text style={styles.fallbackText}>Fallback: {recognized.fallback_reason}</Text>
          ) : (
            <Text style={styles.noFallbackText}>Fallback: none</Text>
          )}
        </View>
      ) : null}

      <SearchFilterBar loading={loading} condition={filterCondition} onSubmit={applyFilter} />
      <View style={styles.listTitleRow}>
        <Text style={styles.listTitle}>为你推荐 ({products.length})</Text>
        <Text style={styles.sortText}>综合排序</Text>
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable
          onPress={() => {
            blurActiveElementOnWeb();
            router.back();
          }}
        >
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <Text style={styles.title}>识别结果</Text>
        <Pressable onPress={() => navigate("/history")}>
          <Text style={styles.history}>历史</Text>
        </Pressable>
      </View>
      <FlatList<Product>
        data={products}
        keyExtractor={(item) => String(item.id)}
        ListHeaderComponent={header}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => <ProductCard product={item} onPress={() => navigate(`/detail/${item.id}`)} />}
        ListEmptyComponent={<Text style={styles.empty}>暂无商品结果，请返回重新识别。</Text>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f8fbff" },
  header: { height: 54, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  back: { fontSize: 34, color: "#111827" },
  title: { fontSize: 17, fontWeight: "900", color: "#111827" },
  history: { color: "#2f6df6", fontWeight: "800" },
  list: { paddingBottom: 24, paddingHorizontal: 16 },
  topCard: { flexDirection: "row", backgroundColor: "#fff", borderRadius: 18, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: "#edf1f8" },
  recognizedImage: { width: 126, height: 126, borderRadius: 14, backgroundColor: "#edf1f8" },
  recognizedInfo: { flex: 1, paddingLeft: 12, justifyContent: "center", gap: 5 },
  badge: { alignSelf: "flex-start", backgroundColor: "#eef4ff", color: "#2f6df6", borderRadius: 12, paddingHorizontal: 9, paddingVertical: 4, fontSize: 12, fontWeight: "800", overflow: "hidden" },
  name: { fontSize: 18, fontWeight: "900", color: "#111827", lineHeight: 24 },
  meta: { color: "#475467", fontSize: 13 },
  keyword: { color: "#667085", fontSize: 12 },
  debugCard: { backgroundColor: "#0f172a", borderRadius: 14, padding: 12, marginBottom: 12, gap: 7 },
  debugRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  debugLabel: { color: "#cbd5e1", fontSize: 12, fontWeight: "700" },
  debugValue: { color: "#fff", fontSize: 13, fontWeight: "900" },
  mockText: { color: "#fbbf24" },
  realText: { color: "#34d399" },
  fallbackText: { color: "#fca5a5", fontSize: 12, lineHeight: 18 },
  noFallbackText: { color: "#a7f3d0", fontSize: 12 },
  listTitleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  listTitle: { color: "#111827", fontSize: 16, fontWeight: "900" },
  sortText: { color: "#2f6df6", fontSize: 12, fontWeight: "800" },
  empty: { textAlign: "center", color: "#667085", marginTop: 40 },
  error: { color: "#d92d20", marginBottom: 10, fontWeight: "700" },
});
