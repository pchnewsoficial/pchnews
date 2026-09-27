import { getDb, saveArticle } from "./db";
import { storagePut } from "./storage";

const SOURCE = "https://pchnews.hostingpress.com.br";
const USER_AGENT = "PCH-News-Pilulas-Sync/1.0";

function decodeHtml(value: string) {
  return value.replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'").replace(/&lt;/gi, "<").replace(/&gt;/gi, ">")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)));
}
function stripTags(value: string) {
  return decodeHtml(value.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
}
function slugifyForStorage(value: string) { return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "pilula"; }
function absoluteUrl(value: string) {
  try { return new URL(value, SOURCE).toString(); } catch { return ""; }
}
function extractLinks(html: string) {
  const links = new Set<string>();
  const re = /href\s*=\s*["']([^"']*\/materia\/[^"']+)["']/gi;
  for (const match of html.matchAll(re)) {
    const url = absoluteUrl(decodeHtml(match[1]));
    if (url.startsWith(SOURCE + "/materia/")) links.add(url.split("#")[0]);
  }
  return Array.from(links);
}
function jsonLd(html: string) {
  for (const match of html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const parsed = JSON.parse(match[1].trim());
      const values = Array.isArray(parsed) ? parsed : [parsed];
      for (const value of values) if (value?.articleBody || value?.headline || value?.datePublished) return value;
    } catch {}
  }
  return null;
}
function meta(html: string, key: string, property = false) {
  const attr = property ? "property" : "name";
  const re = new RegExp("<meta[^>]+" + attr + "=[\\\"']" + key + "[\\\"'][^>]+content=[\\\"']([^\\\"']*)[\\\"'][^>]*>", "i");
  const match = re.exec(html);
  return match?.[1] ? decodeHtml(match[1]) : "";
}
function escapeHtml(value: string) {
  return value.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c] || c));
}
function toBodyHtml(text: string) {
  return text.split(/\n{2,}/).map((part) => part.trim()).filter(Boolean).slice(0, 120)
    .map((part) => "<p>" + escapeHtml(part) + "</p>").join("");
}
function extractImage(html: string, ld: any) {
  const candidate = typeof ld?.image === "string" ? ld.image : Array.isArray(ld?.image) ? ld.image[0] : ld?.image?.url;
  if (candidate) return absoluteUrl(candidate);
  const og = meta(html, "og:image", true);
  if (og) return absoluteUrl(og);
  const img = /<img[^>]+(?:src|data-src)=["']([^"']+)["'][^>]*>/i.exec(html)?.[1];
  return img ? absoluteUrl(img) : "";
}
function editionFromText(value: string) {
  const m = value.match(/edi(?:ç|c)[aã]o\s*(?:n[ºo°.]?\s*)?0*(\d{1,4})/i);
  return m ? Number(m[1]) : null;
}
function dateFromText(value: string) {
  const m = value.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  return m ? m[3] + "-" + m[2] + "-" + m[1] : new Date().toISOString().slice(0, 10);
}

export async function syncHostingPressPilulas(accessToken?: string | null) {
  const homeResponse = await fetch(SOURCE + "/", { headers: { "user-agent": USER_AGENT }, redirect: "follow" });
  if (!homeResponse.ok) throw new Error("HostingPRESS respondeu HTTP " + homeResponse.status + ".");
  const home = await homeResponse.text();
  const links = extractLinks(home).slice(0, 30);
  if (!links.length) throw new Error("Nenhuma matéria /materia/ foi encontrada na fonte HostingPRESS.");

  const imported: string[] = [];
  const db = await getDb(accessToken);
  for (const url of links) {
    try {
      const response = await fetch(url, { headers: { "user-agent": USER_AGENT }, redirect: "follow" });
      if (!response.ok) continue;
      const html = await response.text();
      const lower = html.toLowerCase();
      if (!lower.includes("pílula do poeta") || !lower.includes("evaldo poeta")) continue;
      const ld = jsonLd(html) as any;
      const headline = stripTags(ld?.headline || meta(html, "og:title", true) || /<h1[^>]*>([\s\S]*?)<\/h1>/i.exec(html)?.[1] || "");
      if (!headline) continue;
      const description = stripTags(ld?.description || meta(html, "description") || meta(html, "og:description", true) || "");
      const plainText = stripTags(html);
      const date = typeof ld?.datePublished === "string" ? ld.datePublished.slice(0, 10) : dateFromText(plainText);
      const editionNumber = editionFromText(plainText) ?? editionFromText(headline);
      const remoteImage = extractImage(html, ld);
      let image = "";
      if (remoteImage) {
        try {
          const imageResponse = await fetch(remoteImage, { headers: { "user-agent": USER_AGENT }, redirect: "follow" });
          if (imageResponse.ok) {
            const bytes = Buffer.from(await imageResponse.arrayBuffer());
            const contentType = imageResponse.headers.get("content-type") || "image/jpeg";
            const extension = contentType.includes("png") ? "png" : contentType.includes("webp") ? "webp" : contentType.includes("gif") ? "gif" : "jpg";
            image = (await storagePut("editorial/pilulas/" + slugifyForStorage(headline) + "." + extension, bytes, contentType, accessToken)).url;
          }
        } catch (error) { console.warn("[PCH] Pílula image migration skipped:", url, error); }
      }
      const articleBody = typeof ld?.articleBody === "string" ? ld.articleBody.trim() : "";
      const bodyHtml = articleBody ? toBodyHtml(articleBody) : (description ? "<p>" + escapeHtml(description) + "</p>" : "<p>Conteúdo sincronizado da fonte editorial.</p>");
      const slug = url.split("/materia/")[1]?.replace(/\/$/, "") || headline.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      await saveArticle({
        id: "hostingpress-pilula-" + slug,
        title: headline,
        category: "Colunas",
        author: "Evaldo Poeta",
        authorOpenId: null,
        authorProfileSlug: "evaldo-poeta",
        summary: description || headline,
        date,
        updated: new Date().toISOString(),
        status: "published",
        views: 0,
        image,
        bodyHtml,
        tags: ["Pílula do Poeta", "Evaldo Poeta", "reflexão"],
        scope: "national",
        language: "pt-BR",
        featured: true,
        sourceUrl: url,
        sourceName: "PCH News / HostingPRESS",
        slug,
        contentType: "pilula",
        editionNumber,
      }, accessToken);
      imported.push(headline);
    } catch (error) {
      console.warn("[PCH] Pílula sync skipped:", url, error);
    }
  }
  if (!imported.length) throw new Error("A fonte respondeu, mas nenhuma Pílula do Poeta de Evaldo Poeta pôde ser importada.");
  return { success: true, imported, count: imported.length, source: SOURCE };
}
