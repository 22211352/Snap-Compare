import { useEffect } from "react";
import { FlatList, Image, Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { useProductStore } from "@/store/productStore";
import type { HistoryItem } from "@/types/product";
import { blurActiveElementOnWeb } from "@/utils/webFocus";

export default function HistoryScreen() {
  const { history, loadHistory, restoreSession, loading } = useProductStore();

  useEffect(() => {
    loadHistory();
  }, []);

  function openHistory(item: HistoryItem) {
    blurActiveElementOnWeb();
    restoreSession(item);
    router.push("/result");
  }

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
        <Text style={styles.title}>搜索历史</Text>
        <Text style={styles.edit}>编辑</Text>
      </View>
      <FlatList
        data={history}
        keyExtractor={(item) => String(item.session_id)}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Pressable style={styles.item} onPress={() => openHistory(item)}>
            <Image source={{ uri: item.image_url }} style={styles.image} />
            <View style={styles.itemInfo}>
              <Text style={styles.name} numberOfLines={2}>
                {item.recognized_summary ?? "识图搜索"}
              </Text>
              <Text style={styles.meta}>{item.product_count} 个相似商品 · {new Date(item.created_at).toLocaleString()}</Text>
            </View>
            <Text style={styles.arrow}>›</Text>
          </Pressable>
        )}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyTitle}>{loading ? "加载中..." : "暂无搜索历史"}</Text>
            <Text style={styles.emptyText}>完成一次拍照识物后，这里会显示历史记录。</Text>
          </View>
        }
      />
      <View style={styles.tabs}>
        <Text
          style={styles.tab}
          onPress={() => {
            blurActiveElementOnWeb();
            router.push("/");
          }}
        >
          首页
        </Text>
        <Text style={styles.tabActive}>历史</Text>
        <Text style={styles.tab}>收藏</Text>
        <Text style={styles.tab}>我的</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f8fbff" },
  header: { height: 56, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  back: { fontSize: 34, color: "#111827" },
  title: { fontSize: 17, color: "#111827", fontWeight: "900" },
  edit: { color: "#2f6df6", fontWeight: "800" },
  list: { padding: 16, paddingBottom: 96 },
  item: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 16, padding: 12, borderWidth: 1, borderColor: "#edf1f8", marginBottom: 12 },
  image: { width: 72, height: 72, borderRadius: 12, backgroundColor: "#edf1f8" },
  itemInfo: { flex: 1, paddingHorizontal: 12, gap: 6 },
  name: { color: "#111827", fontSize: 15, fontWeight: "900", lineHeight: 21 },
  meta: { color: "#667085", fontSize: 12 },
  arrow: { color: "#98a2b3", fontSize: 28 },
  emptyBox: { alignItems: "center", justifyContent: "center", paddingTop: 120, gap: 8 },
  emptyTitle: { color: "#111827", fontSize: 16, fontWeight: "900" },
  emptyText: { color: "#667085" },
  tabs: { position: "absolute", left: 16, right: 16, bottom: 16, height: 58, borderRadius: 18, backgroundColor: "#fff", borderWidth: 1, borderColor: "#edf1f8", flexDirection: "row", alignItems: "center", justifyContent: "space-around" },
  tabActive: { color: "#2f6df6", fontWeight: "900" },
  tab: { color: "#667085", fontWeight: "700" },
});
