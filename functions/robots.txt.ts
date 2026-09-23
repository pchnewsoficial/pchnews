export const onRequest: PagesFunction = async ({ request }) => {
  const origin = new URL(request.url).origin;
  return new Response(`User-agent: *
Allow: /
Disallow: /admin
Disallow: /login

Sitemap: ${origin}/sitemap.xml
Sitemap: ${origin}/news-sitemap.xml
`, { headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=3600" } });
};
