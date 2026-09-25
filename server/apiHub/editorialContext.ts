import { getApiHealth, getBcbSeries, getNewsRadar, getWeather, geocodeBrazil, getChamberPropositions, getIbgeMunicipalities } from "./index";
import type { NormalizedNewsItem } from "./types";

export type EditorialResearchSource = {
  provider: string;
  title: string;
  url: string;
  publishedAt?: string;
  source?: string;
};

export type EditorialResearchContext = {
  fetchedAtMs: number;
  query: string;
  locationQuery?: string;
  sources: EditorialResearchSource[];
  news: NormalizedNewsItem[];
  location?: {
    displayName: string;
    latitude: number;
    longitude: number;
  };
  weather?: {
    temperatureC?: number;
    apparentTemperatureC?: number;
    humidity?: number;
    windKmh?: number;
    precipitationMm?: number;
  };
  chamber?: Array<{ id: number; title: string; summary?: string; status?: string; presentationDate?: string; url: string }>;
  ibgeMunicipalities?: Array<{ id: number; name: string; stateAbbreviation?: string; stateName?: string; region?: string; url: string }>;
  economic?: Array<{
    seriesId: number;
    label: string;
    sourceUrl: string;
    observations: Array<{ date: string; value: string }>;
  }>;
  providers: Record<string, { status: "ok" | "skipped" | "error"; count?: number; message?: string }>;
  limitations: string[];
};

type CollectInput = {
  title: string;
  category: string;
  region?: string | null;
  state?: string | null;
  country?: string | null;
};

const ECONOMIC_TERMS = /economia|finan[çc]|neg[oó]cios|infla[çc][aã]o|ipca|selic|juros|c[aâ]mbio|d[oó]lar|pib|emprego|desemprego|pre[çc]o|pre[çc]os|fiscal|monet[aá]ri|taxa|renda/i;

const toDateOnly = (date: Date) => date.toISOString().slice(0, 10);

const normalizeBcb = (raw: unknown) =>
  Array.isArray(raw)
    ? raw
        .map((item: any) => ({ date: String(item?.data || ""), value: String(item?.valor ?? "") }))
        .filter((item) => item.date && item.value)
        .slice(-8)
    : [];

