import type { ApiProviderConfig } from "./types";

export const API_PROVIDERS: ApiProviderConfig[] = [
  { id: "open-meteo", name: "Open-Meteo", category: "Clima", requiresApiKey: false, baseUrl: "https://api.open-meteo.com", serverOnly: false, cacheTtlSeconds: 600 },
  { id: "bcb", name: "Banco Central do Brasil", category: "Dados públicos/economia", requiresApiKey: false, baseUrl: "https://api.bcb.gov.br", serverOnly: true, cacheTtlSeconds: 900 },
  { id: "openstreetmap", name: "OpenStreetMap/Nominatim", category: "Geolocalização", requiresApiKey: false, baseUrl: "https://nominatim.openstreetmap.org", serverOnly: true, cacheTtlSeconds: 86400 },
  { id: "image-charts", name: "Image-Charts", category: "Gráficos/QR", requiresApiKey: false, baseUrl: "https://image-charts.com", serverOnly: true, cacheTtlSeconds: 86400 },
  { id: "mediastack", name: "Mediastack", category: "Radar de notícias", requiresApiKey: true, envVar: "MEDIASTACK_API_KEY", baseUrl: "https://api.mediastack.com", serverOnly: true, cacheTtlSeconds: 300 },
  { id: "currents", name: "Currents", category: "Radar de notícias", requiresApiKey: true, envVar: "CURRENTS_API_KEY", baseUrl: "https://api.currentsapi.services", serverOnly: true, cacheTtlSeconds: 300 },
  { id: "api-football", name: "API-FOOTBALL", category: "Esportes", requiresApiKey: true, envVar: "API_FOOTBALL_KEY", baseUrl: "https://v3.football.api-sports.io", serverOnly: true, cacheTtlSeconds: 60 },
  { id: "thesportsdb", name: "TheSportsDB", category: "Esportes", requiresApiKey: false, baseUrl: "https://www.thesportsdb.com", serverOnly: true, cacheTtlSeconds: 60 },
  { id: "fipe", name: "FIPE/veículos", category: "Veículos", requiresApiKey: false, baseUrl: "https://parallelum.com.br/fipe", serverOnly: true, cacheTtlSeconds: 86400 },
  { id: "camara", name: "Câmara dos Deputados — Dados Abertos", category: "Dados públicos/legislativo", requiresApiKey: false, baseUrl: "https://dadosabertos.camara.leg.br/api/v2", serverOnly: true, cacheTtlSeconds: 900 },
  { id: "ibge", name: "IBGE — Serviço de Dados", category: "Dados públicos/estatística e território", requiresApiKey: false, baseUrl: "https://servicodados.ibge.gov.br/api", serverOnly: true, cacheTtlSeconds: 900 },
];

export function getProvider(id: string) { return API_PROVIDERS.find(provider => provider.id === id); }

export function getApiHealth() {
  return API_PROVIDERS.map(provider => {
    const configured = !provider.requiresApiKey || Boolean(provider.envVar && process.env[provider.envVar]);
    return { id: provider.id, name: provider.name, category: provider.category, baseUrl: provider.baseUrl, requiresApiKey: provider.requiresApiKey, configured, status: configured ? 'ready' as const : 'not_configured' as const };
  });
}