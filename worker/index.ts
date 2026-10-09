import { handleAsNodeRequest } from "cloudflare:node";
import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "../server/_core/oauth";
import { registerStorageProxy } from "../server/_core/storageProxy";
import { appRouter } from "../server/routers";
import { createContext } from "../server/_core/context";
import { getApiHealth } from "../server/apiHub";
import { getSupabaseAdmin } from "../server/_core/supabase";
const SITE_ORIGIN = "https://pchnews.com.br";

const app = express();

const ALLOWED_BROWSER_ORIGINS = new Set([
  "https://pchnews.com.br",
  "https://www.pchnews.com.br",
]);

app.use("/api", (req, res, next) => {
  const origin = req.header("Origin");
  if (origin && ALLOWED_BROWSER_ORIGINS.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Vary", "Origin");
  }
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

// Keep request bodies bounded to reduce memory-exhaustion/DoS risk.
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ limit: "2mb", extended: true }));

// Baseline browser hardening. These headers are safe for the public site and API.
app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  next();
});

app.get("/healthz", (_req, res) => {
  res.status(200).json({ ok: true, service: "pch-news", runtime: "cloudflare-workers", build: "2026-09-25-sync-1200z" });
});

app.get("/api/hub/health", (_req, res) => {
  res.status(200).json({ providers: getApiHealth() });
});

registerStorageProxy(app);
registerOAuthRoutes(app);

app.use(
  "/api/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext,
  }),
);

app.listen(3000);

