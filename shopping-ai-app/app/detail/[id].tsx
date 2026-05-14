import { useEffect, useState } from "react";
import { ActivityIndicator, Image, Linking, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { PriceChart } from "@/components/PriceChart";
import { favoriteProduct, getPriceHistory, getProduct } from "@/services/api";
import type { PriceHistory, Product } from "@/types/product";
import { blurActiveElementOnWeb } from "@/utils/webFocus";

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [product, setProduct] = useState<Product>();
  const [history, setHistory] = useState<PriceHistory>();
  const [loading, setLoading] = useState(true);
  const [favorited, setFavorited] = useState(false);

  useEffect(() => {
    async function load() {
      if (!id) return;
      setLoading(true);
      const productId = Number(id);
      const [detail, priceHistory] = await Promise.all([getProduct(productId), getPriceHistory(productId)]);
      setProduct(detail);
      setHistory(priceHistory);
      setLoading(false);
    }
    load().catch(() => setLoading(false));
  }, [id]);

  async function favorite() {
    blurActiveElementOnWeb();
    if (!product) return;
    try {
      await favoriteProduct(product.id);
      setFavorited(true);
    } catch {
      setFavorited(true);
    }
  }

  if (loading || !product) {
    return (
      <SafeAreaView style={styles.safeCenter}>
        <ActivityIndicator color="#2f6df6" />
        <Text style={styles.loadingText}>加载商品详情...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Pressable
            style={styles.iconButton}
            onPress={() => {
              blurActiveElementOnWeb();
              router.back();
            }}
          >
            <Text style={styles.back}>‹</Text>
          </Pressable>
          <View style={styles.headerActions}>
            <Pressable style={styles.iconButton} onPress={favorite}>
              <Text style={styles.iconText}>{favorited ? "★" : "☆"}</Text>
            </Pressable>
            <Pressable
              style={styles.iconButton}
              onPress={() => {
                blurActiveElementOnWeb();
                Linking.openURL(product.product_url);
              }}
            >
              <Text style={styles.iconText}>↗</Text>
            </Pressable>
          </View>
        </View>
        <Image source={{ uri: product.image_url }} style={styles.image} />
        <View style={styles.info}>
          <Text style={styles.platform}>{product.platform === "jd" ? "京东" : product.platform === "pdd" ? "拼多多" : product.platform}</Text>
          <Text style={styles.title}>{product.title}</Text>
          <View style={styles.priceRow}>
            <Text style={styles.price}>¥{Number(product.price).toFixed(0)}</Text>
            {product.original_price ? <Text style={styles.original}>原价 ¥{Number(product.original_price).toFixed(0)}</Text> : null}
            <Text style={styles.sales}>已售 {product.sales_count ?? 0}+</Text>
          </View>
          <View style={styles.tags}>
            <Text style={styles.tag}>{product.shop_type === "official" ? "官方旗舰店" : product.shop_name ?? "店铺"}</Text>
            <Text style={styles.tag}>正品保障</Text>
            <Text style={styles.tag}>{product.coupon_info ?? "跳转官方购买"}</Text>
          </View>
        </View>
        <View style={styles.reasonBox}>
          <Text style={styles.reasonTitle}>AI 推荐理由</Text>
          <Text style={styles.reasonText}>{product.recommend_reason ?? "商品标题、颜色和品类与识别结果高度相似，可优先比较价格和店铺资质。"}</Text>
        </View>
        <PriceChart points={history?.points ?? []} />
      </ScrollView>
      <View style={styles.bottomBar}>
        <Pressable style={styles.smallAction} onPress={favorite}>
          <Text style={styles.smallActionText}>{favorited ? "已收藏" : "收藏"}</Text>
        </Pressable>
        <Pressable
          style={styles.buyButton}
          onPress={() => {
            blurActiveElementOnWeb();
            Linking.openURL(product.product_url);
          }}
        >
          <Text style={styles.buyText}>去购买</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f8fbff" },
  safeCenter: { flex: 1, backgroundColor: "#f8fbff", alignItems: "center", justifyContent: "center", gap: 10 },
  loadingText: { color: "#667085" },
  container: { padding: 16, paddingBottom: 96 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  headerActions: { flexDirection: "row", gap: 8 },
  iconButton: { width: 38, height: 38, borderRadius: 19, backgroundColor: "#fff", borderWidth: 1, borderColor: "#edf1f8", alignItems: "center", justifyContent: "center" },
  back: { fontSize: 30, lineHeight: 32, color: "#111827" },
  iconText: { color: "#111827", fontSize: 18, fontWeight: "800" },
  image: { width: "100%", height: 330, borderRadius: 22, backgroundColor: "#edf1f8" },
  info: { backgroundColor: "#fff", borderRadius: 18, padding: 14, marginTop: 12, borderWidth: 1, borderColor: "#edf1f8" },
  platform: { alignSelf: "flex-start", backgroundColor: "#f33737", color: "#fff", borderRadius: 5, paddingHorizontal: 6, paddingVertical: 3, overflow: "hidden", fontSize: 11, fontWeight: "900" },
  title: { marginTop: 8, color: "#111827", fontSize: 18, fontWeight: "900", lineHeight: 25 },
  priceRow: { flexDirection: "row", alignItems: "baseline", gap: 10, marginTop: 10, flexWrap: "wrap" },
  price: { color: "#f0272d", fontSize: 28, fontWeight: "900" },
  original: { color: "#98a2b3", textDecorationLine: "line-through" },
  sales: { color: "#667085", fontSize: 12 },
  tags: { flexDirection: "row", gap: 8, flexWrap: "wrap", marginTop: 12 },
  tag: { backgroundColor: "#f6f8fb", color: "#344054", borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6, fontSize: 12, fontWeight: "700" },
  reasonBox: { backgroundColor: "#fff", borderRadius: 16, padding: 14, marginTop: 12, borderWidth: 1, borderColor: "#edf1f8" },
  reasonTitle: { color: "#111827", fontWeight: "900", fontSize: 15 },
  reasonText: { color: "#475467", lineHeight: 20, marginTop: 8 },
  bottomBar: { position: "absolute", left: 16, right: 16, bottom: 16, height: 58, backgroundColor: "#fff", borderRadius: 20, borderWidth: 1, borderColor: "#edf1f8", flexDirection: "row", alignItems: "center", padding: 6, gap: 8 },
  smallAction: { width: 92, height: 46, alignItems: "center", justifyContent: "center" },
  smallActionText: { color: "#344054", fontWeight: "800" },
  buyButton: { flex: 1, height: 46, borderRadius: 23, backgroundColor: "#f0272d", alignItems: "center", justifyContent: "center" },
  buyText: { color: "#fff", fontSize: 16, fontWeight: "900" },
});
