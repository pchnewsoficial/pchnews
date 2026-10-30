import { getSupabaseAdmin } from "./_core/supabase";
import { storagePut } from "./storage";

export const HOSTINGPRESS_FEED_URL = "https://pchnews.hostingpress.com.br/feed/";
const FEED_ORIGIN = "https://pchnews.hostingpress.com.br";
const IMAGE_HOSTS = new Set(["hostingpress.com.br", "pchnews.hostingpress.com.br"]);
const USER_AGENT = "PCH-News-RSS-Importer/1.0 (+https://pchnews.com.br)";
const MAX_FEED_BYTES = 5_000_000;
const MAX_IMAGE_BYTES = 5_000_000;
const MAX_IMPORTS_PER_RUN = 10;
const ALLOWED_TAGS = new Set(["p", "br", "strong", "b", "em", "i", "u", "h2", "h3", "h4", "ul", "ol", "li", "blockquote", "a", "img", "figure", "figcaption", "hr"]);
const VOID_TAGS = new Set(["br", "img", "hr"]);

export type HostingPressRssItem = {
  title: string;
  url: string;
  publishedAt: Date;
  category: string;
  author: string;
  summary: string;
  bodyHtml: string;
  imageUrl: string;
};

function decodeXml(value: string): string {
  const withoutCdata = value.replace(/^\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*$/, "$1");
  return withoutCdata
    .replace(/&#x([\da-f]+);/gi, (_match, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_match, dec) => String.fromCodePoint(Number(dec)))
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&apos;|&#39;/g, "'").replace(/&amp;/g, "&");
}

function tagValue(xml: string, tagName: string): string {
  const escaped = tagName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = new RegExp(`<${escaped}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${escaped}\\s*>`, "i").exec(xml);
  return match ? decodeXml(match[1].trim()) : "";
}

function attributeValue(tag: string, name: string): string {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = new RegExp(`\\b${escaped}\\s*=\\s*([\"'])(.*?)\\1`, "i").exec(tag);
  return match ? decodeXml(match[2]) : "";
}

function absoluteSourceUrl(raw: string): string {
  try {
    const url = new URL(raw, FEED_ORIGIN);
    if (url.protocol !== "https:" || url.hostname !== "pchnews.hostingpress.com.br" || !url.pathname.startsWith("/materia/")) return "";
    return url.toString();
  } catch {
    return "";
  }
}

function safeImageUrl(raw: string, baseUrl = FEED_ORIGIN): string {
  try {
    const url = new URL(raw, baseUrl);
    if (url.protocol !== "https:" || !IMAGE_HOSTS.has(url.hostname) || !url.pathname.toLowerCase().match(/\.(png|jpe?g|webp|gif)$/)) return "";
    return url.toString();
  } catch {
    return "";
  }
}

function stripTags(value: string): string {
  return decodeXml(value.replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, "").replace(/<style\b[^>]*>[\s\S]*?<\/style\s*>/gi, "").replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim();
}

function sanitizeBodyHtml(html: string, articleUrl: string): string {
  const withoutActiveContent = html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<(script|style|iframe|object|embed|form|svg|math|template|noscript)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, "")
    .replace(/<(script|style|iframe|object|embed|form|svg|math|template|noscript)\b[^>]*\/?>/gi, "");

  return withoutActiveContent.replace(/<[^>]*>/g, (rawTag) => {
    const match = /^<\s*(\/?)\s*([a-z][a-z\d-]*)\b([^>]*)>$/i.exec(rawTag);
    if (!match) return "";
    const closing = Boolean(match[1]);
    const name = match[2].toLowerCase();
    if (!ALLOWED_TAGS.has(name)) return "";
    if (closing) return VOID_TAGS.has(name) ? "" : `</${name}>`;
    if (name === "a") {
      const href = attributeValue(match[3], "href");
      try {
        const target = new URL(href, articleUrl);
        if ((target.protocol === "https:" || target.protocol === "mailto:") && target.protocol !== "mailto:") return `<a href="${escapeHtml(target.toString())}" rel="noopener noreferrer">`;
        if (target.protocol === "mailto:") return `<a href="${escapeHtml(target.toString())}">`;
      } catch { /* omit unsafe or malformed destination */ }
      return "<a>";
    }
    if (name === "img") {
      const src = safeImageUrl(attributeValue(match[3], "src"), articleUrl);
      if (!src) return "";
      const alt = attributeValue(match[3], "alt").slice(0, 300);
      return `<img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}" loading="lazy">`;
    }
    return `<${name}>`;
  });
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character] || character);
}

