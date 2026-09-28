import officialLogoUrl from "@/assets/pch-news-official-current.svg";

const HOSTINGPRESS_ORIGIN = "https://pchnews.hostingpress.com.br";
const WORKER_IMAGE_ORIGIN = import.meta.env.VITE_WORKER_IMAGE_ORIGIN?.trim() || "https://pchnews.pchnews-oficial.workers.dev";

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

  // 1) Artwork stored on the article always wins: uploads (Storage/https) and
  //    site-relative assets such as /brand/pilulas/*.svg.
  if (image && (/^https?:\/\//i.test(image) || image.startsWith("/"))) {
    return image;
  }

  // 2) Only archive items that really came from HostingPRESS fall back to the
  //    Worker image proxy. Authorship (e.g. Evaldo Poeta) no longer implies
  //    legacy, so Pílulas published natively in PCH News keep their own art.
  if (sourceUrl.startsWith(`${HOSTINGPRESS_ORIGIN}/materia/`)) {
    return `${WORKER_IMAGE_ORIGIN}/legacy-image/${encodeURIComponent(sourceUrl)}`;
  }

  return officialLogoUrl;
}
