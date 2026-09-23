import type { EditorArticle } from "../types";

export type Severity = "alta" | "media" | "baixa";

export type Field =
  | "title"
  | "subtitle"
  | "excerpt"
  | "body"
  | "seoTitle"
  | "seoDescription"
  | "slug"
  | "keyword"
  | "image"
  | "imageAlt"
  | "imageCredit"
  | "category"
  | "authorSlug";

export type SuggestionFix =
  | { type: "replace"; find: string; replace: string }
  | { type: "set"; value: string; expected: string };

export interface Suggestion {
  id: string;
  agentId: string;
  severity: Severity;
  field: Field;
  /** Trecho exato afetado (usado para destacar e localizar no texto). */
  target: string;
  excerpt: string;
  message: string;
  fix?: SuggestionFix;
}

export interface AgentDefinition {
  id: string;
  name: string;
  description: string;
  run(article: EditorArticle): Suggestion[];
}

export type Resolution = "aplicada" | "ignorada";

export interface ReviewRun {
  id: string;
  engine: { id: string; label: string };
  startedAt: string;
  finishedAt: string;
  contentHash: string;
  agents: { id: string; name: string; count: number; durationMs: number }[];
  suggestions: Suggestion[];
  resolutions: Record<string, Resolution>;
}

export interface SeverityCounts {
  alta: number;
  media: number;
  baixa: number;
}

export interface ReviewSummary {
  id: string;
  finishedAt: string;
  engineLabel: string;
  counts: SeverityCounts;
  total: number;
  verdict: "pronto" | "revisao";
}

export interface AgentProgress {
  agentId: string;
  state: "pendente" | "executando" | "concluido";
  count?: number;
}
