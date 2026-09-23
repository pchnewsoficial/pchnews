import type { EditorArticle } from "../types";
import { AGENTS } from "./agents";
import { getField, setField } from "./fields";
import type {
  AgentProgress,
  Resolution,
  ReviewRun,
  ReviewSummary,
  SeverityCounts,
  Suggestion,
} from "./types";

/**
 * Motor de revisão. Hoje roda regras locais determinísticas no navegador.
 * Para plugar um modelo de linguagem real, crie outro `ReviewEngine` cujo
 * `run` chame um createServerFn (a chave do modelo fica no servidor) e
 * devolva sugestões no mesmo formato `Suggestion` — o editor não muda.
 */
export interface ReviewEngine {
  id: string;
  label: string;
  run(article: EditorArticle, onProgress: (p: AgentProgress) => void): Promise<ReviewRun>;
}

export function contentHash(a: EditorArticle) {
  const s = [a.title, a.subtitle, a.excerpt, a.body, a.slug, a.seo.title, a.seo.description, a.seo.keyword, a.image, a.imageAlt, a.imageCredit, a.category, a.authorSlug].join("\u0001");
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

// Pausa curta apenas para o progresso por agente ser perceptível na tela.
const uiPace = () => new Promise((resolve) => setTimeout(resolve, 200));

export const ruleEngine: ReviewEngine = {
  id: "regras-locais",
  label: "Regras locais determinísticas",
  async run(article, onProgress) {
    const startedAt = new Date().toISOString();
    AGENTS.forEach((agent) => onProgress({ agentId: agent.id, state: "pendente" }));
    const suggestions: Suggestion[] = [];
    const agents: ReviewRun["agents"] = [];
    for (const agent of AGENTS) {
      onProgress({ agentId: agent.id, state: "executando" });
      await uiPace();
      const t0 = performance.now();
      const found = agent.run(article);
      agents.push({ id: agent.id, name: agent.name, count: found.length, durationMs: Math.round(performance.now() - t0) });
      suggestions.push(...found);
      onProgress({ agentId: agent.id, state: "concluido", count: found.length });
    }
    return {
      id: `rev-${Date.now().toString(36)}`,
      engine: { id: this.id, label: this.label },
      startedAt,
      finishedAt: new Date().toISOString(),
      contentHash: contentHash(article),
      agents,
      suggestions,
      resolutions: {},
    };
  },
};

export const reviewEngine: ReviewEngine = ruleEngine;

export function applySuggestion(a: EditorArticle, s: Suggestion): { ok: boolean; article: EditorArticle } {
  if (!s.fix) return { ok: false, article: a };
  const current = getField(a, s.field);
  if (s.fix.type === "set") {
    if (current !== s.fix.expected) return { ok: false, article: a };
    return { ok: true, article: setField(a, s.field, s.fix.value) };
  }
  if (!current.includes(s.fix.find)) return { ok: false, article: a };
  return { ok: true, article: setField(a, s.field, current.replace(s.fix.find, s.fix.replace)) };
}

export function withResolution(a: EditorArticle, ids: string[], resolution: Resolution | null): EditorArticle {
  if (!a.lastReview) return a;
  const resolutions = { ...a.lastReview.resolutions };
  for (const id of ids) {
    if (resolution) resolutions[id] = resolution;
    else delete resolutions[id];
  }
  // Correções aplicadas pelo próprio pipeline mantêm a revisão válida.
  const keepFresh = a.lastReview.contentHash === contentHash(a) || resolution === "aplicada";
  return { ...a, lastReview: { ...a.lastReview, resolutions, contentHash: keepFresh ? contentHash(a) : a.lastReview.contentHash } };
}

export function countBySeverity(list: Suggestion[]): SeverityCounts {
  return list.reduce<SeverityCounts>((acc, s) => ({ ...acc, [s.severity]: acc[s.severity] + 1 }), { alta: 0, media: 0, baixa: 0 });
}

export type ReadinessState = "sem-revisao" | "desatualizada" | "revisao-necessaria" | "pronto";

export const READINESS_LABEL: Record<ReadinessState, string> = {
  "sem-revisao": "Sem revisão",
  desatualizada: "Revisão desatualizada",
  "revisao-necessaria": "Revisão necessária",
  pronto: "Pronto para publicar",
};

export function getReadiness(a: EditorArticle) {
  const run = a.lastReview;
  if (!run) return { state: "sem-revisao" as ReadinessState, counts: { alta: 0, media: 0, baixa: 0 }, open: [] as Suggestion[] };
  const open = run.suggestions.filter((s) => !run.resolutions[s.id]);
  const counts = countBySeverity(open);
  const stale = run.contentHash !== contentHash(a);
  const state: ReadinessState = counts.alta > 0 ? "revisao-necessaria" : stale ? "desatualizada" : "pronto";
  return { state, counts, open };
}

export function summarize(run: ReviewRun): ReviewSummary {
  const counts = countBySeverity(run.suggestions);
  return {
    id: run.id,
    finishedAt: run.finishedAt,
    engineLabel: run.engine.label,
    counts,
    total: run.suggestions.length,
    verdict: counts.alta > 0 ? "revisao" : "pronto",
  };
}
