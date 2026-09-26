import { getSupabaseAdmin, getSupabaseServer } from "./_core/supabase";
import { ENV } from "./_core/env";
import type { AdRequest, Article, ArticleAudit, ColumnistInvite, ColumnistProfile, Comment, InsertUser, User } from "../drizzle/schema";

export async function getDb(accessToken?: string | null) {
  try { return getSupabaseServer(accessToken ?? undefined); } catch { return null; }
}

const now = () => new Date();

export async function upsertUser(user: InsertUser, accessToken?: string | null): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const supabase = await getDb(accessToken); if (!supabase) return;
  const { error } = await supabase.rpc("sync_authenticated_user", {
    p_name: user.name ?? null,
    p_email: user.email ?? null,
    p_login_method: user.loginMethod ?? "supabase",
  });
  if (error) throw error;

  // The owner account must remain an admin even if the production database
  // has not yet applied the latest role-hardening migration. This is scoped
  // to the single, documented owner email and never trusts a client-supplied role.
  if ((user.email ?? "").trim().toLowerCase() === "pchnews.oficial@gmail.com") {
    try {
      const adminDb = getSupabaseAdmin();
      const { error: roleError } = await adminDb
        .from("users")
        .update({ role: "admin" })
        .eq("openId", user.openId);
      if (roleError) throw roleError;
    } catch (roleError) {
      console.warn("[Auth] Could not enforce owner admin role:", roleError);
    }
  }
}
export async function getUserByOpenId(openId:string, accessToken?: string | null):Promise<User|undefined> {
  const db=await getDb(accessToken); if(!db) return undefined;
  const {data,error}=await db.from("users").select("*").eq("openId",openId).maybeSingle();
  if(error) throw error; return data ?? undefined;
}
export async function getEditorialSnapshot(includePrivate=false, accessToken?: string | null) {
  const db=await getDb(accessToken); if(!db) return {articles:[],comments:[],profiles:[],adRequests:[]};
  // Promote due scheduled stories server-side so publication does not depend on an open Admin tab.
  const nowMs = Date.now();
  const { error: scheduleError } = await db.from("articles").update({ status: "published", updated: "publicado automaticamente" }).eq("status", "scheduled").not("scheduledAt", "is", null).lte("scheduledAt", nowMs);
  if (scheduleError) throw scheduleError;
  const articlesQ=includePrivate?db.from("articles").select("*"):db.from("articles").select("*").in("status",["published","updated"]);
  const commentsQ=includePrivate?db.from("comments").select("*"):db.from("comments").select("*").eq("status","approved");
  const [a,c,p,ads]=await Promise.all([
    articlesQ.order("createdAt",{ascending:false}),
    commentsQ.order("createdAtMs",{ascending:false}),
    db.from("columnistProfiles").select("*").order("updatedAt",{ascending:false}),
    includePrivate?db.from("adRequests").select("*").order("createdAtMs",{ascending:false}):Promise.resolve({data:[],error:null} as any)
  ]);
  for(const r of [a,c,p,ads]) if(r.error) throw r.error;
  return {articles:a.data??[],comments:c.data??[],profiles:p.data??[],adRequests:ads.data??[]};
}
export async function getArticle(id:string, accessToken?: string | null){const db=await getDb(accessToken);if(!db)return undefined;const {data,error}=await db.from("articles").select("*").eq("id",id).maybeSingle();if(error)throw error;return data??undefined;}
export async function saveArticle(article:any, accessToken?: string | null){
  const db=await getDb(accessToken);if(!db)throw new Error("Database unavailable");
  const payload={...article,createdAt:article.createdAt??now(),updatedAt:now(),youtubeUrl:article.youtubeUrl??null,socialLinks:article.socialLinks??null,slug:article.slug??null,seoTitle:article.seoTitle??null,metaDescription:article.metaDescription??null,canonicalUrl:article.canonicalUrl??null,focusKeyword:article.focusKeyword??null,ogTitle:article.ogTitle??null,ogDescription:article.ogDescription??null,imageAlt:article.imageAlt??null,noindex:Boolean(article.noindex),contentType:article.contentType??"noticia",editorialChecklist:article.editorialChecklist??{},editorialNotes:article.editorialNotes??null,contraponto:article.contraponto??null,keyTakeaway:article.keyTakeaway??null};
  const {data,error}=await db.from("articles").upsert(payload,{onConflict:"id"}).select().single();if(error)throw error;return data;
}
export async function recordArticleView(articleId:string,visitorId:string,accessToken?:string|null){const db=await getDb(accessToken);if(!db)return {counted:false,views:0};const {data,error}=await db.rpc("increment_article_view",{p_article_id:articleId,p_visitor_id:visitorId});if(error)throw error;return data as {counted:boolean;views:number};}
export async function getViewAnalytics(author?:string,authorOpenId?:string,fromMs?:number,toMs?:number,accessToken?:string|null){
  const db=await getDb(accessToken);if(!db)return {events:[],totals:[]};
  let q=db.from("articles").select("id,views,author,authorOpenId"); if(author)q=q.eq("author",author);if(authorOpenId)q=q.eq("authorOpenId",authorOpenId);
  const {data:arts,error:ae}=await q;if(ae)throw ae;const ids=(arts??[]).map((a:any)=>a.id);if(!ids.length)return {events:[],totals:[]};
  let eq=db.from("viewEvents").select("articleId,viewedAtMs").in("articleId",ids).order("viewedAtMs",{ascending:false});
  if(fromMs)eq=eq.gte("viewedAtMs",fromMs);if(toMs)eq=eq.lte("viewedAtMs",toMs);
  const {data:events,error:ee}=await eq;if(ee)throw ee;
  return {events:events??[],totals:(arts??[]).map((a:any)=>({articleId:a.id,views:a.views}))};
}
export async function updateColumnistProfile(slug:string,profile:Omit<ColumnistProfile,"updatedAt">,accessToken?:string|null){const db=await getDb(accessToken);if(!db)throw new Error("Database unavailable");const {error}=await db.from("columnistProfiles").upsert({...profile,slug,updatedAt:now()},{onConflict:"slug"});if(error)throw error;return {success:true};}
export type EditorialSyncPayload={articles:any[];comments:Comment[];profiles:any[];adRequests:AdRequest[]};
export async function syncEditorial(payload:EditorialSyncPayload,accessToken?:string|null){
  const db=await getDb(accessToken);if(!db)throw new Error("Database unavailable");
  const ops=[
    payload.articles.length?db.from("articles").upsert(payload.articles,{onConflict:"id"}):Promise.resolve({error:null} as any),
    payload.comments.length?db.from("comments").upsert(payload.comments,{onConflict:"id"}):Promise.resolve({error:null} as any),
    payload.profiles.length?db.from("columnistProfiles").upsert(payload.profiles,{onConflict:"slug"}):Promise.resolve({error:null} as any),
    payload.adRequests.length?db.from("adRequests").upsert(payload.adRequests,{onConflict:"id"}):Promise.resolve({error:null} as any)
  ];
  for(const r of await Promise.all(ops))if(r.error)throw r.error;return {success:true};
}
export async function createInvite(invite:ColumnistInvite,accessToken?:string|null){const db=await getDb(accessToken);if(!db)throw new Error("Database unavailable");const {error}=await db.from("columnistInvites").insert(invite);if(error)throw error;return invite;}
export async function listInvites(accessToken?:string|null){const db=await getDb(accessToken);if(!db)return [];const {data,error}=await db.from("columnistInvites").select("*").order("createdAtMs",{ascending:false});if(error)throw error;return data??[];}
export async function findInvite(tokenHash:string,accessToken?:string|null){const db=await getDb(accessToken);if(!db)return undefined;const {data,error}=await db.from("columnistInvites").select("*").eq("tokenHash",tokenHash).is("acceptedAtMs",null).is("revokedAtMs",null).maybeSingle();if(error)throw error;return data??undefined;}
export async function acceptInvite(id:string,responsibilityVersion:string,accessToken?:string|null){const db=await getDb(accessToken);if(!db)throw new Error("Database unavailable");const {error}=await db.from("columnistInvites").update({acceptedAtMs:Date.now(),responsibilityAcceptedAtMs:Date.now(),responsibilityVersion}).eq("id",id);if(error)throw error;}
export async function revokeInvite(id:string,accessToken?:string|null){const db=await getDb(accessToken);if(!db)throw new Error("Database unavailable");const {error}=await db.from("columnistInvites").update({revokedAtMs:Date.now()}).eq("id",id);if(error)throw error;return {success:true};}
export async function renewInvite(id:string,tokenHash:string,expiresAtMs:number,accessToken?:string|null){const db=await getDb(accessToken);if(!db)throw new Error("Database unavailable");const {data,error}=await db.from("columnistInvites").select("*").eq("id",id).maybeSingle();if(error)throw error;if(!data||data.acceptedAtMs||data.revokedAtMs)return undefined;const next={...data,tokenHash,expiresAtMs,createdAtMs:Date.now()};const {error:ue}=await db.from("columnistInvites").update({tokenHash,expiresAtMs,createdAtMs:next.createdAtMs}).eq("id",id);if(ue)throw ue;return next;}
export async function recordArticleAudit(entry:Omit<ArticleAudit,"createdAtMs">,accessToken?:string|null){const db=await getDb(accessToken);if(!db)throw new Error("Database unavailable");const {error}=await db.from("articleAudit").insert({...entry,createdAtMs:Date.now()});if(error)throw error;return {success:true};}
export async function listArticleAudit(articleId?:string,accessToken?:string|null){const db=await getDb(accessToken);if(!db)return [];let q=db.from("articleAudit").select("*, articles(title)").order("createdAtMs",{ascending:false});if(articleId)q=q.eq("articleId",articleId);const {data,error}=await q;if(error)throw error;return (data??[]).map((x:any)=>({...x,articleTitle:x.articles?.title??null,articles:undefined}));}
export async function recordEditorialResearchContext(entry:any,accessToken?:string|null){
  const db=await getDb(accessToken);if(!db)return {success:false};
  const {error}=await db.from("editorialResearchContexts").insert(entry);
  if(error)throw error;return {success:true};
}
export async function listEditorialResearchContexts(articleId:string,accessToken?:string|null){
  const db=await getDb(accessToken);if(!db)return [];
  const {data,error}=await db.from("editorialResearchContexts").select("*").eq("articleId",articleId).order("createdAtMs",{ascending:false}).limit(20);
  if(error)throw error;return data??[];
}

