import { createFileRoute } from "@tanstack/react-router";

import { categories, columnists, publishedArticles } from "@/data/content";
import { originFromRequest } from "@/lib/seo/request-origin";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: ({ request }) => {
        const origin = originFromRequest(request);
        const list = publishedArticles();
        const latest = list[0]?.publishedAt;
        const urls: { loc: string; lastmod?: string }[] = [
          { loc: "/", lastmod: latest },
          { loc: "/categorias" },
          { loc: "/colunistas" },
          ...categories.map((c) => ({ loc: `/categoria/${c.slug}`, lastmod: list.find((a) => a.category === c.slug)?.publishedAt })),
          ...columnists.map((c) => ({ loc: `/colunistas/${c.slug}`, lastmod: list.find((a) => a.authorSlug === c.slug)?.publishedAt })),
          ...list.map((a) => ({ loc: `/noticia/${a.slug}`, lastmod: a.publishedAt })),
        ];
        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map((u) => `  <url><loc>${esc(origin + u.loc)}</loc>${u.lastmod ? `<lastmod>${new Date(u.lastmod).toISOString()}</lastmod>` : ""}</url>`)
  .join("\n")}
</urlset>`;
        return new Response(xml, {
          headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=900" },
        });
      },
    },
  },
});
