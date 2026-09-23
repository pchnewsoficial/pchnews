import { useSyncExternalStore } from "react";

import { articles, type Article } from "@/data/content";

import type { ArticleRepository, EditorArticle } from "./types";

const STORAGE_KEY = "pch-news.newsroom.v1";

function fromContent(a: Article): EditorArticle {
  return {
    id: a.slug,
    slug: a.slug,
    title: a.title,
    subtitle: a.subtitle,
    excerpt: a.excerpt,
    category: a.category,
    authorSlug: a.authorSlug,
    image: a.image,
    imageAlt: "",
    imageCredit: a.imageCredit,
    body: a.body.join("\n\n"),
    status: a.status,
    publishedAt: a.publishedAt,
    updatedAt: a.publishedAt,
    seo: {
      title: a.status === "publicado" && a.title.length <= 60 ? a.title : "",
      description: a.status === "publicado" ? a.excerpt : "",
      keyword: "",
      canonical: "",
      index: true,
      ogTitle: "",
      ogDescription: "",
    },
    reviewHistory: [],
  };
}

/** Pauta de demonstração com problemas reais para exercitar o pipeline de revisão. */
const demoDraft: EditorArticle = {
  id: "demo-corredores-de-onibus",
  slug: "Prefeitura anuncia corredores",
  title: "Prefeitura anuncia 14 corredores de ônibus e promete obras em maio.",
  subtitle: "Plano prevê investimento de R$ 480 milhões; oposição cobra estudo de impacto no comércio",
  excerpt: "",
  category: "politica",
  authorSlug: "rafael-munhoz",
  image: "",
  imageAlt: "",
  imageCredit: "",
  body: [
    "A Prefeitura anunciou ontem um pacote de 12 corredores exclusivos de ônibus que devem reduzir em até 20% o tempo de viagem nas avenidas mais congestionadas da cidade. O plano, apresentado em coletiva no Paço Municipal, prevê que as obras comecem à partir de maio e sejam concluídas em etapas ao longo de dois anos, com prioridade para as regiões norte e leste, onde se concentram os trajetos mais longos entre casa e trabalho.",
    "Segundo a Secretaria de Mobilidade, o investimento estimado é de R$ 480 milhões, com recursos do Tesouro municipal e de uma linha de financiamento federal. Houveram, porém, críticas de vereadores da oposição sobre a ausência de estudo de impacto no comércio local. A reação da base governista foi espetacular.",
    "\"É um projeto que vai mudar a vida de quem depende do transporte coletivo\", disse o secretário de Mobilidade, Paulo Andrade, durante a apresentação.",
    "Especialistas dizem que corredores exclusivos só funcionam quando acompanhados de aumento da frota. Vale ressaltar que a cidade não amplia o número de ônibus desde 2019.",
    "## Comerciantes pedem diálogo",
    "\"Não fomos consultados antes do anúncio e queremos participar da definição dos trechos\"; a associação de lojistas da avenida Central quer audiência pública antes do início das obras.",
    "A prefeitura afirma que fará reuniões por bairro nas próximas semanas e que o cronograma detalhado será publicado no Diário Oficial do município até o fim do mês.",
  ].join("\n\n"),
  status: "rascunho",
  publishedAt: "2026-03-19T08:00:00-03:00",
  updatedAt: "2026-03-18T17:30:00-03:00",
  seo: { title: "", description: "", keyword: "", canonical: "", index: true, ogTitle: "", ogDescription: "" },
  reviewHistory: [],
};

const seed = (): EditorArticle[] => [demoDraft, ...articles.map(fromContent)];

let serverSnapshot: EditorArticle[] | null = null;
let cache: EditorArticle[] | null = null;
const listeners = new Set<() => void>();

function getServerSnapshot() {
  if (!serverSnapshot) serverSnapshot = seed();
  return serverSnapshot;
}

function read(): EditorArticle[] {
  if (cache) return cache;
  if (typeof window === "undefined") return getServerSnapshot();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    cache = raw ? (JSON.parse(raw) as EditorArticle[]) : seed();
  } catch {
    cache = seed();
  }
  return cache;
}

function write(next: EditorArticle[]) {
  cache = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Armazenamento cheio ou bloqueado: mantém em memória.
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) {
      cache = null;
      listener();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export const localArticleRepository: ArticleRepository = {
  list: read,
  get: (id) => read().find((a) => a.id === id),
  save(article) {
    const list = read();
    write(list.some((a) => a.id === article.id) ? list.map((a) => (a.id === article.id ? article : a)) : [article, ...list]);
  },
  create(input) {
    const now = new Date().toISOString();
    const article: EditorArticle = {
      ...demoDraft,
      id: `m-${Date.now().toString(36)}`,
      slug: "",
      title: "",
      subtitle: "",
      excerpt: "",
      body: "",
      image: "",
      imageCredit: "",
      status: "rascunho",
      publishedAt: now,
      updatedAt: now,
      seo: { ...demoDraft.seo },
      reviewHistory: [],
      lastReview: undefined,
      ...input,
    };
    write([article, ...read()]);
    return article;
  },
  remove(id) {
    write(read().filter((a) => a.id !== id));
  },
  reset() {
    write(seed());
  },
};

/** Troque aqui pelo repositório Supabase/MySQL quando o banco estiver conectado. */
export const articleRepository: ArticleRepository = localArticleRepository;

export function useArticles() {
  return useSyncExternalStore(subscribe, read, getServerSnapshot);
}

export function useArticle(id: string) {
  return useArticles().find((a) => a.id === id);
}

export const imageLibrary = (): { src: string; label: string }[] => {
  const seen = new Set<string>();
  return articles
    .filter((a) => (seen.has(a.image) ? false : (seen.add(a.image), true)))
    .map((a) => ({ src: a.image, label: a.title }));
};