export async function recordEditorialAgentRun(entry:any,accessToken?:string|null){const db=await getDb(accessToken);if(!db)return {success:false};const {error}=await db.from("editorialAgentRuns").insert(entry);if(error)throw error;return {success:true};}
export async function recordEditorialFindingDecision(entry:any,accessToken?:string|null){
  const db=await getDb(accessToken);if(!db)throw new Error("Database unavailable");
  const {data,error}=await db.from("editorialFindingDecisions").upsert(entry,{onConflict:"agentRunId,findingCode,actorOpenId"}).select().single();
  if(error)throw error;return data;
}
export async function listEditorialFindingDecisions(articleId:string,agentRunId?:string,accessToken?:string|null){
  const db=await getDb(accessToken);if(!db)return [];
  let q=db.from("editorialFindingDecisions").select("*").eq("articleId",articleId).order("updatedAtMs",{ascending:false});
  if(agentRunId)q=q.eq("agentRunId",agentRunId);
  const {data,error}=await q;if(error)throw error;return data??[];
}
export async function listEditorialAgentRuns(articleId:string,accessToken?:string|null){const db=await getDb(accessToken);if(!db)return [];const {data,error}=await db.from("editorialAgentRuns").select("*").eq("articleId",articleId).order("createdAtMs",{ascending:false}).limit(100);if(error)throw error;return data??[];}
export async function recordFreedomReview(entry:any,accessToken?:string|null){const db=await getDb(accessToken);if(!db)return {success:false};const {error}=await db.from("editorialFreedomReviews").insert(entry);if(error)throw error;return {success:true};}
export async function listUsers(accessToken?:string|null){const db=await getDb(accessToken);if(!db)return [];const {data,error}=await db.from("users").select("id,openId,name,email,role,lastSignedIn").order("lastSignedIn",{ascending:false});if(error)throw error;return data??[];}
export async function setUserRole(openId:string,role:string,accessToken?:string|null){const db=await getDb(accessToken);if(!db)throw new Error("Database unavailable");const {error}=await db.from("users").update({role}).eq("openId",openId);if(error)throw error;return {success:true};}
export async function createComment(row:Comment,accessToken?:string|null){const db=await getDb(accessToken);if(!db)throw new Error("Database unavailable");const {error}=await db.from("comments").insert(row);if(error)throw error;return row;}
export async function createAdRequest(input:{
  id:string; business:string; contactName:string; email:string; phone:string; city?:string|null;
  website?:string|null; socials?:string|null; adType:string; budget?:string|null; period?:string|null;
  message:string; consentAtMs:number; status:"received"; createdAtMs:number;
}) {
  const db = getSupabaseAdmin();
  const { data, error } = await db.from("adRequests").insert({
    id: input.id, business: input.business, contact: input.phone || input.email,
    packageName: input.adType, message: input.message, status: input.status, createdAtMs: input.createdAtMs,
    contactName: input.contactName, email: input.email, phone: input.phone, city: input.city || null,
    website: input.website || null, socials: input.socials || null, adType: input.adType,
    budget: input.budget || null, period: input.period || null, consentAtMs: input.consentAtMs, source: "public-site",
  }).select("*").single();
  if (error) throw error;
  return data;
}

