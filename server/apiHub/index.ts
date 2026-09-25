import { getHealth } from "./core";
import { PROVIDERS } from "./providers";

export * from "./core";
export * from "./providers";

/** Safe status snapshot for the admin panel: never includes env var values. */
export function apiHubStatus() {
  return PROVIDERS.map((p) => {
    const h = getHealth(p.id);
    return {
      id: p.id, name: p.name, category: p.category, status: p.status, requiresKey: p.requiresKey,
      envVars: p.envVars, docsUrl: p.docsUrl, configured: p.isConfigured(),
      health: { ...h, state: h.lastErrorAt && (!h.lastOkAt || h.lastErrorAt > h.lastOkAt) ? "erro" : h.lastOkAt ? "ok" : "sem-chamadas" },
    };
  });
}
