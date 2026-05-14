import axios from "axios";
import { Platform } from "react-native";
import type {
  ApiEnvelope,
  FilterCondition,
  HistoryItem,
  PriceHistory,
  Product,
  RecognizedItem,
  UploadResult,
} from "@/types/product";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";
const DEVICE_ID = process.env.EXPO_PUBLIC_DEVICE_ID ?? "demo-device-001";

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.error?.message ?? error.message ?? "请求失败";
    return Promise.reject(new Error(message));
  },
);

export async function uploadImage(uri: string): Promise<UploadResult> {
  const formData = new FormData();
  const filename = uri.split("/").pop() || "product.jpg";
  const ext = filename.split(".").pop()?.toLowerCase();
  const mime = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";

  if (Platform.OS === "web") {
    const imageResponse = await fetch(uri);
    const blob = await imageResponse.blob();
    formData.append("file", new File([blob], filename, { type: blob.type || mime }));
  } else {
    formData.append("file", {
      uri,
      name: filename,
      type: mime,
    } as unknown as Blob);
  }

  formData.append("device_id", DEVICE_ID);

  const response = await fetch(`${API_BASE_URL}/api/upload`, {
    method: "POST",
    body: formData,
  });

  const payload = (await response.json()) as ApiEnvelope<UploadResult> | { error?: { message?: string } };
  if (!response.ok) {
    throw new Error("error" in payload ? payload.error?.message ?? "图片上传失败" : "图片上传失败");
  }
  if (!("data" in payload)) {
    throw new Error("上传接口返回格式异常");
  }
  return payload.data;
}

export async function recognizeImage(upload: UploadResult): Promise<RecognizedItem> {
  const response = await client.post<ApiEnvelope<{ session_id: number; recognized_item: RecognizedItem }>>(
    "/api/recognize",
    {
      session_id: upload.session_id,
      upload_id: upload.upload_id,
      image_url: upload.image_url,
    },
  );
  console.log("[recognize response]", response.data);
  return response.data.data.recognized_item;
}

export async function searchProducts(sessionId: number, keywords: string[]): Promise<Product[]> {
  const response = await client.post<ApiEnvelope<{ session_id: number; products: Product[] }>>("/api/search", {
    session_id: sessionId,
    keywords,
    page: 1,
    page_size: 20,
  });
  return response.data.data.products;
}

export async function filterProducts(
  sessionId: number,
  text: string,
): Promise<{ condition: FilterCondition; products: Product[] }> {
  const response = await client.post<ApiEnvelope<{ condition: FilterCondition; products: Product[] }>>("/api/filter", {
    session_id: sessionId,
    text,
  });
  return response.data.data;
}

export async function getProduct(productId: number): Promise<Product> {
  const response = await client.get<ApiEnvelope<Product>>(`/api/products/${productId}`);
  return response.data.data;
}

export async function getPriceHistory(productId: number): Promise<PriceHistory> {
  const response = await client.get<ApiEnvelope<PriceHistory>>(`/api/products/${productId}/price-history`);
  return response.data.data;
}

export async function getHistory(): Promise<HistoryItem[]> {
  const response = await client.get<ApiEnvelope<{ items: HistoryItem[] }>>("/api/history", {
    params: { device_id: DEVICE_ID, limit: 30 },
  });
  return response.data.data.items;
}

export async function favoriteProduct(productId: number): Promise<void> {
  await client.post("/api/favorites", { product_id: productId, device_id: DEVICE_ID });
}