export async function listPautas(accessToken?: string | null) {
  const supabase = await getDb(accessToken); if (!supabase) return [];
  const { data, error } = await supabase.from("editorialPautas").select("*").order("updatedAtMs", { ascending: false });
  if (error) throw error; return data ?? [];
}
export async function getPauta(id: string, accessToken?: string | null) {
  const supabase = await getDb(accessToken); if (!supabase) return undefined;
  const { data, error } = await supabase.from("editorialPautas").select("*").eq("id", id).maybeSingle();
  if (error) throw error; return data ?? undefined;
}
export async function savePauta(pauta: any, accessToken?: string | null) {
  const supabase = await getDb(accessToken); if (!supabase) throw new Error("Database unavailable");
  const nowMs = Date.now();
  const payload = { ...pauta, tags: pauta.tags ?? "", sourcesJson: pauta.sourcesJson ?? [], checklistJson: pauta.checklistJson ?? [], updatedAtMs: nowMs, createdAtMs: pauta.createdAtMs ?? nowMs };
  const { data, error } = await supabase.from("editorialPautas").upsert(payload, { onConflict: "id" }).select().single();
  if (error) throw error; return data;
}


export async function listEventCarousel(filters?: { state?: string; city?: string; region?: string; limit?: number }) {
  const db = await getDb(); if (!db) return [];
  const nowMs = Date.now();
  let q = db.from("events").select("*").eq("status","approved")
    .lte("promotionStartAtMs", nowMs)
    .gte("promotionEndAtMs", nowMs)
    .order("startAtMs", { ascending: true });
  const { data, error } = await q;
  if (error) throw error;
  const rows = (data || []).filter((e:any) => {
    const scope = e.visibilityScope ?? "national";
    const stateMatch = !filters?.state || !e.visibilityState || e.visibilityState.toLowerCase() === filters.state.toLowerCase();
    const cityMatch = !filters?.city || !e.visibilityCity || e.visibilityCity.toLowerCase() === filters.city.toLowerCase();
    const regionMatch = !filters?.region || !e.visibilityRegion || e.visibilityRegion.toLowerCase() === filters.region.toLowerCase();
    if (scope === "national") return true;
    if (scope === "state") return stateMatch;
    if (scope === "city") return cityMatch;
    if (scope === "regional" || scope === "subregional") return regionMatch || stateMatch;
    return true;
  });
  const score = (e:any) => {
    const remaining = Math.max(0, Number(e.startAtMs) - nowMs);
    const proximity = Math.max(0, 100000000 - remaining / 1000);
    return proximity + Number(e.editorialPriority ?? 0) * 100000 + Number(e.commercialPriority ?? 0) * 1000000;
  };
  return rows.sort((a:any,b:any) => score(b)-score(a) || Number(a.startAtMs)-Number(b.startAtMs)).slice(0, Math.min(filters?.limit ?? 8, 20));
}

