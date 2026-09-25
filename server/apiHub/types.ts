export type ApiProviderId =
  | "open-meteo" | "bcb" | "openstreetmap" | "image-charts"
  | "mediastack" | "currents" | "api-football" | "thesportsdb" | "fipe" | "camara";

export type ApiProviderConfig = {
  id: ApiProviderId; name: string; category: string; requiresApiKey: boolean;
  envVar?: string; baseUrl: string; serverOnly: boolean; cacheTtlSeconds: number;
};

export type ApiHealth = {
  id: ApiProviderId; configured: boolean; status: "ready" | "not_configured"; lastError?: string;
};

export type ApiFetchOptions = RequestInit & { timeoutMs?: number; retries?: number };

export type NormalizedNewsItem = {
  title: string; description?: string; url: string; imageUrl?: string;
  publishedAt?: string; source?: string; language?: string;
};