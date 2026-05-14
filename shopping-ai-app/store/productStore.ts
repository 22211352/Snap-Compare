import { create } from "zustand";
import type { FilterCondition, HistoryItem, Product, RecognizedItem, UploadResult } from "@/types/product";
import {
  filterProducts,
  getHistory,
  recognizeImage,
  searchProducts,
  uploadImage,
} from "@/services/api";

type ProductState = {
  upload?: UploadResult;
  recognized?: RecognizedItem;
  products: Product[];
  filterCondition?: FilterCondition;
  history: HistoryItem[];
  loading: boolean;
  error?: string;
  setError: (message?: string) => void;
  runImageFlow: (uri: string) => Promise<void>;
  applyFilter: (text: string) => Promise<void>;
  loadHistory: () => Promise<void>;
  restoreSession: (item: HistoryItem) => void;
};

export const useProductStore = create<ProductState>((set, get) => ({
  products: [],
  history: [],
  loading: false,
  setError: (message) => set({ error: message }),
  runImageFlow: async (uri: string) => {
    set({ loading: true, error: undefined, products: [], recognized: undefined, filterCondition: undefined });
    try {
      const upload = await uploadImage(uri);
      const recognized = await recognizeImage(upload);
      const products = await searchProducts(upload.session_id, recognized.keywords);
      set({ upload, recognized, products, loading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "识图失败", loading: false });
      throw error;
    }
  },
  applyFilter: async (text: string) => {
    const sessionId = get().upload?.session_id;
    if (!sessionId) {
      set({ error: "请先完成一次识图搜索" });
      return;
    }
    set({ loading: true, error: undefined });
    try {
      const result = await filterProducts(sessionId, text);
      set({ products: result.products, filterCondition: result.condition, loading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "筛选失败", loading: false });
    }
  },
  loadHistory: async () => {
    set({ loading: true, error: undefined });
    try {
      const history = await getHistory();
      set({ history, loading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "历史记录加载失败", loading: false });
    }
  },
  restoreSession: (item: HistoryItem) => {
    set({
      upload: {
        upload_id: `history_${item.session_id}`,
        session_id: item.session_id,
        image_url: item.image_url,
      },
      recognized: {
        category: item.recognized_summary ?? "历史识别商品",
        keywords: item.recognized_summary ? [item.recognized_summary] : [],
        confidence: 0.9,
        provider: "mock",
        is_mock: true,
        fallback_reason: "Restored from local history summary",
        raw_model_output: null,
      },
      products: [],
    });
  },
}));