function dateInSaoPaulo(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function getImageUrl(itemXml: string, bodyHtml: string, articleUrl: string): string {
  const enclosure = /<enclosure\b[^>]*>/i.exec(itemXml)?.[0] || "";
  const media = /<media:content\b[^>]*>/i.exec(itemXml)?.[0] || "";
  const bodyImage = /<img\b[^>]*>/i.exec(bodyHtml)?.[0] || "";
  const candidate = attributeValue(enclosure, "url") || attributeValue(media, "url") || attributeValue(bodyImage, "src");
  return candidate ? safeImageUrl(candidate, articleUrl) : "";
}

export function parseHostingPressRss(xml: string): HostingPressRssItem[] {
  if (!/<rss\b/i.test(xml) || !/<channel\b/i.test(xml)) throw new Error("A origem não respondeu com um feed RSS válido.");
  const items: HostingPressRssItem[] = [];
  for (const match of xml.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item\s*>/gi)) {
    const itemXml = match[1];
    const title = stripTags(tagValue(itemXml, "title"));
    const url = absoluteSourceUrl(tagValue(itemXml, "link") || tagValue(itemXml, "guid"));
    const dateRaw = stripTags(tagValue(itemXml, "pubDate"));
    const publishedAt = new Date(dateRaw);
    if (!title || !url || !dateRaw || !Number.isFinite(publishedAt.getTime())) continue;

    const encoded = tagValue(itemXml, "content:encoded") || tagValue(itemXml, "description");
    const bodyHtml = sanitizeBodyHtml(encoded, url);
    const text = stripTags(encoded);
    const summary = stripTags(tagValue(itemXml, "description")) || text.slice(0, 240);
    const imageUrl = getImageUrl(itemXml, encoded, url);
    items.push({
      title: title.slice(0, 500),
      url,
      publishedAt,
      category: stripTags(tagValue(itemXml, "category")).slice(0, 120) || "Notícias",
      author: stripTags(tagValue(itemXml, "dc:creator")).slice(0, 180) || "Redação PCH News",
      summary: summary.slice(0, 1000),
      bodyHtml: bodyHtml || `<p>${escapeHtml(text.slice(0, 1000))}</p>`,
      imageUrl,
    });
  }
  return items;
}

function slugFromUrl(url: string): string {
  const finalSegment = new URL(url).pathname.split("/").filter(Boolean).at(-1) || "materia";
  return finalSegment.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 150) || "materia";
}

function imageExtension(contentType: string): string {
  if (contentType.includes("image/png")) return "png";
  if (contentType.includes("image/webp")) return "webp";
  if (contentType.includes("image/gif")) return "gif";
  return "jpg";
}

function validImageBytes(bytes: Uint8Array, contentType: string): boolean {
  if (contentType.includes("image/png")) return bytes.length >= 8 && [137, 80, 78, 71, 13, 10, 26, 10].every((byte, index) => bytes[index] === byte);
  if (contentType.includes("image/jpeg")) return bytes.length >= 3 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  if (contentType.includes("image/gif")) return bytes.length >= 6 && new TextDecoder().decode(bytes.slice(0, 6)).startsWith("GIF8");
  if (contentType.includes("image/webp")) return bytes.length >= 12 && new TextDecoder().decode(bytes.slice(0, 4)) === "RIFF" && new TextDecoder().decode(bytes.slice(8, 12)) === "WEBP";
  return false;
}

async function copyImageToPchNews(item: HostingPressRssItem, slug: string): Promise<string> {
  if (!item.imageUrl) return "";
  const response = await fetch(item.imageUrl, { headers: { "User-Agent": USER_AGENT }, redirect: "error" });
  if (!response.ok || !response.body) return "";
  const size = Number(response.headers.get("content-length") || "0");
  if (size > MAX_IMAGE_BYTES) return "";
  const contentType = (response.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
  if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(contentType)) return "";
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes.length > MAX_IMAGE_BYTES || !validImageBytes(bytes, contentType)) return "";
  const uploaded = await storagePut(`editorial/hostingpress/${slug}.${imageExtension(contentType)}`, bytes, contentType);
  return uploaded.url;
}

