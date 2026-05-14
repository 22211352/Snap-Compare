export type RecognizedItem = {
  category: string;
  brand?: string | null;
  color?: string | null;
  style?: string | null;
  material?: string | null;
  keywords: string[];
  confidence: number;
  raw_result?: Record<string, unknown> | null;
  provider: "gemini" | "mock" | string;
  is_mock: boolean;
  fallback_reason?: string | null;
  raw_model_output?: string | null;
};

export type Product = {
  id: number;
  platform: "jd" | "pdd" | "mock" | string;
  external_product_id: string;
  title: string;
  image_url: string;
  price: number;
  original_price?: number | null;
  shop_name?: string | null;
  shop_type?: "official" | "authorized" | "normal" | string | null;
  sales_count?: number | null;
  coupon_info?: string | null;
  product_url: string;
  attributes?: Record<string, unknown> | null;
  score?: number | null;
  recommend_reason?: string | null;
};

export type FilterCondition = {
  min_price?: number | null;
  max_price?: number | null;
  platforms: string[];
  shop_type?: string | null;
  sort_by?: string | null;
  keywords_include: string[];
  keywords_exclude: string[];
};

export type PricePoint = {
  recorded_at: string;
  price: number;
};

export type PriceHistory = {
  product_id: number;
  currency: string;
  points: PricePoint[];
};

export type HistoryItem = {
  session_id: number;
  image_url: string;
  recognized_summary?: string | null;
  product_count: number;
  created_at: string;
};

export type UploadResult = {
  upload_id: string;
  session_id: number;
  image_url: string;
};

export type ApiEnvelope<T> = {
  data: T;
};