export async function listPublicEvents(filters?: any) {
  const db = await getDb(); if (!db) return [];
  const nowMs = Date.now();
  // Keep the database query simple and apply lifecycle filtering in application code.
  // This avoids PostgREST OR-expression issues with camelCase columns while preserving
  // the rule: an event remains public through its end time; without an end time it
  // expires at its start time.
  let q = db.from("events").select("*").eq("status", "approved")
    .order("startAtMs", { ascending: true });
  if (filters?.state) q = q.eq("state", filters.state);
  if (filters?.city) q = q.ilike("city", filters.city);
  if (filters?.eventType) q = q.eq("eventType", filters.eventType);
  if (filters?.fromMs) q = q.gte("startAtMs", filters.fromMs);
  const { data, error } = await q; if (error) throw error;
  const rows = (data || []).filter((e) => {
    const end = e.endAtMs == null ? null : Number(e.endAtMs);
    const start = Number(e.startAtMs);
    return end !== null ? end >= nowMs : start >= nowMs;
  });
  if (filters?.nearLat === undefined || filters?.nearLng === undefined) return rows.map((e) => ({ ...e, distanceKm: null }));
  const rad = (v: number) => v * Math.PI / 180;
  const dist = (lat: number, lng: number) => {
    const R = 6371, dLat = rad(lat - filters.nearLat), dLng = rad(lng - filters.nearLng);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(filters.nearLat)) * Math.cos(rad(lat)) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };
  return rows.map((e) => ({ ...e, distanceKm: e.latitude && e.longitude ? dist(Number(e.latitude), Number(e.longitude)) : null }))
    .filter((e) => filters?.radiusKm === undefined || (e.distanceKm !== null && e.distanceKm <= filters.radiusKm))
    .sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity) || a.startAtMs - b.startAtMs);
}
export async function createEvent(input: any, accessToken?: string | null) {
  const db = await getDb(accessToken); if (!db) throw new Error("Database unavailable");
  const nowMs = Date.now();
  const { data, error } = await db.from("events").insert({
    ...input,
    visibilityScope: input.visibilityScope ?? "national",
    visibilityRegion: input.visibilityRegion ?? null,
    visibilityState: input.visibilityState ?? input.state ?? null,
    visibilitySubregion: input.visibilitySubregion ?? null,
    visibilityCity: input.visibilityCity ?? input.city ?? null,
    promotionStartAtMs: input.promotionStartAtMs ?? (Number(input.startAtMs) - 5 * 24 * 60 * 60 * 1000),
    promotionEndAtMs: input.promotionEndAtMs ?? (input.endAtMs ?? input.startAtMs),
    editorialPriority: input.editorialPriority ?? 0,
    commercialPriority: input.commercialPriority ?? 0,
    promotionType: input.promotionType ?? "normal",
    sponsored: Boolean(input.sponsored ?? false),
    paymentStatus: input.paymentStatus ?? "not_applicable",
    sourceType: input.sourceType ?? "public_submission",
    sourceName: input.sourceName ?? null,
    sourceUrl: input.sourceUrl ?? null,
    importedAtMs: input.sourceType && input.sourceType !== "public_submission" ? nowMs : null,
    status: "pending",
    createdAtMs: nowMs,
    updatedAtMs: nowMs
  }).select().single();
  if (error) throw error; return data;
}
export async function getPublicEvent(id: string, accessToken?: string | null) {
  const db = await getDb(accessToken); if (!db) return undefined;
  const { data, error } = await db.from("events").select("*").eq("id", id).eq("status", "approved").maybeSingle();
  if (error) throw error;
  if (!data) return undefined;
  const nowMs = Date.now();
  const end = data.endAtMs == null ? null : Number(data.endAtMs);
  const start = Number(data.startAtMs);
  if (end !== null ? end < nowMs : start < nowMs) return undefined;
  return data;
}
export async function listEventsAdmin(accessToken?: string | null) {
  const db = await getDb(accessToken); if (!db) return [];
  const { data, error } = await db.from("events").select("*").order("startAtMs", { ascending: true });
  if (error) throw error; return data ?? [];
}
export async function updateEventStatus(id: string, status: "pending" | "approved" | "rejected" | "cancelled", accessToken?: string | null) {
  const db = await getDb(accessToken); if (!db) throw new Error("Database unavailable");
  const { error } = await db.from("events").update({ status, updatedAtMs: Date.now() }).eq("id", id);
  if (error) throw error; return { success: true };
}
