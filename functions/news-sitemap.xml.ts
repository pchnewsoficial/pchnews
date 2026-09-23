type Env = { SUPABASE_URL: string; SUPABASE_SERVICE_ROLE_KEY?: string; SUPABASE_SECRET_KEY?: string };
export const onRequest: PagesFunction<Env> = async ({ request, env }) => {
  const origin = new URL(request.url).origin;
  const key = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SECRET_KEY;
  let rows: Array<{id:string;title:string;date?:string;updatedAt?:string;slug?:string|null}> = [];
  if (env.SUPABASE_URL && key) {
    const res = await fetch(`${env.SUPABASE_URL}/rest/v1/articles?select=id,title,date,updatedAt,slug,status&status=eq.published&order=updatedAt.desc&limit=1000`, { headers: { apikey:key, Authorization:`Bearer ${key}` } });
    if (res.ok) rows = await res.json();
  }
  const cutoff = Date.now() - 2*24*60*60*1000;
  const recent = rows.filter((row)=> { const t=Date.parse(row.updatedAt || row.date || ""); return Number.isFinite(t) && t >= cutoff; });
  const xml=`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">${recent.map((row)=>`<url><loc>${escapeXml(origin+"/materia/"+(row.slug||row.id))}</loc><news:news><news:publication><news:name>PCH News</news:name><news:language>pt-BR</news:language></news:publication><news:publication_date>${escapeXml(new Date(row.updatedAt || row.date || Date.now()).toISOString())}</news:publication_date><news:title>${escapeXml(row.title)}</news:title></news:news></url>`).join("")}</urlset>`;
  return new Response(xml,{headers:{"content-type":"application/xml; charset=utf-8","cache-control":"public, max-age=900"}});
};
function escapeXml(value:string){return value.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&apos;")}
