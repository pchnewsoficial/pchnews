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

async function sha256Hex(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
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
  const STAFF_ROLES = ["admin", "editor", "journalist", "columnist", "reviewer"] as const;
  const CONTENT_EDIT_ROLES = ["admin", "editor", "journalist", "columnist"] as const;

  if (path === "apiHub.weather") {
    const latitude = Number(input.latitude);
    const longitude = Number(input.longitude);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) throw new Error("Coordenadas inválidas.");
    const qs = new URLSearchParams({
      latitude: String(latitude), longitude: String(longitude),
      current: "temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m",
      daily: "temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code",
      timezone: "auto"
    });
    const response = await fetch("https://api.open-meteo.com/v1/forecast?" + qs.toString());
    if (!response.ok) throw new Error("Serviço meteorológico indisponível.");
    return await response.json();
  }

  if (path === "adRequests.create") {
    const now = Date.now();
    const business = String(input.business || "").trim();
    const contactName = String(input.contactName || "").trim();
    const email = String(input.email || "").trim().toLowerCase();
    const phone = String(input.phone || "").trim();
    const message = String(input.message || "").trim();
    if (!business || !contactName || !email || !phone || message.length < 10 || input.consent !== true) throw new Error("Dados do anúncio inválidos.");
    const { data, error } = await db.from("adRequests").insert({
      id: `ad-${now}-${crypto.randomUUID()}`, business, contact: contactName, packageName: String(input.adType || "site"), message,
      status: "received", createdAtMs: now, contactName, email, phone,
      city: String(input.city || "") || null, website: String(input.website || "") || null,
      socials: String(input.socials || "") || null, adType: String(input.adType || "") || null,
      budget: String(input.budget || "") || null, period: String(input.period || "") || null,
      consentAtMs: now, source: "public"
    }).select("*").single();
    if (error) throw new Error(error.message);
    return data;
  }

  if (path === "events.list") {
    const now = Date.now();
    let q = db.from("events").select("*").eq("status", "approved").order("startAtMs", { ascending: true });
    if (input?.state) q = q.eq("state", String(input.state));
    if (input?.city) q = q.ilike("city", String(input.city));
    if (input?.eventType) q = q.eq("eventType", String(input.eventType));
    if (input?.fromMs) q = q.gte("startAtMs", Number(input.fromMs));
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    let rows = (data || []).filter((e: any) => e.endAtMs != null ? Number(e.endAtMs) >= now : Number(e.startAtMs) >= now);
    if (input?.nearLat !== undefined && input?.nearLng !== undefined) {
      const rad = (v: number) => v * Math.PI / 180;
      const dist = (lat: number, lng: number) => {
        const R = 6371, dLat = rad(lat - Number(input.nearLat)), dLng = rad(lng - Number(input.nearLng));
        const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(Number(input.nearLat))) * Math.cos(rad(lat)) * Math.sin(dLng / 2) ** 2;
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      };
      rows = rows.map((e: any) => ({ ...e, distanceKm: e.latitude && e.longitude ? dist(Number(e.latitude), Number(e.longitude)) : null }))
        .filter((e: any) => input?.radiusKm === undefined || (e.distanceKm !== null && e.distanceKm <= Number(input.radiusKm)))
        .sort((a: any, b: any) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));
    } else rows = rows.map((e: any) => ({ ...e, distanceKm: null }));
    return rows;
  }

  if (path === "events.get") {
    const { data, error } = await db.from("events").select("*").eq("id", String(input.id)).eq("status", "approved").maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return null;
    const now = Date.now();
    if (data.endAtMs != null ? Number(data.endAtMs) < now : Number(data.startAtMs) < now) return null;
    return data;
  }

  if (path === "events.submit") {
    const now = Date.now();
    const payload = { ...input,
      visibilityScope: input.visibilityScope || "national", visibilityRegion: input.visibilityRegion ?? null,
      visibilityState: input.visibilityState ?? input.state ?? null, visibilitySubregion: input.visibilitySubregion ?? null,
      visibilityCity: input.visibilityCity ?? input.city ?? null,
      promotionStartAtMs: input.promotionStartAtMs ?? (Number(input.startAtMs) - 5 * 86400000),
      promotionEndAtMs: input.promotionEndAtMs ?? (input.endAtMs ?? input.startAtMs),
      editorialPriority: Number(input.editorialPriority || 0), commercialPriority: Number(input.commercialPriority || 0),
      promotionType: input.promotionType || "normal", sponsored: Boolean(input.sponsored),
      paymentStatus: input.paymentStatus || "not_applicable", sourceType: input.sourceType || "public_submission",
      sourceName: input.sourceName ?? null, sourceUrl: input.sourceUrl ?? null,
      importedAtMs: input.sourceType && input.sourceType !== "public_submission" ? now : null,
      status: "pending", createdAtMs: now, updatedAtMs: now };
    const { data, error } = await db.from("events").insert(payload).select("*").single();
    if (error) throw new Error(error.message);
    return data;
  }

  if (path === "events.carousel") {
    const now = Date.now();
    const { data, error } = await db.from("events").select("*").eq("status", "approved").lte("promotionStartAtMs", now).gte("promotionEndAtMs", now).order("startAtMs", { ascending: true });
    if (error) throw new Error(error.message);
    const filters = input || {};
    const rows = (data || []).filter((e: any) => {
      const scope = e.visibilityScope || "national";
      const state = !filters.state || !e.visibilityState || String(e.visibilityState).toLowerCase() === String(filters.state).toLowerCase();
      const city = !filters.city || !e.visibilityCity || String(e.visibilityCity).toLowerCase() === String(filters.city).toLowerCase();
      const region = !filters.region || !e.visibilityRegion || String(e.visibilityRegion).toLowerCase() === String(filters.region).toLowerCase();
      return scope === "national" || (scope === "state" && state) || (scope === "city" && city) || ((scope === "regional" || scope === "subregional") && (region || state));
    });
    const score = (e: any) => Math.max(0, 100000000 - Math.max(0, Number(e.startAtMs) - now) / 1000) + Number(e.editorialPriority || 0) * 100000 + Number(e.commercialPriority || 0) * 1000000;
    return rows.sort((a: any,b: any) => score(b)-score(a) || Number(a.startAtMs)-Number(b.startAtMs)).slice(0, Math.min(Number(filters.limit || 8), 20));
  }

  if (path === "events.adminList") {
    if (!user || user.role !== "admin") throw new Error("FORBIDDEN");
    const { data, error } = await db.from("events").select("*").order("startAtMs", { ascending: true });
    if (error) throw new Error(error.message);
    return data || [];
  }

  if (path === "events.setStatus") {
    if (!user || user.role !== "admin") throw new Error("FORBIDDEN");
    const allowed = ["pending","approved","rejected","cancelled"];
    if (!allowed.includes(String(input.status))) throw new Error("Status inválido.");
    const { error } = await db.from("events").update({ status: input.status, updatedAtMs: Date.now() }).eq("id", String(input.id));
    if (error) throw new Error(error.message);
    return { success: true };
  }

  if (path === "pauta.list") {
    if (!user || !STAFF_ROLES.includes(user.role as typeof STAFF_ROLES[number])) throw new Error("FORBIDDEN");
    const { data, error } = await db.from("editorialPautas").select("*").order("updatedAtMs", { ascending: false });
    if (error) throw new Error(error.message);
    return data || [];
  }

  if (path === "pauta.create" || path === "pauta.update") {
    if (!user || !["admin","editor","journalist","columnist","reviewer"].includes(user.role)) throw new Error("FORBIDDEN");
    const id = String(input.id || "");
    if (!id || !String(input.title || "").trim() || !String(input.angle || "").trim() || !String(input.category || "").trim()) throw new Error("Pauta inválida.");
    if (path === "pauta.update") {
      const { data: existing } = await db.from("editorialPautas").select("*").eq("id", id).maybeSingle();
      if (!existing) throw new Error("Pauta não encontrada.");
      if (user.role !== "admin" && existing.createdByOpenId !== user.openId && existing.assignedToOpenId !== user.openId) throw new Error("Você não tem permissão para alterar esta pauta.");
      if (user.role !== "admin" && input.assignedToOpenId && input.assignedToOpenId !== user.openId && existing.assignedToOpenId !== user.openId) throw new Error("Somente o administrador pode atribuir a pauta a outra pessoa.");
    }
    const now = Date.now();
    const payload = { ...input, id, briefing: String(input.briefing || ""), tags: String(input.tags || ""),
      sourcesJson: Array.isArray(input.sourcesJson) ? input.sourcesJson : [], checklistJson: Array.isArray(input.checklistJson) ? input.checklistJson : [],
      assignedToOpenId: input.assignedToOpenId ?? null, assignedToName: input.assignedToName ?? null,
      deadlineAtMs: input.deadlineAtMs ?? null, plannedPublishAtMs: input.plannedPublishAtMs ?? null,
      articleId: input.articleId ?? null, createdByOpenId: path === "pauta.create" ? user.openId : undefined,
      createdByName: path === "pauta.create" ? (user.name || user.email || "Redação PCH News") : undefined,
      createdAtMs: path === "pauta.create" ? now : undefined, updatedAtMs: now };
    const clean = Object.fromEntries(Object.entries(payload).filter(([,v]) => v !== undefined));
    const { data, error } = await db.from("editorialPautas").upsert(clean, { onConflict: "id" }).select("*").single();
    if (error) throw new Error(error.message);
    return data;
  }

  if (path === "editorialRequests.list") {
    if (!user || user.role !== "admin") throw new Error("FORBIDDEN");
    const { data, error } = await db.from("editorialRequests").select("*").order("createdAtMs", { ascending: false });
    if (error) throw new Error(error.message);
    return data || [];
  }

  if (path === "editorialRequests.update") {
    if (!user || user.role !== "admin") throw new Error("FORBIDDEN");
    const allowed = ["pending","in_review","accepted","rejected","published"];
    if (!allowed.includes(String(input.status))) throw new Error("Status inválido.");
    const { data, error } = await db.from("editorialRequests").update({
      status: input.status, responseText: String(input.responseText || "") || null,
      respondedByOpenId: user.openId, respondedAtMs: Date.now(), updatedAtMs: Date.now()
    }).eq("id", String(input.id)).select("*").single();
    if (error) throw new Error(error.message);
    return data;
  }

  if (path === "editorial.history") {
    if (!user || !STAFF_ROLES.includes(user.role as typeof STAFF_ROLES[number])) throw new Error("FORBIDDEN");
    const { data: article } = await db.from("articles").select("authorOpenId").eq("id", String(input.articleId)).maybeSingle();
    if (!article) return [];
    if (user.role !== "admin" && article.authorOpenId !== user.openId) throw new Error("FORBIDDEN");
    const { data, error } = await db.from("articleAudit").select("*, articles(title)").eq("articleId", String(input.articleId)).order("createdAtMs", { ascending: false });
    if (error) throw new Error(error.message);
    return (data || []).map((x: any) => ({ ...x, articleTitle: x.articles?.title ?? null, articles: undefined }));
  }

  if (path === "media.list") {
    if (!user || !STAFF_ROLES.includes(user.role as typeof STAFF_ROLES[number])) throw new Error("FORBIDDEN");
    const { data, error } = await db.storage.from("media").list(`editorial/${user.openId}`, { limit: 200, sortBy: { column: "name", order: "asc" } });
    if (error) throw new Error(error.message);
    return (data || []).map((item: any) => ({ id: `editorial/${user.openId}/${item.name}`, name: item.name, path: `editorial/${user.openId}/${item.name}`, url: db.storage.from("media").getPublicUrl(`editorial/${user.openId}/${item.name}`).data.publicUrl, size: item.metadata?.size || 0 }));
  }

  if (path === "media.upload") {
    if (!user || !STAFF_ROLES.includes(user.role as typeof STAFF_ROLES[number])) throw new Error("FORBIDDEN");
    const fileName = String(input.fileName || "upload.jpg").replace(/[^a-zA-Z0-9._-]/g, "-");
    const raw = String(input.base64 || "").replace(/^data:[^;]+;base64,", "");
    if (!raw) throw new Error("Arquivo inválido.");
    const bytes = Uint8Array.from(atob(raw), (ch) => ch.charCodeAt(0));
    if (bytes.length > 5 * 1024 * 1024) throw new Error("A imagem deve ter no máximo 5 MB.");
    const pathName = `editorial/${user.openId}/${Date.now()}-${fileName}`;
    const { error } = await db.storage.from("media").upload(pathName, bytes, { contentType: String(input.contentType || "image/jpeg"), upsert: false });
    if (error) throw new Error(error.message);
    return { id: pathName, name: fileName, path: pathName, url: db.storage.from("media").getPublicUrl(pathName).data.publicUrl, size: bytes.length };
  }

  if (path === "invites.list") {
    if (!user || user.role !== "admin") throw new Error("FORBIDDEN");
    const { data, error } = await db.from("columnistInvites").select("*").order("createdAtMs", { ascending: false });
    if (error) throw new Error(error.message);
    return data || [];
  }

  if (path === "invites.create") {
    if (!user || user.role !== "admin") throw new Error("FORBIDDEN");
    const token = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");
    const now = Date.now();
    const invite = { id: `invite-${now}-${crypto.randomUUID()}`, email: String(input.email || "").trim().toLowerCase(), name: String(input.name || "").trim(),
      tokenHash: await sha256Hex(token), expiresAtMs: now + 7 * 86400000, createdAtMs: now, acceptedAtMs: null, revokedAtMs: null,
      role: "columnist", invitedByOpenId: user.openId, status: "pending", responsibilityAcceptedAtMs: null, responsibilityVersion: null,
      responsibilityAcceptedIp: null, responsibilityAcceptedUserAgent: null, responsibilityAcceptedTermsId: null };
    if (!invite.email || !invite.name) throw new Error("Nome e e-mail são obrigatórios.");
    const { error } = await db.from("columnistInvites").insert(invite);
    if (error) throw new Error(error.message);
    return { ...invite, token, inviteUrl: `/convite/${token}`, emailSent: false, smtpConfigured: false };
  }

  if (path === "invites.revoke") {
    if (!user || user.role !== "admin") throw new Error("FORBIDDEN");
    const { error } = await db.from("columnistInvites").update({ revokedAtMs: Date.now(), status: "revoked" }).eq("id", String(input.id));
    if (error) throw new Error(error.message);
    return { success: true };
  }

  if (path === "invites.resend") {
    if (!user || user.role !== "admin") throw new Error("FORBIDDEN");
    const token = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");
    const expiresAtMs = Date.now() + 7 * 86400000;
    const { data: current, error: findError } = await db.from("columnistInvites").select("*").eq("id", String(input.id)).maybeSingle();
    if (findError) throw new Error(findError.message);
    if (!current || current.acceptedAtMs || current.revokedAtMs) throw new Error("Somente convites pendentes podem ser reenviados.");
    const { data, error } = await db.from("columnistInvites").update({ tokenHash: await sha256Hex(token), expiresAtMs, createdAtMs: Date.now(), status: "pending" }).eq("id", String(input.id)).select("*").single();
    if (error) throw new Error(error.message);
    return { inviteUrl: `/convite/${token}`, emailSent: false, smtpConfigured: false, expiresAtMs: data.expiresAtMs };
  }

  if (path === "invites.preview") {
    const hash = await sha256Hex(String(input.token || ""));
    const { data, error } = await db.from("columnistInvites").select("*").eq("tokenHash", hash).is("acceptedAtMs", null).is("revokedAtMs", null).maybeSingle();
    if (error) throw new Error(error.message);
    if (!data || Number(data.expiresAtMs) < Date.now()) return { valid: false };
    return { valid: true, email: data.email, name: data.name, expiresAtMs: data.expiresAtMs };
  }

  if (path === "invites.accept") {
    if (!user) throw new Error("UNAUTHORIZED");
    const token = String(input.token || "");
    if (input.responsibilityAccepted !== true) throw new Error("Aceite editorial obrigatório.");
    const hash = await sha256Hex(token);
    const { data: invite, error: inviteError } = await db.from("columnistInvites").select("*").eq("tokenHash", hash).is("acceptedAtMs", null).is("revokedAtMs", null).maybeSingle();
    if (inviteError) throw new Error(inviteError.message);
    if (!invite || Number(invite.expiresAtMs) < Date.now()) throw new Error("Convite inválido ou expirado.");
    if (String(user.email || "").toLowerCase() !== String(invite.email || "").toLowerCase()) throw new Error("Entre com o mesmo e-mail que recebeu o convite.");
    const now = Date.now();
    const ua = request.headers.get("user-agent") || null;
    const ip = request.headers.get("CF-Connecting-IP") || request.headers.get("x-forwarded-for") || null;
    const { error: roleError } = await db.from("users").update({ role: "columnist", name: user.name || invite.name, lastSignedIn: new Date().toISOString() }).eq("openId", user.openId);
    if (roleError) throw new Error(roleError.message);
    const { error: inviteUpdateError } = await db.from("columnistInvites").update({ acceptedAtMs: now, responsibilityAcceptedAtMs: now, responsibilityVersion: String(input.responsibilityVersion || ""), responsibilityAcceptedIp: ip, responsibilityAcceptedUserAgent: ua, status: "accepted" }).eq("id", invite.id);
    if (inviteUpdateError) throw new Error(inviteUpdateError.message);
    await db.from("editorialMembers").upsert({ openId: user.openId, displayName: user.name || invite.name, role: "columnist", status: "active", beat: null, profileSlug: null, createdAtMs: now, updatedAtMs: now }, { onConflict: "openId" });
    return { success: true, responsibilityAcceptedAtMs: now, responsibilityVersion: String(input.responsibilityVersion || "") };
  }

  if (path === "auth.me") return await currentUser(request, env);
  if (path === "auth.logout") return { success: true };

  if (path === "editorial.bootstrap") {
    const user = await currentUser(request, env);
    const staff = Boolean(user && STAFF_ROLES.includes(user.role as typeof STAFF_ROLES[number]));
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
  if (!user || !STAFF_ROLES.includes(user.role as typeof STAFF_ROLES[number])) throw new Error("FORBIDDEN");

  if (path === "editorialAgents.run") {
    const allowed = ["story-editor","fact-checker","seo-optimization-specialist","publication-readiness","ethics-advisor","multi-platform-distributor","liberdade-editorial","journalism-master-orchestrator"];
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
    const freedom: any = result.agentId === "liberdade-editorial" ? result : (result.output as any)?.agents?.find((a: any) => a.agentId === "liberdade-editorial");
    if (freedom) {
      const r = freedom.output;
      const articleId = String(input.articleId || article.id || "");
      await db.from("editorialFreedomReviews").insert({ id: "freedom-" + Date.now() + "-" + crypto.randomUUID(), articleId, rulesetVersion: r.rulesetVersion, status: freedom.status, score: r.score, contentType: r.contentType, autonomyAnswer: r.autonomy.answer, checks: r.checks, actorOpenId: user.openId, createdAtMs: Date.now() });
      await db.from("articles").update({ freedomStatus: freedom.status, freedomScore: r.score, freedomReviewedAtMs: Date.now(), contentType: r.contentType }).eq("id", articleId);
    }
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
    if (!CONTENT_EDIT_ROLES.includes(user.role as typeof CONTENT_EDIT_ROLES[number])) throw new Error("FORBIDDEN");
    const article = input as Article;
    const { data: existing } = await db.from("articles").select("*").eq("id", article.id).maybeSingle();
    if (user.role !== "admin" && existing?.authorOpenId && existing.authorOpenId !== user.openId) throw new Error("FORBIDDEN");
    const next = {
      ...article,
      authorOpenId: article.authorOpenId || existing?.authorOpenId || (user.role === "admin" ? null : user.openId),
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
    const role = STAFF_ROLES.includes(input.role) || input.role === "user" ? input.role : "user";
    if (!openId) throw new Error("Usuário inválido.");
    const { data: target, error } = await db.from("users").select("openId,name").eq("openId", openId).maybeSingle();
    if (error) throw new Error(error.message);
    if (!target) throw new Error("Usuário não encontrado.");
    const { error: roleError } = await db.from("users").update({ role }).eq("openId", openId);
    if (roleError) throw new Error(roleError.message);
    if (role === "user") {
      const { error: memberDeleteError } = await db.from("editorialMembers").delete().eq("openId", openId);
      if (memberDeleteError) throw new Error(memberDeleteError.message);
    } else {
      const { data: existingMember } = await db.from("editorialMembers").select("beat,profileSlug,status,createdAtMs").eq("openId", openId).maybeSingle();
      const { error: memberError } = await db.from("editorialMembers").upsert({
        openId,
        displayName: target.name || "Membro editorial",
        role,
        status: existingMember?.status || "active",
        beat: existingMember?.beat || null,
        profileSlug: existingMember?.profileSlug || null,
        createdAtMs: existingMember?.createdAtMs || Date.now(),
        updatedAtMs: Date.now()
      }, { onConflict: "openId" });
      if (memberError) throw new Error(memberError.message);
    }
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
