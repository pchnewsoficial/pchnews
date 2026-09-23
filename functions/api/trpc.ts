import { createClient } from "@supabase/supabase-js";
import { runEditorialAgent, type EditorialAgentId } from "../../server/editorialAgents";

type Env = {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  SUPABASE_SECRET_KEY?: string;
  PCH_ADMIN_EMAILS?: string;
};

type Article = {
  id: string; title: string; category: string; author: string; authorOpenId?: string | null;
  summary: string; date: string; updated: string; status: "published"|"draft"|"scheduled"|"archived";
  views: number; image: string; bodyHtml: string; scheduledAt: number | null; tags: string;
  youtubeUrl?: string | null; socialLinks?: string | null; slug?: string | null; seoTitle?: string | null; metaDescription?: string | null; canonicalUrl?: string | null; focusKeyword?: string | null; ogTitle?: string | null; ogDescription?: string | null; imageAlt?: string | null; noindex?: boolean;
};

const json = (value: unknown, status = 200) =>
  new Response(JSON.stringify(value), { status, headers: { "content-type": "application/json; charset=utf-8" } });

function getInput(url: URL, body: any) {
  if (body && typeof body === "object") {
    const first = body["0"] ?? body;
    return first?.json ?? first ?? {};
  }
  const raw = url.searchParams.get("input");
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed?.["0"]?.json ?? parsed?.json ?? parsed ?? {};
  } catch { return {}; }
}

function trpcResult(data: unknown) {
  return { result: { data: { json: data } } };
}
function trpcError(message: string, code = "INTERNAL_SERVER_ERROR") {
  return { error: { json: { message, code, data: { code } } } };
}

async function currentUser(request: Request, env: Env, required = false) {
  const auth = request.headers.get("Authorization");
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token) { if (required) throw new Error("UNAUTHORIZED"); return null; }
  const adminKey = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SECRET_KEY;
  if (!env.SUPABASE_URL || !adminKey) throw new Error("Supabase server secrets are not configured.");
  const admin = createClient(env.SUPABASE_URL, adminKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: authData, error: authError } = await admin.auth.getUser(token);
  if (authError || !authData.user) { if (required) throw new Error("UNAUTHORIZED"); return null; }
  const openId = authData.user.id;
  const { data: row } = await admin.from("users").select("*").eq("openId", openId).maybeSingle();
  if (!row) {
    const name = authData.user.user_metadata?.full_name || authData.user.user_metadata?.name || authData.user.email?.split("@")[0] || "Usuário";
    const { data: created } = await admin.from("users").upsert({
      openId, name, email: authData.user.email ?? null,
      loginMethod: authData.user.app_metadata?.provider ?? "supabase",
      lastSignedIn: new Date().toISOString()
    }, { onConflict: "openId" }).select("*").single();
    const adminEmails = (env.PCH_ADMIN_EMAILS || "").split(",").map((email) => email.trim().toLowerCase()).filter(Boolean);
    const role = authData.user.email && adminEmails.includes(authData.user.email.toLowerCase()) ? "admin" : "user";
    if (created && role === "admin") await admin.from("users").update({ role }).eq("openId", openId);
    return created ? { ...created, role } : { openId, name, email: authData.user.email ?? null, role };
  }
  await admin.from("users").update({ lastSignedIn: new Date().toISOString() }).eq("openId", openId);
  return row;
}