export async function collectEditorialResearchContext(input: CollectInput): Promise<EditorialResearchContext> {
  const fetchedAtMs = Date.now();
  const query = input.title.trim().slice(0, 120);
  const locationQuery = [input.region, input.state, input.country].filter((value) => value?.trim()).join(", ") || undefined;
  const health = getApiHealth();
  const providers: EditorialResearchContext["providers"] = {};
  const limitations: string[] = [];
  const sources: EditorialResearchSource[] = [];
  const news: NormalizedNewsItem[] = [];
  let location: EditorialResearchContext["location"];
  let weather: EditorialResearchContext["weather"];
  const economic: NonNullable<EditorialResearchContext["economic"]> = [];
  const chamber: NonNullable<EditorialResearchContext["chamber"]> = [];
  const ibgeMunicipalities: NonNullable<EditorialResearchContext["ibgeMunicipalities"]> = [];

  const newsProvider = health.find((item) => item.id === "currents" && item.configured)
    ? "currents"
    : health.find((item) => item.id === "mediastack" && item.configured)
      ? "mediastack"
      : null;

  if (!newsProvider) {
    providers.currents = { status: health.find((item) => item.id === "currents")?.configured ? "ok" : "skipped", message: "Nenhum provedor de radar de notícias configurado." };
    providers.mediastack = { status: health.find((item) => item.id === "mediastack")?.configured ? "ok" : "skipped", message: "Nenhum provedor de radar de notícias configurado." };
    limitations.push("Radar de notícias indisponível: configure MEDIASTACK_API_KEY ou CURRENTS_API_KEY.");
  } else {
    try {
      const items = await getNewsRadar(newsProvider, query);
      news.push(...items.slice(0, 8));
      providers[newsProvider] = { status: "ok", count: news.length };
      for (const item of news) sources.push({ provider: newsProvider, title: item.title, url: item.url, publishedAt: item.publishedAt, source: item.source });
      const other = newsProvider === "currents" ? "mediastack" : "currents";
      providers[other] = { status: health.find((item) => item.id === other)?.configured ? "skipped" : "skipped", message: "Não consultado para evitar duplicação e custo." };
    } catch (error) {
      providers[newsProvider] = { status: "error", message: error instanceof Error ? error.message : "Falha no provedor." };
      limitations.push("O radar de notícias não respondeu nesta execução; a checagem manual continua obrigatória.");
    }
  }

  if (!locationQuery) {
    providers.openstreetmap = { status: "skipped", message: "Nenhuma região/estado/país foi informado na matéria." };
  } else {
    try {
      const raw = await geocodeBrazil(locationQuery) as any[];
      const first = Array.isArray(raw) ? raw[0] : null;
      if (first?.lat && first?.lon) {
        location = { displayName: String(first.display_name || locationQuery), latitude: Number(first.lat), longitude: Number(first.lon) };
        providers.openstreetmap = { status: "ok", count: Array.isArray(raw) ? raw.length : 1 };
      } else {
        providers.openstreetmap = { status: "error", message: "Localização não encontrada." };
        limitations.push("Não foi possível determinar coordenadas editoriais a partir da região informada.");
      }
    } catch (error) {
      providers.openstreetmap = { status: "error", message: error instanceof Error ? error.message : "Falha no geocodificador." };
      limitations.push("Geocodificação indisponível nesta execução.");
    }
  }

  if (locationQuery) {
    try {
      const cityQuery = locationQuery.split(",")[0]?.trim() || locationQuery;
      const items = await getIbgeMunicipalities(cityQuery);
      ibgeMunicipalities.push(...items);
      providers.ibge = { status: "ok", count: ibgeMunicipalities.length };
      for (const item of ibgeMunicipalities) sources.push({ provider: "ibge", title: `IBGE — ${item.name}${item.stateAbbreviation ? `/${item.stateAbbreviation}` : ""}`, url: item.url, source: "IBGE — Serviço de Dados" });
    } catch (error) {
      providers.ibge = { status: "error", message: error instanceof Error ? error.message : "Falha na API do IBGE." };
      limitations.push("Dados territoriais do IBGE não puderam ser consultados nesta execução.");
    }
  } else {
    providers.ibge = { status: "skipped", message: "Sem localização editorial informada." };
  }

  if (location) {
    try {
      const raw = await getWeather(location.latitude, location.longitude) as any;
      const current = raw?.current || {};
      weather = {
        temperatureC: Number.isFinite(Number(current.temperature_2m)) ? Number(current.temperature_2m) : undefined,
        apparentTemperatureC: Number.isFinite(Number(current.apparent_temperature)) ? Number(current.apparent_temperature) : undefined,
        humidity: Number.isFinite(Number(current.relative_humidity_2m)) ? Number(current.relative_humidity_2m) : undefined,
        windKmh: Number.isFinite(Number(current.wind_speed_10m)) ? Number(current.wind_speed_10m) : undefined,
        precipitationMm: Number.isFinite(Number(current.precipitation)) ? Number(current.precipitation) : undefined,
      };
      providers["open-meteo"] = { status: "ok", count: 1 };
    } catch (error) {
      providers["open-meteo"] = { status: "error", message: error instanceof Error ? error.message : "Falha no serviço meteorológico." };
      limitations.push("Clima não disponível nesta execução.");
    }
  } else {
    providers["open-meteo"] = { status: "skipped", message: "Sem coordenadas editoriais." };
  }

  const chamberTerms = /pol[ií]tica|congresso|c[aâ]mara|deputad|projeto de lei|pl |pec |senado|governo|elei[cç][aã]o|legisla[cç][aã]o|vota[cç][aã]o|comiss[aã]o/i;
  if (chamberTerms.test(`${input.category} ${input.title}`)) {
    try {
      const items = await getChamberPropositions(query);
      chamber.push(...items);
      providers.camara = { status: "ok", count: chamber.length };
      for (const item of chamber) sources.push({ provider: "camara", title: item.title, url: item.url, publishedAt: item.presentationDate, source: "Câmara dos Deputados — Dados Abertos" });
    } catch (error) {
      providers.camara = { status: "error", message: error instanceof Error ? error.message : "Falha na API da Câmara." };
      limitations.push("Dados da Câmara dos Deputados não puderam ser consultados nesta execução.");
    }
  } else {
    providers.camara = { status: "skipped", message: "Tema não identificado como legislativo/político." };
  }

  if (ECONOMIC_TERMS.test(`${input.category} ${input.title}`)) {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 1000 * 60 * 60 * 24 * 90);
    const series = [
      { seriesId: 433, label: "IPCA", sourceUrl: "https://api.bcb.gov.br/dados/serie/bcdata.sgs.433/dados" },
      { seriesId: 4189, label: "Selic acumulada no mês", sourceUrl: "https://api.bcb.gov.br/dados/serie/bcdata.sgs.4189/dados" },
    ];
    providers.bcb = { status: "ok" };
    for (const item of series) {
      try {
        const raw = await getBcbSeries(item.seriesId, toDateOnly(startDate), toDateOnly(endDate));
        const observations = normalizeBcb(raw);
        economic.push({ ...item, observations });
      } catch (error) {
        providers.bcb = { status: "error", message: error instanceof Error ? error.message : "Falha no Banco Central." };
        limitations.push(`Série BCB ${item.seriesId} não pôde ser consultada nesta execução.`);
      }
    }
  } else {
    providers.bcb = { status: "skipped", message: "Tema não identificado como econômico." };
  }

  return { fetchedAtMs, query, locationQuery, sources, news, location, weather, chamber, ibgeMunicipalities, economic, providers, limitations };
}
