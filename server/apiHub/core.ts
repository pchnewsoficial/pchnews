/**
 * PCH API HUB — core primitives shared by every provider adapter.
 * Server-side only. Never import from client code.
 */

export type ProviderCategory = "clima" | "economia" | "geo" | "graficos" | "noticias" | "esporte" | "veiculos";
export type ProviderStatus = "pronta" | "preparada" | "avaliar";

export interface ProviderHealth {
  lastOkAt: number | null;
  lastErrorAt: number | null;
  lastError: string | null;
  calls: number;
  failures: number;
  cacheHits: number;
}

export interface ProviderDefinition {
  id: string;
  name: string;
  category: ProviderCategory;
  status: ProviderStatus;
  requiresKey: boolean;
  /** Names of env vars (never values) the provider reads. */
  envVars: string[];
  docsUrl: string;
  isConfigured: () => boolean;
}

export class ApiHubError extends Error {
  constructor(public provider: string, message: string, public status?: number) {
    super(message);
    this.name = "ApiHubError";
  }
}

const health = new Map<string, ProviderHealth>();
export function getHealth(id: string): ProviderHealth {
  let h = health.get(id);
  if (!h) { h = { lastOkAt: null, lastErrorAt: null, lastError: null, calls: 0, failures: 0, cacheHits: 0 }; health.set(id, h); }
  return h;
}
export function resetHealth() { health.clear(); cache.clear(); }

/** Removes anything that looks like a credential from strings before logging/exposing them. */
export function redact(text: string): string {
  return text
    .replace(/([?&](?:access_key|apiKey|api_key|key|token|apikey)=)[^&\s]+/gi, "$1***")
    .replace(/(Authorization:\s*)\S+(\s\S+)?/gi, "$1***")
    .slice(0, 300);
}

// ---------- cache (in-memory, per isolate; short TTLs only) ----------
const cache = new Map<string, { expires: number; value: unknown }>();
const MAX_CACHE = 500;
export function cacheGet<T>(key: string): T | undefined {
  const hit = cache.get(key);
  if (!hit) return undefined;
  if (hit.expires < Date.now()) { cache.delete(key); return undefined; }
  return hit.value as T;
}
export function cacheSet(key: string, value: unknown, ttlMs: number) {
  if (ttlMs <= 0) return;
  if (cache.size >= MAX_CACHE) { const first = cache.keys().next().value; if (first) cache.delete(first); }
  cache.set(key, { expires: Date.now() + ttlMs, value });
}

export function envTtl(providerId: string, fallbackMs: number): number {
  const raw = process.env[`API_HUB_${providerId.toUpperCase().replace(/-/g, "_")}_CACHE_SECONDS`];
  const n = raw ? Number(raw) : NaN;
  return Number.isFinite(n) && n >= 0 ? n * 1000 : fallbackMs;
}

export interface FetchOptions {
  timeoutMs?: number;
  retries?: number;
  headers?: Record<string, string>;
  cacheKey?: string;
  cacheTtlMs?: number;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** fetch JSON with timeout, bounded retry (network / 429 / 5xx only), cache and health tracking. */
export async function hubFetchJson<T>(providerId: string, url: string, opts: FetchOptions = {}): Promise<T> {
  const h = getHealth(providerId);
  const key = opts.cacheKey ?? `${providerId}:${url}`;
  if (opts.cacheTtlMs) {
    const cached = cacheGet<T>(key);
    if (cached !== undefined) { h.cacheHits++; return cached; }
  }
  const retries = Math.min(opts.retries ?? 1, 3);
  const timeoutMs = opts.timeoutMs ?? 8000;
  let lastErr: ApiHubError | null = null;
  for (let attempt = 0; attempt <= retries; attempt++) {
    h.calls++;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        signal: controller.signal,
        headers: { Accept: "application/json", "User-Agent": "PCH-News-ApiHub/1.0 (+https://pchnews.com.br)", ...opts.headers },
      });
      if (!res.ok) {
        lastErr = new ApiHubError(providerId, `HTTP ${res.status}`, res.status);
        if (res.status === 429 || res.status >= 500) { await sleep(300 * (attempt + 1)); continue; }
        break;
      }
      const data = (await res.json()) as T;
      h.lastOkAt = Date.now();
      if (opts.cacheTtlMs) cacheSet(key, data, opts.cacheTtlMs);
      return data;
    } catch (err) {
      const msg = (err as Error)?.name === "AbortError" ? `timeout após ${timeoutMs}ms` : String((err as Error)?.message ?? err);
      lastErr = new ApiHubError(providerId, redact(msg));
      if (attempt < retries) await sleep(300 * (attempt + 1));
    } finally {
      clearTimeout(timer);
    }
  }
  h.failures++;
  h.lastErrorAt = Date.now();
  h.lastError = redact(lastErr?.message ?? "erro desconhecido");
  console.warn(`[ApiHub:${providerId}] ${h.lastError}`);
  throw lastErr ?? new ApiHubError(providerId, "erro desconhecido");
}
