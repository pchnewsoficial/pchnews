import { ApiHubError, envTtl, hubFetchJson, type ProviderDefinition } from "./core";

const has = (name: string) => Boolean(process.env[name]);
const HOUR = 3_600_000;

// ============ Open-Meteo (clima) — sem chave ============
export interface WeatherNow { provider: "open-meteo"; latitude: number; longitude: number; temperatureC: number; apparentC: number | null; humidity: number | null; windKmh: number | null; weatherCode: number; description: string; observedAt: string; }
const WMO: Record<number, string> = { 0: "Céu limpo", 1: "Predominantemente limpo", 2: "Parcialmente nublado", 3: "Nublado", 45: "Neblina", 48: "Neblina com geada", 51: "Garoa fraca", 53: "Garoa", 55: "Garoa forte", 61: "Chuva fraca", 63: "Chuva", 65: "Chuva forte", 71: "Neve fraca", 73: "Neve", 75: "Neve forte", 80: "Pancadas fracas", 81: "Pancadas de chuva", 82: "Pancadas fortes", 95: "Trovoadas", 96: "Trovoadas com granizo", 99: "Trovoadas com granizo forte" };
export async function getWeather(lat: number, lon: number): Promise<WeatherNow> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(4)}&longitude=${lon.toFixed(4)}&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code&timezone=America%2FSao_Paulo`;
  const raw = await hubFetchJson<any>("open-meteo", url, { cacheTtlMs: envTtl("open-meteo", 10 * 60_000) });
  const c = raw?.current;
  if (!c || typeof c.temperature_2m !== "number") throw new ApiHubError("open-meteo", "resposta sem dados atuais");
  return { provider: "open-meteo", latitude: raw.latitude, longitude: raw.longitude, temperatureC: c.temperature_2m, apparentC: c.apparent_temperature ?? null, humidity: c.relative_humidity_2m ?? null, windKmh: c.wind_speed_10m ?? null, weatherCode: c.weather_code, description: WMO[c.weather_code] ?? "Condição não informada", observedAt: c.time };
}

// ============ Banco Central (SGS) — sem chave ============
export const BCB_SERIES = { selic: 432, ipca: 433, dolar: 1, euro: 21619, igpm: 189 } as const;
export type BcbSeriesId = keyof typeof BCB_SERIES;
export interface EconomicPoint { date: string; value: number; }
export interface EconomicSeries { provider: "bcb-sgs"; series: BcbSeriesId; code: number; points: EconomicPoint[]; latest: EconomicPoint | null; }
export async function getBcbSeries(series: BcbSeriesId, last = 10): Promise<EconomicSeries> {
  const code = BCB_SERIES[series];
  const n = Math.max(1, Math.min(last, 20));
  const url = `https://api.bcb.gov.br/dados/serie/bcdata.sgs.${code}/dados/ultimos/${n}?formato=json`;
  const raw = await hubFetchJson<Array<{ data: string; valor: string }>>("bcb-sgs", url, { cacheTtlMs: envTtl("bcb-sgs", HOUR) });
  if (!Array.isArray(raw)) throw new ApiHubError("bcb-sgs", "formato inesperado");
  const points = raw.map((p) => { const [d, m, y] = p.data.split("/"); return { date: `${y}-${m}-${d}`, value: Number(p.valor) }; }).filter((p) => Number.isFinite(p.value));
  return { provider: "bcb-sgs", series, code, points, latest: points.at(-1) ?? null };
}

// ============ Nominatim / OpenStreetMap — sem chave (uso moderado, com cache obrigatório) ============
export interface GeoResult { provider: "nominatim"; name: string; latitude: number; longitude: number; type: string; }
export async function geocode(query: string): Promise<GeoResult[]> {
  const q = query.trim().slice(0, 120);
  if (q.length < 2) return [];
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&countrycodes=br&accept-language=pt-BR&q=${encodeURIComponent(q)}`;
  const contact = process.env.API_HUB_CONTACT_EMAIL;
  const raw = await hubFetchJson<any[]>("nominatim", url, { retries: 0, cacheTtlMs: envTtl("nominatim", 24 * HOUR), headers: contact ? { From: contact } : {} });
  return (raw || []).map((r) => ({ provider: "nominatim" as const, name: r.display_name, latitude: Number(r.lat), longitude: Number(r.lon), type: r.type }));
}

// ============ Image-Charts — sem chave (plano gratuito com marca d'água; chave opcional) ============
export function chartUrl(input: { type: "line" | "bar" | "pie"; labels: string[]; values: number[]; title?: string; width?: number; height?: number }): string {
  const cht = { line: "lc", bar: "bvs", pie: "p" }[input.type];
  const w = Math.min(Math.max(input.width ?? 700, 100), 999);
  const h = Math.min(Math.max(input.height ?? 300, 100), 999);
  const p = new URLSearchParams({ cht, chs: `${w}x${h}`, chd: `a:${input.values.map((v) => Number(v) || 0).join(",")}`, chl: input.labels.map((l) => l.replace(/\|/g, " ")).join("|"), chco: "1E468C" });
  if (input.title) p.set("chtt", input.title.slice(0, 80));
  return `https://image-charts.com/chart?${p.toString()}`;
}
export function qrUrl(data: string, size = 300): string {
  const s = Math.min(Math.max(size, 100), 999);
  return `https://image-charts.com/chart?${new URLSearchParams({ cht: "qr", chs: `${s}x${s}`, chl: data.slice(0, 500), choe: "UTF-8" }).toString()}`;
}