export default {
  async scheduled(_controller: any, _env: any, _ctx: any) {
    const db = getSupabaseAdmin();
    const nowMs = Date.now();
    const { data: due, error } = await db.from("articles").select("id,scheduledAt,status,publishedAt").eq("status", "scheduled").lte("scheduledAt", nowMs).limit(100);
    if (error) throw error;
    for (const article of due || []) {
      const { error: updateError } = await db.from("articles").update({
        status: "published",
        publishedAt: article.publishedAt || new Date(nowMs).toISOString(),
        updated: "publicado agora",
        updatedAt: new Date(nowMs).toISOString()
      }).eq("id", article.id).eq("status", "scheduled");
      if (updateError) throw updateError;
      const { data: queue } = await db.from("editorialPublicationQueue").select("id").eq("articleId", article.id).in("status", ["pending","approved","scheduled"]).maybeSingle();
      if (queue?.id) {
        await db.from("editorialPublicationQueue").update({ status: "published", publishedAtMs: nowMs, updatedAtMs: nowMs }).eq("id", queue.id);
      }
      await db.from("editorialWorkflowEvents").insert({
        id: `workflow-cron-${nowMs}-${crypto.randomUUID()}`,
        articleId: article.id,
        pautaId: null,
        actorOpenId: "system:cloudflare-cron",
        actorName: "PCH News Scheduler",
        fromStatus: "scheduled",
        toStatus: "published",
        action: "scheduled_publish",
        note: "Publicação automática pelo agendador do Worker.",
        createdAtMs: nowMs
      });
    }
  },

  async fetch(request: Request, env: { ASSETS: Fetcher }) {
    const url = new URL(request.url);
    // Official address: https://pchnews.com.br (www and plain http redirect there).
    if (url.hostname === "www.pchnews.com.br") {
      url.hostname = "pchnews.com.br";
      return Response.redirect(url.toString(), 301);
    }

    if (url.pathname.startsWith("/legacy-image/")) {
      const encodedSource = url.pathname.slice("/legacy-image/".length);
      let sourceUrl = "";
      try { sourceUrl = decodeURIComponent(encodedSource); } catch { return new Response("Bad image source", { status: 400 }); }
      if (!/^https:\/\/pchnews\.hostingpress\.com\.br\/materia\//.test(sourceUrl)) {
        return new Response("Image source not allowed", { status: 403 });
      }
      const cache = caches.default;
      const cacheKey = new Request(request.url, { method: "GET" });
      const cached = await cache.match(cacheKey);
      if (cached) return cached;
      try {
        const page = await fetch(sourceUrl, { headers: { "User-Agent": "PCH-News-Migrator/1.0" } });
        if (!page.ok) return new Response("Legacy article unavailable", { status: 404 });
        const html = await page.text();
        const match = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["'][^>]*>/i)
          || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["'][^>]*>/i);
        if (!match?.[1]) return new Response("Legacy image not found", { status: 404 });
        const imageUrl = new URL(match[1], sourceUrl).toString();
        const image = await fetch(imageUrl, { headers: { "User-Agent": "PCH-News-Migrator/1.0" } });
        if (!image.ok || !image.body) return new Response("Legacy image unavailable", { status: 404 });
        const headers = new Headers(image.headers);
        headers.set("Cache-Control", "public, max-age=86400, stale-while-revalidate=604800");
        headers.set("X-PCH-Image-Source", "HostingPRESS");
        const response = new Response(image.body, { status: image.status, headers });
        await cache.put(cacheKey, response.clone());
        return response;
      } catch {
        return new Response("Legacy image fetch failed", { status: 502 });
      }
    }

    if (url.pathname === "/robots.txt") {
      return new Response(`User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /login\nDisallow: /convite/\n\nSitemap: ${SITE_ORIGIN}/sitemap.xml\nSitemap: ${SITE_ORIGIN}/news-sitemap.xml\n`, { headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=3600" } });
    }
    if (url.pathname === "/sitemap.xml") {
      const esc = (v: string) => v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
      const urls = ["/", "/institucional", "/anuncie", "/lei", "/eventos", "/agenda", "/parceiros", "/conhecimento-pch", "/privacidade", "/termos", "/cookies", "/correcoes", "/principios-editoriais", "/colunista/evaldo-poeta"].map((p) => `${SITE_ORIGIN}${p}`);
      try {
        const { data, error } = await getSupabaseAdmin().from("articles").select("*").in("status", ["published", "updated"]).limit(10000);
        if (!error) for (const row of (data || []) as Array<Record<string, any>>) {
          if (row.noindex === true) continue;
          const slug = typeof row.slug === "string" && row.slug.trim() ? row.slug.trim() : row.id;
          urls.push(`${SITE_ORIGIN}/materia/${encodeURIComponent(slug)}`);
        }
      } catch { /* keep static public URLs available if database is temporarily unavailable */ }
      const uniqueUrls = Array.from(new Set(urls));
      const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${uniqueUrls.map((u) => `<url><loc>${esc(u)}</loc></url>`).join("")}</urlset>`;
      return new Response(xml, { headers: { "content-type": "application/xml; charset=utf-8", "cache-control": "public, max-age=300", "x-content-type-options": "nosniff" } });
    }
    if (url.pathname === "/news-sitemap.xml") {
      const esc = (v: string) => v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
      const cutoff = Date.now() - 48 * 60 * 60 * 1000;
      try {
        const { data, error } = await getSupabaseAdmin().from("articles").select("*").in("status", ["published", "updated"]).order("publishedAt", { ascending: false }).limit(1000);
        if (error) throw error;
        const rows = ((data || []) as Array<Record<string, any>>).filter((row) => {
          if (row.noindex === true) return false;
          const published = row.publishedAt ? Date.parse(String(row.publishedAt)) : NaN;
          return Number.isFinite(published) && published >= cutoff && published <= Date.now();
        });
        const entries = rows.map((row) => {
          const slug = typeof row.slug === "string" && row.slug.trim() ? row.slug.trim() : row.id;
          const publishedAt = new Date(String(row.publishedAt)).toISOString();
          const title = String(row.title || "PCH News").slice(0, 200);
          return `<url><loc>${esc(`${SITE_ORIGIN}/materia/${encodeURIComponent(slug)}`)}</loc><news:news><news:publication><news:name>PCH News</news:name><news:language>pt</news:language></news:publication><news:publication_date>${esc(publishedAt)}</news:publication_date><news:title>${esc(title)}</news:title></news:news></url>`;
        }).join("");
        const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">${entries}</urlset>`;
        return new Response(xml, { headers: { "content-type": "application/xml; charset=utf-8", "cache-control": "public, max-age=300", "x-content-type-options": "nosniff" } });
      } catch {
        return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"></urlset>`, { headers: { "content-type": "application/xml; charset=utf-8", "cache-control": "public, max-age=60", "x-content-type-options": "nosniff" } });
      }
    }

    if (
      url.pathname === "/healthz" ||
      url.pathname.startsWith("/api/") ||
      url.pathname.startsWith("/manus-storage/")
    ) {
      const cf = (request as Request & { cf?: Record<string, any> }).cf || {};
      const headers = new Headers(request.headers);
      if (cf.country) headers.set("x-pch-geo-country", String(cf.country));
      if (cf.regionCode || cf.region) headers.set("x-pch-geo-state", String(cf.regionCode || cf.region));
      if (cf.city) headers.set("x-pch-geo-city", String(cf.city));
      return handleAsNodeRequest(3000, new Request(request, { headers }));
    }

    // Render article-specific metadata at the edge so search engines and social crawlers
    // receive title, description, canonical URL and NewsArticle JSON-LD in the initial HTML.
    if (url.pathname.startsWith("/materia/")) {
      let articleKey = "";
      try { articleKey = decodeURIComponent(url.pathname.slice("/materia/".length)).trim(); } catch { articleKey = ""; }
      if (articleKey) {
        try {
          const db = getSupabaseAdmin();
          let { data: article } = await db.from("articles").select("*").eq("slug", articleKey).maybeSingle();
          if (!article) {
            const byId = await db.from("articles").select("*").eq("id", articleKey).maybeSingle();
            article = byId.data;
          }
          if (!article) {
            // Older articles may not have a persisted slug; the client historically
            // resolves those routes from the normalized title.
            const { data: candidates } = await db.from("articles").select("*").in("status", ["published", "updated"]).limit(1000);
            const normalizeSlug = (value: unknown) => String(value || "").toLowerCase().normalize("NFD").replace(/[\\u0300-\\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
            article = (candidates || []).find((row: Record<string, any>) => normalizeSlug(row.title) === articleKey) || null;
          }
          if (article && ["published", "updated"].includes(String(article.status))) {
            const shell = await env.ASSETS.fetch(new Request(new URL("/", request.url), request));
            if (shell.ok) {
              const html = await shell.text();
              const esc = (value: unknown) => String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
              const title = String(article.seoTitle || article.title || "PCH News").trim();
              const description = String(article.metaDescription || article.summary || String(article.bodyHtml || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 160) || title).trim().slice(0, 300);
              const canonical = /^https:\/\//i.test(String(article.canonicalUrl || "")) ? String(article.canonicalUrl) : `${SITE_ORIGIN}/materia/${encodeURIComponent(String(article.slug || article.id))}`;
              const rawImage = String(article.image || "");
              const image = rawImage ? new URL(rawImage, SITE_ORIGIN).toString() : `${SITE_ORIGIN}/brand/logo.jpg`;
              const publishedAt = article.publishedAt ? new Date(String(article.publishedAt)).toISOString() : undefined;
              const modifiedAt = article.updatedAt ? new Date(String(article.updatedAt)).toISOString() : publishedAt;
              const robots = article.noindex === true ? "noindex,follow" : "index,follow";
              const jsonLd: Record<string, unknown> = {
                "@context": "https://schema.org", "@type": "NewsArticle",
                "mainEntityOfPage": { "@type": "WebPage", "@id": canonical },
                "headline": String(article.title || title).slice(0, 110),
                "description": description,
                "image": [image],
                "author": { "@type": "Person", "name": String(article.author || "Redação PCH News") },
                "publisher": { "@type": "Organization", "name": "PCH News", "url": SITE_ORIGIN, "logo": { "@type": "ImageObject", "url": `${SITE_ORIGIN}/brand/logo.jpg` } },
                "inLanguage": "pt-BR"
              };
              if (publishedAt) jsonLd.datePublished = publishedAt;
              if (modifiedAt) jsonLd.dateModified = modifiedAt;
              const meta = [
                `<meta name="description" content="${esc(description)}">`,
                `<meta name="robots" content="${robots}">`,
                `<link rel="canonical" href="${esc(canonical)}">`,
                `<meta property="og:type" content="article">`,
                `<meta property="og:site_name" content="PCH News">`,
                `<meta property="og:title" content="${esc(article.ogTitle || title)}">`,
                `<meta property="og:description" content="${esc(article.ogDescription || description)}">`,
                `<meta property="og:url" content="${esc(canonical)}">`,
                `<meta property="og:image" content="${esc(image)}">`,
                `<meta property="og:image:alt" content="${esc(article.imageAlt || article.title || title)}">`,
                `<meta name="twitter:card" content="summary_large_image">`,
                `<meta name="twitter:title" content="${esc(article.ogTitle || title)}">`,
                `<meta name="twitter:description" content="${esc(article.ogDescription || description)}">`,
                `<meta name="twitter:image" content="${esc(image)}">`,
                `<script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, "\\u003c")}</script>`
              ].join("\n    ");
              let cleanHtml = html.replace(/<title[^>]*>[\s\S]*?<\/title>/i, `<title>${esc(title)}</title>`);
              cleanHtml = cleanHtml.replace(/<meta\b[^>]*(?:name|property)="(?:description|robots|og:type|og:site_name|og:title|og:description|og:url|og:image|og:image:alt|twitter:card|twitter:title|twitter:description|twitter:image)"[^>]*>/gi, "");
              cleanHtml = cleanHtml.replace(/<link\b[^>]*rel="canonical"[^>]*>/gi, "");
              const head = cleanHtml.includes("</head>") ? cleanHtml.replace("</head>", `    ${meta}\n  </head>`) : cleanHtml;
              const responseHeaders = new Headers(shell.headers);
              responseHeaders.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
              responseHeaders.set("X-PCH-SEO", "edge-article-metadata");
              return new Response(head, { status: shell.status, statusText: shell.statusText, headers: responseHeaders });
            }
          }
        } catch {
          // If the editorial database is temporarily unavailable, retain the normal SPA fallback.
        }
      }
    }

    const spaPath = url.pathname.replace(/\/+$/, "") || "/";
    const isSpaRoute =
      spaPath === "/admin" ||
      spaPath.startsWith("/admin/") ||
      spaPath === "/eventos" ||
      spaPath.startsWith("/eventos/") ||
      spaPath === "/agenda" ||
      spaPath.startsWith("/agenda/") ||
      spaPath === "/login" ||
      spaPath === "/perfil" ||
      spaPath === "/404" ||
      spaPath.startsWith("/materia/") ||
      spaPath.startsWith("/colunista/") ||
      spaPath.startsWith("/convite/") ||
      spaPath === "/institucional" ||
      spaPath === "/anuncie" ||
      spaPath === "/lei" ||
      spaPath === "/privacidade" ||
      spaPath === "/termos" ||
      spaPath === "/cookies" ||
      spaPath === "/parceiros" ||
      spaPath === "/conhecimento-pch" ||
      spaPath === "/correcoes" ||
      spaPath === "/principios-editoriais";

    // Canonicalize the legacy editorial route at the Worker boundary. This prevents
    // any stale/client-side router from ever resolving /painel-editorial as Agenda.
    if (url.pathname === "/painel-editorial" || url.pathname === "/painel-editorial/") {
      const target = new URL("/admin", request.url);
      return Response.redirect(target.toString(), 302);
    }

    // Keep /admin as the real browser URL. Serve only the SPA entrypoint so
    // wouter sees /admin and renders ProtectedAdmin instead of any public page.
    if (url.pathname === "/admin" || url.pathname === "/admin/") {
      const response = await env.ASSETS.fetch(new Request(new URL("/", request.url), request));
      const headers = new Headers(response.headers);
      headers.set("Cache-Control", "no-store");
      headers.set("X-PCH-Route", "admin-protected");
      return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
    }

    // Serve the SPA shell from "/" (not "/index.html"): Cloudflare Assets answers
    // "/index.html" with a 307 redirect to "/", which sent every deep link
    // (/admin, /login, /materia/...) back to the home page.
    if (isSpaRoute || url.pathname === "/") {
      const response = await env.ASSETS.fetch(new Request(new URL("/", request.url), request));
      const headers = new Headers(response.headers);
      // Never cache the SPA shell: hashed JS/CSS assets are cacheable, but the
      // HTML entrypoint must always point the browser at the newest deployment.
      headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
      headers.set("CDN-Cache-Control", "no-store");
      headers.set("Cloudflare-CDN-Cache-Control", "no-store");
      headers.set("Surrogate-Control", "no-store");
      headers.set("Pragma", "no-cache");
      return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
    }
    return env.ASSETS.fetch(request);
  },
};