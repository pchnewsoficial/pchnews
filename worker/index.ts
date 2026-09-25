import { handleAsNodeRequest } from "cloudflare:node";
import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "../server/_core/oauth";
import { registerStorageProxy } from "../server/_core/storageProxy";
import { appRouter } from "../server/routers";
import { createContext } from "../server/_core/context";
import { getApiHealth } from "../server/apiHub";

const app = express();

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

app.get("/healthz", (_req, res) => {
  res.status(200).json({ ok: true, service: "pch-news", runtime: "cloudflare-workers" });
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
  async fetch(request: Request, env: { ASSETS: Fetcher }) {
    const url = new URL(request.url);

    // Legacy PCH News image bridge: the editorial database keeps the original
    // HostingPRESS article URL, while the public site serves the discovered
    // OpenGraph image from the same origin. This removes cross-origin image
    // failures and lets Cloudflare cache the migrated artwork.
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

    // Backend routes stay on the Node/Express Worker.
    if (
      url.pathname === "/healthz" ||
      url.pathname.startsWith("/api/") ||
      url.pathname.startsWith("/manus-storage/")
    ) {
      return handleAsNodeRequest(3000, request);
    }

    // The React/Vite production build is published through Cloudflare Assets.
    // not_found_handling=single-page-application in wrangler.jsonc makes
    // client-side routes (e.g. /admin and /materia/:slug) resolve to index.html.
    return env.ASSETS.fetch(request);
  },
};