// ============ Radar de notícias — requer chave ============
export interface RadarItem { provider: string; title: string; url: string; source: string | null; publishedAt: string | null; description: string | null; }
export async function mediastackRadar(keywords: string): Promise<RadarItem[]> {
  const key = process.env.MEDIASTACK_API_KEY;
  if (!key) throw new ApiHubError("mediastack", "MEDIASTACK_API_KEY não configurada");
  // O plano gratuito do Mediastack é documentado como HTTP-only; use MEDIASTACK_BASE_URL para plano HTTPS.
  const base = process.env.MEDIASTACK_BASE_URL || "https://api.mediastack.com/v1";
  const url = `${base}/news?access_key=${encodeURIComponent(key)}&languages=pt&countries=br&limit=20&sort=published_desc&keywords=${encodeURIComponent(keywords.slice(0, 100))}`;
  const raw = await hubFetchJson<any>("mediastack", url, { cacheTtlMs: envTtl("mediastack", 15 * 60_000), cacheKey: `mediastack:${keywords}` });
  return (raw?.data || []).map((a: any) => ({ provider: "mediastack", title: a.title, url: a.url, source: a.source ?? null, publishedAt: a.published_at ?? null, description: a.description ?? null }));
}
export async function currentsRadar(keywords: string): Promise<RadarItem[]> {
  const key = process.env.CURRENTS_API_KEY;
  if (!key) throw new ApiHubError("currents", "CURRENTS_API_KEY não configurada");
  const url = `https://api.currentsapi.services/v1/search?language=pt&country=BR&keywords=${encodeURIComponent(keywords.slice(0, 100))}`;
  const raw = await hubFetchJson<any>("currents", url, { headers: { Authorization: key }, cacheTtlMs: envTtl("currents", 15 * 60_000), cacheKey: `currents:${keywords}` });
  return (raw?.news || []).map((a: any) => ({ provider: "currents", title: a.title, url: a.url, source: a.author ?? null, publishedAt: a.published ?? null, description: a.description ?? null }));
}

// ============ Registry ============
export const PROVIDERS: ProviderDefinition[] = [
  { id: "open-meteo", name: "Open-Meteo", category: "clima", status: "pronta", requiresKey: false, envVars: ["API_HUB_OPEN_METEO_CACHE_SECONDS"], docsUrl: "https://open-meteo.com/en/docs", isConfigured: () => true },
  { id: "bcb-sgs", name: "Banco Central do Brasil — SGS", category: "economia", status: "pronta", requiresKey: false, envVars: ["API_HUB_BCB_SGS_CACHE_SECONDS"], docsUrl: "https://dadosabertos.bcb.gov.br/", isConfigured: () => true },
  { id: "nominatim", name: "OpenStreetMap Nominatim", category: "geo", status: "pronta", requiresKey: false, envVars: ["API_HUB_CONTACT_EMAIL", "API_HUB_NOMINATIM_CACHE_SECONDS"], docsUrl: "https://operations.osmfoundation.org/policies/nominatim/", isConfigured: () => true },
  { id: "image-charts", name: "Image-Charts", category: "graficos", status: "pronta", requiresKey: false, envVars: [], docsUrl: "https://documentation.image-charts.com/", isConfigured: () => true },
  { id: "mediastack", name: "Mediastack", category: "noticias", status: "preparada", requiresKey: true, envVars: ["MEDIASTACK_API_KEY", "MEDIASTACK_BASE_URL"], docsUrl: "https://mediastack.com/documentation", isConfigured: () => has("MEDIASTACK_API_KEY") },
  { id: "currents", name: "Currents API", category: "noticias", status: "preparada", requiresKey: true, envVars: ["CURRENTS_API_KEY"], docsUrl: "https://currentsapi.services/en/docs/", isConfigured: () => has("CURRENTS_API_KEY") },
  { id: "api-football", name: "API-FOOTBALL", category: "esporte", status: "avaliar", requiresKey: true, envVars: ["API_FOOTBALL_KEY"], docsUrl: "https://www.api-football.com/documentation-v3", isConfigured: () => has("API_FOOTBALL_KEY") },
  { id: "thesportsdb", name: "TheSportsDB", category: "esporte", status: "avaliar", requiresKey: true, envVars: ["THESPORTSDB_API_KEY"], docsUrl: "https://www.thesportsdb.com/documentation", isConfigured: () => has("THESPORTSDB_API_KEY") },
  { id: "fipe", name: "Tabela FIPE (API comunitária)", category: "veiculos", status: "avaliar", requiresKey: false, envVars: ["FIPE_BASE_URL"], docsUrl: "https://deividfortuna.github.io/fipe/", isConfigured: () => has("FIPE_BASE_URL") },
];
