import { fetchJson } from "./http";
import { getApiHealth } from "./providers";

export { fetchJson, getApiHealth };

export async function getWeather(latitude: number, longitude: number) {
  const params = new URLSearchParams({ latitude: String(latitude), longitude: String(longitude), current: "temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m", daily: "temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code", timezone: "auto" });
  return fetchJson<Record<string, unknown>>("https://api.open-meteo.com/v1/forecast?" + params.toString(), { timeoutMs: 7000, retries: 2 });
}

export async function getBcbSeries(seriesId: number, startDate?: string, endDate?: string) {
  const params = new URLSearchParams({ format: "json" });
  if (startDate) params.set('dataInicial', startDate);
  if (endDate) params.set('dataFinal', endDate);
  return fetchJson<unknown>("https://api.bcb.gov.br/dados/serie/bcdata.sgs." + seriesId + "/dados?" + params.toString(), { timeoutMs: 8000, retries: 1 });
}

export async function geocodeBrazil(query: string) {
  const params = new URLSearchParams({ q: query, format: "jsonv2", limit: "5", countrycodes: "br" });
  return fetchJson<unknown>("https://nominatim.openstreetmap.org/search?" + params.toString(), { timeoutMs: 8000, retries: 1, headers: { "User-Agent": "PCH-News/1.0 (PCH News)" } });
}

export async function getNewsRadar(provider: 'mediastack' | 'currents', query?: string) {
  if (provider === 'mediastack') {
    const key = process.env.MEDIASTACK_API_KEY;
    if (!key) throw new Error('MEDIASTACK_API_KEY não configurada');
    const params = new URLSearchParams({ access_key: key, languages: "pt", limit: "20" });
    if (query) params.set('keywords', query);
    return fetchJson<unknown>("https://api.mediastack.com/v1/news?" + params.toString(), { timeoutMs: 8000, retries: 1 });
  }
  const key = process.env.CURRENTS_API_KEY;
  if (!key) throw new Error('CURRENTS_API_KEY não configurada');
  const params = new URLSearchParams({ apiKey: key, language: "pt", page_size: "20" });
  if (query) params.set('keywords', query);
  return fetchJson<unknown>("https://api.currentsapi.services/v1/latest-news?" + params.toString(), { timeoutMs: 8000, retries: 1 });
}