export async function syncHostingPressRss() {
  const response = await fetch(HOSTINGPRESS_FEED_URL, {
    headers: { Accept: "application/rss+xml, application/xml;q=0.9, text/xml;q=0.8", "User-Agent": USER_AGENT },
    redirect: "error",
  });
  if (!response.ok || !response.body) throw new Error(`Feed da HostingPRESS respondeu HTTP ${response.status}.`);
  const contentType = (response.headers.get("content-type") || "").toLowerCase();
  if (!contentType.includes("xml") && !contentType.includes("rss")) throw new Error(`Tipo de conteúdo inesperado no feed (${contentType || "desconhecido"}).`);
  const declaredSize = Number(response.headers.get("content-length") || "0");
  if (declaredSize > MAX_FEED_BYTES) throw new Error("O feed excede o limite de tamanho aceito.");
  const xml = await response.text();
  if (new TextEncoder().encode(xml).byteLength > MAX_FEED_BYTES) throw new Error("O feed excede o limite de tamanho aceito.");
  const feedItems = parseHostingPressRss(xml).slice(0, 50);
  if (!feedItems.length) throw new Error("O feed não contém matérias publicadas válidas.");

  const db = getSupabaseAdmin();
  const urls = feedItems.map((item) => item.url);
  const byUrl = await db.from("articles").select("id,sourceUrl").in("sourceUrl", urls);
  if (byUrl.error) throw byUrl.error;
  const existingUrls = new Set((byUrl.data || []).map((row: any) => String(row.sourceUrl || "")));

  let imported = 0;
  let duplicates = 0;
  let imageFailures = 0;
  for (const item of feedItems) {
    if (imported >= MAX_IMPORTS_PER_RUN) break;
    if (existingUrls.has(item.url)) {
      duplicates++;
      continue;
    }

    const sourceSlug = slugFromUrl(item.url);
    const id = `hostingpress-rss-${sourceSlug}`;
    const slug = `hp-${sourceSlug}`;
    let image = "";
    if (item.imageUrl) {
      try { image = await copyImageToPchNews(item, sourceSlug); }
      catch (error) { imageFailures++; console.warn("[PCH][HostingPRESS RSS] Image copy failed", { url: item.url, message: String(error) }); }
    }
    const createdAt = item.publishedAt.toISOString();
    const row = {
      id,
      title: item.title,
      category: item.category,
      author: item.author,
      authorOpenId: null,
      summary: item.summary,
      date: dateInSaoPaulo(item.publishedAt),
      updated: "Importado automaticamente da HostingPRESS",
      status: "published",
      views: 0,
      image: image || item.imageUrl,
      bodyHtml: item.bodyHtml,
      scheduledAt: null,
      editionNumber: null,
      authorProfileSlug: null,
      tags: JSON.stringify(["HostingPRESS", item.category]),
      youtubeUrl: null,
      socialLinks: null,
      scope: "national",
      region: null,
      state: null,
      country: "Brasil",
      language: "pt-BR",
      featured: false,
      sourceUrl: item.url,
      sourceName: "PCH News / HostingPRESS",
      slug,
      seoTitle: item.title,
      metaDescription: item.summary.slice(0, 300),
      canonicalUrl: item.url,
      focusKeyword: null,
      ogTitle: item.title,
      ogDescription: item.summary.slice(0, 300),
      imageAlt: item.title,
      noindex: false,
      editorialChecklist: {},
      editorialNotes: null,
      contraponto: null,
      keyTakeaway: null,
      createdAt,
      updatedAt: new Date().toISOString(),
    };
    const { error } = await db.from("articles").insert(row);
    if (error) {
      if (image) console.warn("[PCH][HostingPRESS RSS] Article insert failed after image upload", { url: item.url, message: error.message });
      throw error;
    }
    existingUrls.add(item.url);
    imported++;
  }

  return { feedItems: feedItems.length, imported, duplicates, imageFailures, source: HOSTINGPRESS_FEED_URL };
}