async function handleProcedure(path: string, request: Request, env: Env, input: any) {
  const adminKey = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SECRET_KEY;
  if (!env.SUPABASE_URL || !adminKey) throw new Error("Supabase server secrets are not configured.");
  const db = createClient(env.SUPABASE_URL, adminKey, { auth: { persistSession: false, autoRefreshToken: false } });

  if (path === "auth.me") return await currentUser(request, env);
  if (path === "auth.logout") return { success: true };

  if (path === "editorial.bootstrap") {
    const user = await currentUser(request, env);
    const staff = Boolean(user && ["admin", "columnist"].includes(user.role));
    const now = Date.now();
    let articleQuery = db.from("articles").select("*").order("updatedAt", { ascending: false });
    if (!staff) articleQuery = articleQuery.eq("status", "published").or("scheduledAt.is.null,scheduledAt.lte." + now);
    const [{ data: articles, error: articleError }, { data: comments }, { data: profiles }, { data: adRequests }] = await Promise.all([
      articleQuery,
      staff
        ? db.from("comments").select("*").order("createdAtMs", { ascending: false })
        : db.from("comments").select("*").eq("status", "approved").order("createdAtMs", { ascending: false }),
      db.from("columnistProfiles").select("*").order("name"),
      staff ? db.from("adRequests").select("*").order("createdAtMs", { ascending: false }) : Promise.resolve({ data: [] })
    ]);
    if (articleError) throw new Error(articleError.message);
    return { articles: articles ?? [], comments: comments ?? [], profiles: profiles ?? [], adRequests: adRequests ?? [] };
  }

  if (path === "editorial.recordView") {
    const visitorId = String(input.visitorId || "");
    const articleId = String(input.articleId || "");
    if (!visitorId || !articleId) throw new Error("Invalid view.");
    const { data: existing } = await db.from("viewEvents").select("id").eq("articleId", articleId).eq("visitorId", visitorId).limit(1).maybeSingle();
    if (!existing) {
      await db.from("viewEvents").insert({ id: `view-${Date.now()}-${crypto.randomUUID()}`, articleId, visitorId, viewedAtMs: Date.now() });
      const { data: article } = await db.from("articles").select("views").eq("id", articleId).maybeSingle();
      if (article) await db.from("articles").update({ views: Number(article.views || 0) + 1 }).eq("id", articleId);
    }
    const { data: current } = await db.from("articles").select("views").eq("id", articleId).maybeSingle();
    return { success: true, views: Number(current?.views || 0) };
  }

  const user = await currentUser(request, env, true);
  if (!user || !["admin", "columnist"].includes(user.role)) throw new Error("FORBIDDEN");

  if (path === "editorialAgents.run") {
    const allowed = ["story-editor","fact-checker","seo-optimization-specialist","publication-readiness","ethics-advisor","multi-platform-distributor","journalism-master-orchestrator"];
    if (!allowed.includes(String(input.agentId))) throw new Error("Agente editorial inválido.");
    const article = input.article || {};
    const result = runEditorialAgent(String(input.agentId) as EditorialAgentId, article);
    await db.from("editorialAgentRuns").insert({
      id: "agent-" + Date.now() + "-" + crypto.randomUUID(),
      articleId: String(input.articleId || article.id || ""),
      agentId: result.agentId,
      agentName: result.agentName,
      status: result.status,
      findings: result.findings,
      output: result.output,
      actorOpenId: user.openId,
      createdAtMs: Date.now()
    });
    return result;
  }

  if (path === "editorialAgents.history") {
    const articleId = String(input.articleId || "");
    if (!articleId) throw new Error("Artigo inválido.");
    const { data, error } = await db.from("editorialAgentRuns").select("*").eq("articleId", articleId).order("createdAtMs", { ascending: false }).limit(100);
    if (error) throw new Error(error.message);
    return data || [];
  }


  if (path === "editorial.saveArticle") {
    const article = input as Article;
    const { data: existing } = await db.from("articles").select("*").eq("id", article.id).maybeSingle();
    if (user.role !== "admin" && existing?.authorOpenId && existing.authorOpenId !== user.openId) throw new Error("FORBIDDEN");
    const next = {
      ...article,
      authorOpenId: article.authorOpenId || existing?.authorOpenId || (user.role === "columnist" ? user.openId : null),
      socialLinks: article.socialLinks ? (typeof article.socialLinks === "string" ? JSON.parse(article.socialLinks) : article.socialLinks) : {},
      youtubeUrl: article.youtubeUrl ?? null,
      updatedAt: new Date().toISOString()
    };
    const { error } = await db.from("articles").upsert(next, { onConflict: "id" });
    if (error) throw new Error(error.message);
    return { success: true };
  }

  if (path === "editorial.sync") {
    if (user.role !== "admin") throw new Error("FORBIDDEN");
    const payload = input || {};
    for (const article of payload.articles || []) {
      await db.from("articles").upsert({ ...article, youtubeUrl: article.youtubeUrl ?? null, socialLinks: article.socialLinks ? (typeof article.socialLinks === "string" ? JSON.parse(article.socialLinks) : article.socialLinks) : {}, slug: article.slug || null, seoTitle: article.seoTitle || null, metaDescription: article.metaDescription || null, canonicalUrl: article.canonicalUrl || null, focusKeyword: article.focusKeyword || null, ogTitle: article.ogTitle || null, ogDescription: article.ogDescription || null, imageAlt: article.imageAlt || null, noindex: Boolean(article.noindex), updatedAt: new Date().toISOString() }, { onConflict: "id" });
    }
    return { success: true };
  }

  if (path === "comments.create") {
    const articleId = String(input.articleId || "");
    const name = String(input.name || "").trim().slice(0, 120);
    const text = String(input.text || "").trim().slice(0, 4000);
    if (!articleId || name.length < 2 || text.length < 2) throw new Error("Preencha nome e comentário.");
    const { data: article } = await db.from("articles").select("id,status").eq("id", articleId).maybeSingle();
    if (!article || article.status !== "published") throw new Error("Matéria indisponível.");
    const row = {
      id: "comment-" + Date.now() + "-" + crypto.randomUUID(),
      articleId, name, text, createdAtMs: Date.now(), status: "pending",
      reply: null, repliedBy: null, repliedAtMs: null
    };
    const { error } = await db.from("comments").insert(row);
    if (error) throw new Error(error.message);
    return row;
  }

  if (path === "comments.moderate" || path === "comments.reply" || path === "comments.remove") {
    if (!user || !["admin", "columnist"].includes(user.role)) throw new Error("FORBIDDEN");
    const id = String(input.id || "");
    const { data: comment } = await db.from("comments").select("*").eq("id", id).maybeSingle();
    if (!comment) throw new Error("Comentário não encontrado.");
    const { data: article } = await db.from("articles").select("authorOpenId").eq("id", comment.articleId).maybeSingle();
    if (user.role !== "admin" && article?.authorOpenId && article.authorOpenId !== user.openId) throw new Error("FORBIDDEN");

    if (path === "comments.remove") {
      const { error } = await db.from("comments").delete().eq("id", id);
      if (error) throw new Error(error.message);
      return { success: true };
    }

    const patch = path === "comments.reply"
      ? { reply: String(input.reply || "").trim().slice(0, 4000), repliedBy: user.name || user.email || "PCH News", repliedAtMs: Date.now() }
      : { status: ["pending", "approved", "rejected"].includes(input.status) ? input.status : "pending" };
    const { data, error } = await db.from("comments").update(patch).eq("id", id).select("*").single();
    if (error) throw new Error(error.message);
    return data;
  }

  if (path === "editorial.analytics") {
    if (!user || !["admin", "columnist"].includes(user.role)) throw new Error("FORBIDDEN");
    const author = user.role === "admin" ? input.author : user.name;
    const authorOpenId = user.role === "admin" ? input.authorOpenId : user.openId;
    let query = db.from("articles").select("id,title,author,authorOpenId,views,updatedAt");
    if (authorOpenId) query = query.eq("authorOpenId", authorOpenId);
    else if (author) query = query.eq("author", author);
    const { data, error } = await query.order("views", { ascending: false });
    if (error) throw new Error(error.message);
    const totals = (data || []).map((item) => ({ articleId: item.id, title: item.title, views: Number(item.views || 0), author: item.author }));
    return { totals, totalViews: totals.reduce((sum, item) => sum + item.views, 0) };
  }

  if (path === "editorial.audit") {
    if (!user || user.role !== "admin") throw new Error("FORBIDDEN");
    let query = db.from("articleAudit").select("*").order("createdAtMs", { ascending: false }).limit(500);
    if (input.articleId) query = query.eq("articleId", input.articleId);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data || [];
  }

  if (path === "access.list") {
    if (!user || user.role !== "admin") throw new Error("FORBIDDEN");
    const { data, error } = await db.from("users").select("id,openId,name,email,role,lastSignedIn").order("name");
    if (error) throw new Error(error.message);
    return data || [];
  }

  if (path === "access.setRole") {
    if (!user || user.role !== "admin") throw new Error("FORBIDDEN");
    const openId = String(input.openId || "");
    const role = ["user", "admin", "columnist"].includes(input.role) ? input.role : "user";
    if (!openId) throw new Error("Usuário inválido.");
    const { error } = await db.from("users").update({ role }).eq("openId", openId);
    if (error) throw new Error(error.message);
    return { success: true };
  }

  if (path === "profiles.save") {
    if (!user || !["admin", "columnist"].includes(user.role)) throw new Error("FORBIDDEN");
    const slug = String(input.slug || "");
    if (user.role !== "admin" && slugify(user.name || "") !== slug) throw new Error("Você só pode editar o próprio perfil.");
    const payload = {
      slug, name: String(input.name || "").trim(), beat: String(input.beat || "").trim(),
      bio: String(input.bio || "").trim(), photo: String(input.photo || ""),
      instagram: String(input.instagram || ""), facebook: String(input.facebook || ""),
      x: String(input.x || ""), linkedin: String(input.linkedin || ""),
      updatedAt: new Date().toISOString()
    };
    if (!payload.name || !payload.slug) throw new Error("Nome e slug são obrigatórios.");
    const { data, error } = await db.from("columnistProfiles").upsert(payload, { onConflict: "slug" }).select("*").single();
    if (error) throw new Error(error.message);
    return data;
  }

  if (path === "profiles.uploadPhoto") {
    if (!user || !["admin", "columnist"].includes(user.role)) throw new Error("FORBIDDEN");
    const slug = String(input.slug || "");
    if (user.role !== "admin" && slugify(user.name || "") !== slug) throw new Error("FORBIDDEN");
    const fileName = String(input.fileName || "profile.jpg").replace(/[^a-zA-Z0-9._-]/g, "-");
    const raw = String(input.base64 || "").replace(/^data:[^;]+;base64,/, "");
    if (!raw) throw new Error("Arquivo inválido.");
    const bytes = Uint8Array.from(atob(raw), (char) => char.charCodeAt(0));
    if (bytes.byteLength > 5 * 1024 * 1024) throw new Error("A imagem deve ter no máximo 5 MB.");
    const pathName = "columnists/" + slug + "/" + Date.now() + "-" + fileName;
    const { error } = await db.storage.from("media").upload(pathName, bytes, { contentType: String(input.contentType || "image/jpeg"), upsert: true });
    if (error) throw new Error(error.message);
    return { url: db.storage.from("media").getPublicUrl(pathName).data.publicUrl };
  }

  throw new Error("Procedure not implemented on Cloudflare API.");
}

export async function onRequest(context: { request: Request; env: Env }) {
  const { request, env } = context;
  if (request.method !== "GET" && request.method !== "POST") return new Response("Method Not Allowed", { status: 405 });
  const url = new URL(request.url);
  const path = url.pathname.replace(/^\/api\/trpc\//, "").replace(/^\/api\/trpc$/, "");
  const batch = url.searchParams.get("batch") === "1";
  let body: any = null;
  if (request.method === "POST") { try { body = await request.json(); } catch { body = null; } }
  const entries = batch && body && typeof body === "object" ? Object.entries(body) : [[path, getInput(url, body)]];
  const results = [];
  for (const [key, value] of entries) {
    const procedure = batch ? key : path;
    try {
      results.push(trpcResult(await handleProcedure(procedure, request, env, getInput(url, value))));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Internal server error";
      const code = message === "UNAUTHORIZED" ? "UNAUTHORIZED" : message === "FORBIDDEN" ? "FORBIDDEN" : "INTERNAL_SERVER_ERROR";
      results.push(trpcError(message, code));
    }
  }
  return json(batch ? results : results[0]);
}
