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
  /** Social image defaults to the main article image when empty. */
  ogImage?: string;
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
  body: string;
  /** Editorial metadata preserved from the original PCH News editor. */
  scope?: "local" | "regional" | "state" | "national" | "international";
  region?: string;
  state?: string;
  country?: string;
  language?: string;
  tags?: string[];
  youtubeUrl?: string;
  featured?: boolean;
  status: ArticleStatus;
  scheduledAt?: string;
  publishedAt: string;
  updatedAt: string;
  seo: ArticleSeo;
  /** Legacy PCH fields retained during migration. */
  socialLinks?: {
    instagram?: string;
    facebook?: string;
    x?: string;
    linkedin?: string;
    tiktok?: string;
    website?: string;
  };
  lastReview?: ReviewRun;
  reviewHistory: ReviewSummary[];
}

export interface HostingPressDistribution {
  enabled: boolean;
  feedUrl?: string;
  tokenConfigured: boolean;
  sourceCredit: string;
  lastImportedAt?: string;
  lastPublishedAt?: string;
  status: "not-configured" | "ready" | "active" | "error";
}

/**
 * Contract de persistência. Hoje: localArticleRepository (navegador).
 * Para Supabase/MySQL, implemente este contrato via server function/API.
 */
export interface ArticleRepository {
  list(): EditorArticle[];
  get(id: string): EditorArticle | undefined;
  save(article: EditorArticle): void;
  create(input: Partial<EditorArticle>): EditorArticle;
  remove(id: string): void;
  reset(): void;
}
