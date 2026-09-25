import type { ApiFetchOptions } from "./types";

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function fetchJson<T>(url: string, options: ApiFetchOptions = {}): Promise<T> {
  const { timeoutMs = 8000, retries = 1, ...init } = options;
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, { ...init, signal: controller.signal, headers: { Accept: 'application/json', ...(init.headers || {}) } });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json() as T;
    } catch (error) {
      lastError = error;
      if (attempt < retries) await sleep(250 * (attempt + 1));
    } finally { clearTimeout(timer); }
  }
  throw lastError instanceof Error ? lastError : new Error("API request failed");
}