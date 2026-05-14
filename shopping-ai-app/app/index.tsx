import { Image, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { blurActiveElementOnWeb } from "@/utils/webFocus";

const heroImage = "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=900&auto=format&fit=crop&q=80";

export default function HomeScreen() {
  const navigate = (href: Parameters<typeof router.push>[0]) => {
    blurActiveElementOnWeb();
    router.push(href);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>智能识物比价助手</Text>
            <Text style={styles.subtitle}>拍照识别商品，帮你找到更值得比较的选择</Text>
          </View>
          <Pressable style={styles.historyButton} onPress={() => navigate("/history")}>
            <Text style={styles.historyText}>历史</Text>
          </Pressable>
        </View>

        <View style={styles.scanCard}>
          <Image source={{ uri: heroImage }} style={styles.heroImage} />
          <View style={styles.cornerTopLeft} />
          <View style={styles.cornerTopRight} />
          <View style={styles.cornerBottomLeft} />
          <View style={styles.cornerBottomRight} />
        </View>

        <View style={styles.actions}>
          <Pressable style={styles.primaryAction} onPress={() => navigate({ pathname: "/camera", params: { mode: "camera" } })}>
            <Text style={styles.actionIcon}>📷</Text>
            <Text style={styles.primaryText}>拍照识物</Text>
          </Pressable>
          <Pressable style={styles.secondaryAction} onPress={() => navigate({ pathname: "/camera", params: { mode: "library" } })}>
            <Text style={styles.secondaryIcon}>▣</Text>
            <Text style={styles.secondaryText}>相册选择</Text>
          </Pressable>
        </View>

        <View style={styles.recent}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>最近识别</Text>
            <Pressable onPress={() => navigate("/history")}>
              <Text style={styles.link}>查看全部</Text>
            </Pressable>
          </View>
          <View style={styles.recentGrid}>
            {[
              heroImage,
              "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=500&auto=format&fit=crop&q=80",
              "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=500&auto=format&fit=crop&q=80",
              "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=500&auto=format&fit=crop&q=80",
            ].map((uri) => (
              <Image key={uri} source={{ uri }} style={styles.thumb} />
            ))}
          </View>
        </View>
      </ScrollView>
      <View style={styles.tabs}>
        <Text style={styles.tabActive}>首页</Text>
        <Text style={styles.tab} onPress={() => navigate("/history")}>
          历史
        </Text>
        <Text style={styles.tab}>收藏</Text>
        <Text style={styles.tab}>我的</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f8fbff" },
  container: { padding: 16, paddingBottom: 96 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 8 },
  title: { fontSize: 22, fontWeight: "900", color: "#111827" },
  subtitle: { fontSize: 13, color: "#667085", marginTop: 8 },
  historyButton: { backgroundColor: "#eef4ff", borderRadius: 16, paddingHorizontal: 14, paddingVertical: 8 },
  historyText: { color: "#2f6df6", fontWeight: "800" },
  scanCard: { marginTop: 24, height: 310, borderRadius: 18, overflow: "hidden", backgroundColor: "#e8edf6" },
  heroImage: { width: "100%", height: "100%" },
  cornerTopLeft: { position: "absolute", left: 18, top: 18, width: 28, height: 28, borderLeftWidth: 3, borderTopWidth: 3, borderColor: "#fff" },
  cornerTopRight: { position: "absolute", right: 18, top: 18, width: 28, height: 28, borderRightWidth: 3, borderTopWidth: 3, borderColor: "#fff" },
  cornerBottomLeft: { position: "absolute", left: 18, bottom: 18, width: 28, height: 28, borderLeftWidth: 3, borderBottomWidth: 3, borderColor: "#fff" },
  cornerBottomRight: { position: "absolute", right: 18, bottom: 18, width: 28, height: 28, borderRightWidth: 3, borderBottomWidth: 3, borderColor: "#fff" },
  actions: { flexDirection: "row", justifyContent: "center", gap: 28, marginTop: 22 },
  primaryAction: { alignItems: "center", gap: 8 },
  secondaryAction: { alignItems: "center", gap: 8 },
  actionIcon: { width: 68, height: 68, borderRadius: 34, backgroundColor: "#2f6df6", color: "#fff", textAlign: "center", textAlignVertical: "center", fontSize: 26, overflow: "hidden" },
  secondaryIcon: { width: 68, height: 68, borderRadius: 34, backgroundColor: "#fff", color: "#344054", textAlign: "center", textAlignVertical: "center", fontSize: 24, overflow: "hidden", borderWidth: 1, borderColor: "#edf1f8" },
  primaryText: { color: "#2f6df6", fontWeight: "800" },
  secondaryText: { color: "#344054", fontWeight: "700" },
  recent: { marginTop: 28 },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sectionTitle: { fontSize: 16, color: "#111827", fontWeight: "900" },
  link: { color: "#8a94a6", fontSize: 12 },
  recentGrid: { flexDirection: "row", gap: 10, marginTop: 12 },
  thumb: { flex: 1, height: 70, borderRadius: 12, backgroundColor: "#edf1f8" },
  tabs: { position: "absolute", left: 16, right: 16, bottom: 16, height: 58, borderRadius: 18, backgroundColor: "#fff", borderWidth: 1, borderColor: "#edf1f8", flexDirection: "row", alignItems: "center", justifyContent: "space-around" },
  tabActive: { color: "#2f6df6", fontWeight: "900" },
  tab: { color: "#667085", fontWeight: "700" },
});
