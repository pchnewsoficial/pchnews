import { fetchJson } from "./http";
import { getApiHealth } from "./providers";
import type { NormalizedNewsItem } from "./types";

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

export async function getNewsRadar(provider: 'mediastack' | 'currents', query?: string): Promise<NormalizedNewsItem[]> {
  if (provider === 'mediastack') {
    const key = process.env.MEDIASTACK_API_KEY;
    if (!key) throw new Error('MEDIASTACK_API_KEY não configurada');
    const params = new URLSearchParams({ access_key: key, languages: "pt", limit: "20" });
    if (query) params.set('keywords', query);
    const data = await fetchJson<any>("https://api.mediastack.com/v1/news?" + params.toString(), { timeoutMs: 8000, retries: 1 });
    return (data?.data || []).map((item: any) => ({ title: item.title || "", description: item.description || undefined, url: item.url || "", imageUrl: item.image || undefined, publishedAt: item.published_at || undefined, source: item.source || undefined, language: item.language || "pt" })).filter((item: NormalizedNewsItem) => item.title && item.url);
  }
  const key = process.env.CURRENTS_API_KEY;
  if (!key) throw new Error('CURRENTS_API_KEY não configurada');
  const params = new URLSearchParams({ apiKey: key, language: "pt", page_size: "20" });
  if (query) params.set('keywords', query);
  const data = await fetchJson<any>("https://api.currentsapi.services/v1/latest-news?" + params.toString(), { timeoutMs: 8000, retries: 1 });
  return (data?.news || []).map((item: any) => ({ title: item.title || "", description: item.description || undefined, url: item.url || "", imageUrl: item.image || undefined, publishedAt: item.published || undefined, source: item.author || undefined, language: item.language || "pt" })).filter((item: NormalizedNewsItem) => item.title && item.url);
}

export type NormalizedChamberProposition = {
  id: number;
  title: string;
  summary?: string;
  status?: string;
  presentationDate?: string;
  url: string;
};

type ChamberApiProposition = {
  id?: number;
  ementa?: string;
  keywords?: string;
  siglaTipo?: string;
  numero?: number;
  ano?: number;
  statusProposicao?: { descricao?: string };
  ultimoStatus?: { descricao?: string };
  dataApresentacao?: string;
  uri?: string;
};

type RankedChamberProposition = {
  item: ChamberApiProposition;
  score: number;
};

export async function getChamberPropositions(query: string): Promise<NormalizedChamberProposition[]> {
  const terms = query
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\\u0300-\\u036f]/g, "")
    .split(/\\W+/)
    .filter((term) => term.length >= 4);
  if (!terms.length) return [];

  const params = new URLSearchParams({
    ordem: "DESC",
    ordenarPor: "id",
    itens: "50",
    keywords: terms.join(","),
  });
  const raw = await fetchJson<{ dados?: ChamberApiProposition[] }>(
    "https://dadosabertos.camara.leg.br/api/v2/proposicoes?" + params.toString(),
  );
  const items = Array.isArray(raw?.dados) ? raw.dados : [];
  const ranked: RankedChamberProposition[] = items
    .map((item) => {
      const haystack = `${item.ementa || ""} ${item.keywords || ""} ${item.siglaTipo || ""}`
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\\u0300-\\u036f]/g, "");
      const score = terms.reduce((total, term) => total + (haystack.includes(term) ? 1 : 0), 0);
      return { item, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);

  return ranked.map(({ item }) => ({
    id: Number(item.id),
    title: [item.siglaTipo, item.numero, item.ano].filter(Boolean).join(" "),
    summary: item.ementa ? String(item.ementa) : undefined,
    status: item.statusProposicao?.descricao || item.ultimoStatus?.descricao || undefined,
    presentationDate: item.dataApresentacao || undefined,
    url: String(item.uri || `https://dadosabertos.camara.leg.br/api/v2/proposicoes/${item.id}`),
  }));
}

export type NormalizedIbgeMunicipality = {
  id: number;
  name: string;
  stateId?: number;
  stateAbbreviation?: string;
  stateName?: string;
  region?: string;
  url: string;
};

export async function getIbgeMunicipalities(query: string): Promise<NormalizedIbgeMunicipality[]> {
  const term = query.trim().slice(0, 100);
  if (!term) return [];
  const params = new URLSearchParams({ nome: term });
  const raw = await fetchJson<any[]>(
    "https://servicodados.ibge.gov.br/api/v1/localidades/municipios?" + params.toString(),
    { timeoutMs: 8000, retries: 1 },
  );
  return (Array.isArray(raw) ? raw : []).slice(0, 10).map((item: any) => ({
    id: Number(item?.id),
    name: String(item?.nome || ""),
    stateId: Number.isFinite(Number(item?.microrregiao?.mesorregiao?.UF?.id)) ? Number(item.microrregiao.mesorregiao.UF.id) : undefined,
    stateAbbreviation: item?.microrregiao?.mesorregiao?.UF?.sigla ? String(item.microrregiao.mesorregiao.UF.sigla) : undefined,
    stateName: item?.microrregiao?.mesorregiao?.UF?.nome ? String(item.microrregiao.mesorregiao.UF.nome) : undefined,
    region: item?.["regiao-imediata"]?.["regiao-intermediaria"]?.UF?.regiao?.nome ? String(item["regiao-imediata"]["regiao-intermediaria"].UF.regiao.nome) : undefined,
    url: `https://servicodados.ibge.gov.br/api/v1/localidades/municipios/${item?.id}`,
  })).filter((item) => item.id && item.name);
}
