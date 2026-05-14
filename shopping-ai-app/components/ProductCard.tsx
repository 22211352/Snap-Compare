import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import type { Product } from "@/types/product";
import { blurActiveElementOnWeb } from "@/utils/webFocus";

type Props = {
  product: Product;
  onPress?: () => void;
};

const platformLabels: Record<string, string> = {
  jd: "京东",
  pdd: "拼多多",
  mock: "Mock",
};

const shopLabels: Record<string, string> = {
  official: "官方旗舰店",
  authorized: "授权店",
  normal: "普通店铺",
};

export function ProductCard({ product, onPress }: Props) {
  return (
    <Pressable
      style={styles.card}
      onPress={() => {
        blurActiveElementOnWeb();
        onPress?.();
      }}
    >
      <Image source={{ uri: product.image_url }} style={styles.image} />
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={styles.platform}>{platformLabels[product.platform] ?? product.platform}</Text>
          <Text style={styles.title} numberOfLines={2}>
            {product.title}
          </Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.price}>¥{Number(product.price).toFixed(0)}</Text>
          {product.original_price ? <Text style={styles.original}>¥{Number(product.original_price).toFixed(0)}</Text> : null}
        </View>
        <Text style={styles.shop} numberOfLines={1}>
          {shopLabels[product.shop_type ?? ""] ?? product.shop_name ?? "店铺"} · {product.sales_count ?? 0}+人关注
        </Text>
        <Text style={styles.reason} numberOfLines={1}>
          {product.recommend_reason ?? product.coupon_info ?? "与识别商品高度相似"}
        </Text>
      </View>
      <View style={styles.cartCircle}>
        <Text style={styles.cartText}>购</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#edf1f8",
    shadowColor: "#1d3354",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
  },
  image: {
    width: 88,
    height: 88,
    borderRadius: 12,
    backgroundColor: "#f3f6fb",
  },
  content: {
    flex: 1,
    paddingHorizontal: 10,
    gap: 4,
  },
  titleRow: {
    gap: 5,
  },
  platform: {
    alignSelf: "flex-start",
    overflow: "hidden",
    borderRadius: 5,
    backgroundColor: "#f33737",
    color: "#fff",
    fontSize: 10,
    fontWeight: "800",
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  title: {
    color: "#111827",
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "700",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 7,
  },
  price: {
    color: "#f0272d",
    fontSize: 20,
    fontWeight: "900",
  },
  original: {
    color: "#9aa4b2",
    fontSize: 12,
    textDecorationLine: "line-through",
  },
  shop: {
    color: "#667085",
    fontSize: 12,
  },
  reason: {
    color: "#2563eb",
    fontSize: 12,
    fontWeight: "700",
  },
  cartCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#d7e2f5",
    alignItems: "center",
    justifyContent: "center",
  },
  cartText: {
    color: "#1d4ed8",
    fontSize: 12,
    fontWeight: "800",
  },
});
