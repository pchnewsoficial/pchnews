import officialLogoUrl from "@/assets/pch-news-official-current.svg";

const HOSTINGPRESS_ORIGIN = "https://pchnews.hostingpress.com.br";
const WORKER_IMAGE_ORIGIN = "https://pch-news.pchnews-oficial.workers.dev";

function slugify(value: string) {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

/**
 * Resolve editorial artwork without depending on /brand/media files from the
 * old static site. HostingPRESS stories are proxied through the Worker, which
 * discovers the original OpenGraph image and lets Cloudflare cache it.
 */
export function editorialImageUrl(article: {
  image?: string | null;
  sourceUrl?: string | null;
  sourceName?: string | null;
  author?: string | null;
  id?: string | null;
  title?: string | null;
}) {
  const image = article.image?.trim() || "";
  const sourceUrl = article.sourceUrl?.trim() || "";
  const legacyArticle =
    sourceUrl.startsWith(`${HOSTINGPRESS_ORIGIN}/materia/`) ||
    article.sourceName?.toLowerCase().includes("hostingpress") ||
    article.author?.toLowerCase().includes("evaldo poeta") ||
    article.id?.startsWith("evaldo-");

  let legacySource = sourceUrl;
  if (!legacySource && legacyArticle) {
    const sourceSlug = article.id?.match(/^evaldo-(?:pilula-)?\d+-(.+)$/)?.[1] || slugify(article.title || "");
    if (sourceSlug) legacySource = `${HOSTINGPRESS_ORIGIN}/materia/${sourceSlug}`;
  }

  if (legacySource.startsWith(`${HOSTINGPRESS_ORIGIN}/materia/`)) {
    return `${WORKER_IMAGE_ORIGIN}/legacy-image/${encodeURIComponent(legacySource)}`;
  }

  if (image && (/^https?:\\/\\//i.test(image) || image.startsWith("/assets/") || image.startsWith("/storage/"))) {
    return image;
  }

  return officialLogoUrl;
}
