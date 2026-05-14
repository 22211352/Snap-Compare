import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Image, Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { useProductStore } from "@/store/productStore";
import { blurActiveElementOnWeb } from "@/utils/webFocus";

export default function CameraScreen() {
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const [imageUri, setImageUri] = useState<string>();
  const { runImageFlow, loading, error } = useProductStore();

  useEffect(() => {
    if (mode === "library") {
      pickImage();
    }
  }, [mode]);

  async function takePhoto() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("需要相机权限", "请允许访问相机后再拍照识物。");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.85, allowsEditing: true, aspect: [1, 1] });
    if (!result.canceled) setImageUri(result.assets[0].uri);
  }

  async function pickImage() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("需要相册权限", "请允许访问相册后选择商品图片。");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.85, allowsEditing: true, aspect: [1, 1] });
    if (!result.canceled) setImageUri(result.assets[0].uri);
  }

  async function submit() {
    if (!imageUri) return;
    try {
      await runImageFlow(imageUri);
      blurActiveElementOnWeb();
      router.replace("/result");
    } catch {
      Alert.alert("处理失败", useProductStore.getState().error ?? "请确认后端服务已启动");
    }
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
        <Text style={styles.title}>拍照/选图</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.body}>
        <View style={styles.preview}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.image} />
          ) : (
            <View style={styles.placeholder}>
              <Text style={styles.placeholderIcon}>📷</Text>
              <Text style={styles.placeholderText}>拍摄或选择一张商品图片</Text>
            </View>
          )}
        </View>

        <View style={styles.actions}>
          <Pressable
            style={styles.secondary}
            onPress={() => {
              blurActiveElementOnWeb();
              pickImage();
            }}
            disabled={loading}
          >
            <Text style={styles.secondaryText}>相册选择</Text>
          </Pressable>
          <Pressable
            style={styles.secondary}
            onPress={() => {
              blurActiveElementOnWeb();
              takePhoto();
            }}
            disabled={loading}
          >
            <Text style={styles.secondaryText}>拍照识物</Text>
          </Pressable>
        </View>

        <Pressable
          style={[styles.primary, (!imageUri || loading) && styles.disabled]}
          onPress={() => {
            blurActiveElementOnWeb();
            submit();
          }}
          disabled={!imageUri || loading}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>上传并识别</Text>}
        </Pressable>
        {error ? <Text style={styles.error}>{error}</Text> : <Text style={styles.note}>AI 识图会在服务端完成，App 不进行端侧推理。</Text>}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f8fbff" },
  header: { height: 56, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16 },
  back: { fontSize: 36, color: "#111827" },
  title: { fontSize: 17, fontWeight: "900", color: "#111827" },
  body: { padding: 16, gap: 18 },
  preview: { height: 360, borderRadius: 20, backgroundColor: "#fff", borderWidth: 1, borderColor: "#edf1f8", overflow: "hidden" },
  image: { width: "100%", height: "100%" },
  placeholder: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  placeholderIcon: { fontSize: 44 },
  placeholderText: { color: "#667085", fontWeight: "700" },
  actions: { flexDirection: "row", gap: 12 },
  secondary: { flex: 1, height: 48, borderRadius: 16, borderWidth: 1, borderColor: "#c9d8f7", backgroundColor: "#fff", alignItems: "center", justifyContent: "center" },
  secondaryText: { color: "#2f6df6", fontWeight: "900" },
  primary: { height: 54, borderRadius: 18, backgroundColor: "#2f6df6", alignItems: "center", justifyContent: "center" },
  disabled: { backgroundColor: "#a7bdf5" },
  primaryText: { color: "#fff", fontSize: 16, fontWeight: "900" },
  note: { color: "#667085", textAlign: "center", lineHeight: 20 },
  error: { color: "#d92d20", textAlign: "center", lineHeight: 20, fontWeight: "700" },
});
