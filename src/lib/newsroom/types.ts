import type { ArticleStatus } from "@/data/content";

import type { ReviewRun, ReviewSummary } from "./review/types";

export interface ArticleSeo {
  /** Title tag sem o sufixo do site. Vazio = usa o título da matéria. */
  title: string;
  description: string;
  keyword: string;
  /** Vazio = canonical automático (URL da própria matéria). */
  canonical: string;
  index: boolean;
  ogTitle: string;
  ogDescription: string;
}

/** Matéria no formato editável da redação. */
export interface EditorArticle {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  excerpt: string;
  category: string;
  authorSlug: string;
  image: string;
  imageAlt: string;
  imageCredit: string;
  /** Parágrafos separados por linha em branco; "## " inicia intertítulo. */
  body: string;
  status: ArticleStatus;
  publishedAt: string;
  updatedAt: string;
  seo: ArticleSeo;
  lastReview?: ReviewRun;
  reviewHistory: ReviewSummary[];
}

/**
 * Contrato de persistência. Hoje: `localArticleRepository` (navegador).
 * Para Supabase/MySQL, implemente este contrato (ex.: via createServerFn ou tRPC)
 * e troque a exportação em `src/lib/newsroom/store.ts`.
 */
export interface ArticleRepository {
  list(): EditorArticle[];
  get(id: string): EditorArticle | undefined;
  save(article: EditorArticle): void;
  create(input: Partial<EditorArticle>): EditorArticle;
  remove(id: string): void;
  reset(): void;
}
