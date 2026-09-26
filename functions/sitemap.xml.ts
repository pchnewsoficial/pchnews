type Env = { SUPABASE_URL: string; SUPABASE_SERVICE_ROLE_KEY?: string; SUPABASE_SECRET_KEY?: string };
export const onRequest: PagesFunction<Env> = async ({ request, env }) => {
  const origin = new URL(request.url).origin;
  const urls = [`${origin}/`, `${origin}/institucional`, `${origin}/anuncie`, `${origin}/lei`];
  const key = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SECRET_KEY;
  if (env.SUPABASE_URL && key) {
    const res = await fetch(`${env.SUPABASE_URL}/rest/v1/articles?select=id,status,updatedAt,slug&status=eq.published&order=updatedAt.desc&limit=5000`, { headers: { apikey: key, Authorization: `Bearer ${key}` } });
    if (res.ok) {
      const rows = await res.json() as Array<{id:string;updatedAt?:string;slug?:string|null}>;
      rows.forEach((row) => urls.push(`${origin}/materia/${row.slug || row.id}`));
    }
  }
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map((url) => `<url><loc>${escapeXml(url)}</loc></url>`).join("")}</urlset>`;
  return new Response(xml, { headers: { "content-type": "application/xml; charset=utf-8", "cache-control": "public, max-age=900" } });
};
function escapeXml(value:string){return value.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&apos;")}
