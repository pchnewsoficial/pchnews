import { getCategory, getColumnist } from "@/data/content";

export const SITE_NAME = "PCH News";
export const SITE_TAGLINE = "Notícias para libertar a mente";
export const SITE_DESCRIPTION =
  "Jornalismo independente em português do Brasil: política, economia, tecnologia, cultura, esporte e opinião assinada.";

export const absoluteUrl = (origin: string, path: string) =>
  /^https?:\/\//.test(path) ? path : `${origin}${path.startsWith("/") ? path : `/${path}`}`;

interface PageHeadInput {
  origin: string;
  path: string;
  title: string;
  description: string;
  image?: string;
  type?: "website" | "article" | "profile";
  noindex?: boolean;
  extra?: Array<Record<string, string>>;
}

export function pageHead({ origin, path, title, description, image, type = "website", noindex, extra = [] }: PageHeadInput) {
  const url = absoluteUrl(origin, path);
  const img = image ? absoluteUrl(origin, image) : undefined;
  const meta: Array<Record<string, string>> = [
    { title },
    { name: "description", content: description },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:type", content: type },
    { property: "og:url", content: url },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    { name: "robots", content: noindex ? "noindex, follow" : "index, follow, max-image-preview:large" },
    ...extra,
  ];
  if (img) meta.push({ property: "og:image", content: img }, { name: "twitter:image", content: img });
  return { meta, links: [{ rel: "canonical", href: url }] };
}

export const jsonLdScript = (data: unknown) => ({ type: "application/ld+json", children: JSON.stringify(data) });

export function organizationLd(origin: string) {
  return {
    "@context": "https://schema.org",
    "@type": "NewsMediaOrganization",
    "@id": `${origin}/#organizacao`,
    name: SITE_NAME,
    slogan: SITE_TAGLINE,
    url: `${origin}/`,
    email: "redacao@pchnews.com.br",
  };
}

export function websiteLd(origin: string) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: `${origin}/`,
    inLanguage: "pt-BR",
    publisher: { "@id": `${origin}/#organizacao` },
  };
}

export function breadcrumbLd(origin: string, items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({ "@type": "ListItem", position: i + 1, name: item.name, item: absoluteUrl(origin, item.path) })),
  };
}

export interface NewsLdInput {
  slug: string;
  title: string;
  description: string;
  image?: string;
  publishedAt: string;
  modifiedAt?: string;
  authorSlug: string;
  category: string;
  canonical?: string;
}

export function newsArticleLd(origin: string, a: NewsLdInput) {
  const url = a.canonical || absoluteUrl(origin, `/noticia/${a.slug}`);
  const author = getColumnist(a.authorSlug);
  return {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    headline: a.title.slice(0, 110),
    description: a.description,
    ...(a.image ? { image: [absoluteUrl(origin, a.image)] } : {}),
    datePublished: a.publishedAt,
    dateModified: a.modifiedAt ?? a.publishedAt,
    articleSection: getCategory(a.category)?.name,
    inLanguage: "pt-BR",
    author: author
      ? [{ "@type": "Person", name: author.name, url: absoluteUrl(origin, `/colunistas/${author.slug}`) }]
      : [{ "@type": "Organization", name: SITE_NAME, url: `${origin}/` }],
    publisher: { "@type": "NewsMediaOrganization", "@id": `${origin}/#organizacao`, name: SITE_NAME, url: `${origin}/` },
  };
}
