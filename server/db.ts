import { getSupabaseAdmin, getSupabasePublic, getSupabaseServer } from "./_core/supabase";
import { ENV } from "./_core/env";
import { randomBytes } from "node:crypto";
import type { AdRequest, Article, ArticleAudit, ColumnistInvite, ColumnistProfile, Comment, InsertUser, User } from "../drizzle/schema";

export async function getDb(accessToken?: string | null) {
  try { return getSupabaseServer(accessToken ?? undefined); } catch { return null; }
}

const now = () => new Date();
const normalizeInviteSlug = (value:string) => Array.from(value.normalize("NFKD").toLowerCase()).filter((char) => !/[\u0300-\u036f]/.test(char)).join("").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

export async function upsertUser(user: InsertUser, _accessToken?: string | null): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");

  // Authentication has already been validated against Supabase Auth before this
  // function is reached. Existing users must be able to refresh their profile on
  // Cloudflare even when the service-role secret is intentionally unavailable.
  // Use the authenticated user's JWT for the normal profile sync path; reserve the
  // server-only client for first-time provisioning / privileged role assignment.
  const publicDb = _accessToken ? getSupabaseServer(_accessToken) : null;
  const adminDb = (() => {
    try { return getSupabaseAdmin(); } catch { return null; }
  })();

  const existing = publicDb
    ? await publicDb.from("users").select("openId,role,name").eq("openId", user.openId).maybeSingle()
    : { data: null, error: null };
  if (existing.error) throw existing.error;

  const isOwner = (user.email ?? "").trim().toLowerCase() === "pchnews.oficial@gmail.com";

  if (existing.data) {
    // An existing user is already authenticated and can continue with the role
    // loaded from public.users. Do not perform a normal-user UPDATE here: the
    // current RLS policy intentionally reserves UPDATE on users for admins, and
    // a failed profile sync must never turn a valid login into an authentication
    // failure. Privileged role/name synchronization remains available when the
    // server has the service-role client.
    if (adminDb) {
      const { error } = await adminDb.from("users").update({
        ...(isOwner && existing.data.role !== "admin" ? { role: "admin" } : {}),
        name: existing.data.name || user.name || null,
        email: user.email ?? null,
        loginMethod: user.loginMethod ?? "supabase",
        lastSignedIn: new Date(),
      }).eq("openId", user.openId);
      if (error) throw error;
    }
    return;
  }

  // New-account provisioning requires the server-only key because an anonymous
  // user must not be able to create or elevate an editorial account.
  if (!adminDb) {
    throw new Error("New account provisioning requires SUPABASE_SERVICE_ROLE_KEY.");
  }
  const { error } = await adminDb.from("users").upsert({
    openId: user.openId,
    name: user.name ?? null,
    email: user.email ?? null,
    loginMethod: user.loginMethod ?? "supabase",
    lastSignedIn: new Date(),
  }, { onConflict: "openId" });
  if (error) throw error;

  // The owner account is the only account that receives the automatic admin role.
  // The role is never taken from client input.
  if ((user.email ?? "").trim().toLowerCase() === "pchnews.oficial@gmail.com") {
    const { error: roleError } = await adminDb
      .from("users")
      .update({ role: "admin" })
      .eq("openId", user.openId);
    if (roleError) throw roleError;
  }
}
export async function getUserByOpenId(openId:string, accessToken?: string | null):Promise<User|undefined> {
  const db=await getDb(accessToken); if(!db) return undefined;
  const {data,error}=await db.from("users").select("*").eq("openId",openId).maybeSingle();
  if(error) throw error; return data ?? undefined;
}
export async function getEditorialSnapshot(includePrivate=false, accessToken?: string | null) {
  const db=includePrivate ? await getDb(accessToken) : getSupabasePublic();
  if(!db) return {articles:[],comments:[],profiles:[],adRequests:[]};
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
  const { data: existing, error: existingError } = await db.from("articles").select("*").eq("id", article.id).maybeSingle();
  if (existingError) throw existingError;
  // Status-only mutations may intentionally omit editorial fields. Merge with the
  // persisted row so a workflow transition can never erase SEO, checklist, scope,
  // media or other editorial metadata just because the client sent a partial payload.
  const payload={...existing,...article,id:article.id,createdAt:article.createdAt??existing?.createdAt??now(),updatedAt:now(),youtubeUrl:article.youtubeUrl??existing?.youtubeUrl??null,socialLinks:article.socialLinks??existing?.socialLinks??null,slug:article.slug??existing?.slug??null,seoTitle:article.seoTitle??existing?.seoTitle??null,metaDescription:article.metaDescription??existing?.metaDescription??null,canonicalUrl:article.canonicalUrl??existing?.canonicalUrl??null,focusKeyword:article.focusKeyword??existing?.focusKeyword??null,ogTitle:article.ogTitle??existing?.ogTitle??null,ogDescription:article.ogDescription??existing?.ogDescription??null,imageAlt:article.imageAlt??existing?.imageAlt??null,noindex:article.noindex??existing?.noindex??false,contentType:article.contentType??existing?.contentType??"noticia",editorialChecklist:article.editorialChecklist??existing?.editorialChecklist??{},editorialNotes:article.editorialNotes??existing?.editorialNotes??null,contraponto:article.contraponto??existing?.contraponto??null,keyTakeaway:article.keyTakeaway??existing?.keyTakeaway??null};
  const {data,error}=await db.from("articles").upsert(payload,{onConflict:"id"}).select().single();if(error)throw error;return data;
}
export async function recordArticleView(articleId:string,visitorId:string,_accessToken?:string|null){
  const db = getSupabaseAdmin();
  const { data, error } = await db.rpc("increment_article_view", { p_article_id: articleId, p_visitor_id: visitorId });
  if (error) throw error;
  return data as { counted: boolean; views: number };
}
export async function getViewAnalytics(author?:string,authorOpenId?:string,fromMs?:number,toMs?:number,accessToken?:string|null){
  // Analytics are already behind a protected tRPC procedure; use the server-side\n  // Supabase client here so the dashboard always reads the current database state.\n  const db = getSupabaseAdmin();
  let q=db.from("articles").select("id,views,author,authorOpenId"); if(author)q=q.eq("author",author);if(authorOpenId)q=q.eq("authorOpenId",authorOpenId);
  const {data:arts,error:ae}=await q;if(ae)throw ae;const ids=(arts??[]).map((a:any)=>a.id);if(!ids.length)return {events:[],totals:[]};
  let eq=db.from("viewEvents").select("articleId,viewedAtMs").in("articleId",ids).order("viewedAtMs",{ascending:false});
  if(fromMs)eq=eq.gte("viewedAtMs",fromMs);if(toMs)eq=eq.lte("viewedAtMs",toMs);
  const {data:events,error:ee}=await eq;if(ee)throw ee;
  return {events:events??[],totals:(arts??[]).map((a:any)=>({articleId:a.id,views:a.views}))};
}
export async function updateColumnistProfile(slug:string,profile:Omit<ColumnistProfile,"updatedAt">,accessToken?:string|null){
  const db=await getDb(accessToken);if(!db)throw new Error("Database unavailable");
  let products:any[]=[];
  try { products=typeof (profile as any).productsJson==="string" ? JSON.parse((profile as any).productsJson || "[]") : ((profile as any).productsJson || []); } catch { throw new Error("A configuração de produtos e serviços está inválida."); }
  if(!Array.isArray(products)) throw new Error("Produtos e serviços devem ser uma lista.");
  const payload={...profile,slug,productsJson:products,commercialApproved:Boolean((profile as any).commercialApproved),website:(profile as any).website||"",tiktok:(profile as any).tiktok||"",youtube:(profile as any).youtube||"",updatedAt:now()};
  const {error}=await db.from("columnistProfiles").upsert(payload,{onConflict:"slug"});if(error)throw error;return {success:true};
}
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
export async function markInviteOpened(tokenHash:string, ip?:string|null, userAgent?:string|null){
  const db=getSupabaseAdmin();
  const nowMs=Date.now();
  const {error}=await db.from("columnistInvites").update({
    openedAtMs: nowMs,
    openedIp: ip ?? null,
    openedUserAgent: userAgent ?? null
  }).eq("tokenHash",tokenHash).is("acceptedAtMs",null).is("revokedAtMs",null).is("openedAtMs",null);
  if(error)throw error;
  return {success:true,openedAtMs:nowMs};
}
export async function createInviteAccessLink(tokenHash:string, redirectTo:string){
  const db=getSupabaseAdmin();
  const {data:invite,error:ie}=await db.from("columnistInvites").select("*").eq("tokenHash",tokenHash).is("acceptedAtMs",null).is("revokedAtMs",null).maybeSingle();
  if(ie) throw ie;
  if(!invite) throw new Error("Convite não encontrado.");
  if(Number(invite.expiresAtMs) < Date.now()) throw new Error("Esse convite expirou.");
  if(!invite.manualReleasedAtMs) throw new Error("Este convite ainda não foi liberado pelo administrador.");
  const {data:link,error:le}=await db.auth.admin.generateLink({type:"magiclink",email:String(invite.email).trim().toLowerCase(),options:{redirectTo}});
  if(le) throw le;
  if(!link?.properties?.action_link) throw new Error("Não foi possível gerar o acesso.");
  return {actionLink:link.properties.action_link,email:invite.email,role:invite.role || "columnist"};
}
export async function manuallyReleaseInvite(id:string, actorOpenId:string, reason?:string|null, accessToken?:string|null){
  const db=getSupabaseAdmin();
  const {data:invite,error:ie}=await db.from("columnistInvites").select("*").eq("id",id).maybeSingle();
  if(ie)throw ie;
  if(!invite)throw new Error("Convite não encontrado.");
  if(invite.revokedAtMs)throw new Error("Esse convite está revogado.");
  const nowMs=Date.now();
  const {data:existingUser,error:ue}=await db.from("users").select("openId,email,role,name").ilike("email",invite.email).maybeSingle();
  if(ue)throw ue;
  const role=String(invite.id).split("-")[1] || "columnist";
  if(existingUser){
    const nextRole=existingUser.role==="admin" ? "admin" : role;
    const {error:re}=await db.from("users").update({role:nextRole,name:existingUser.name || invite.name}).eq("openId",existingUser.openId);
    if(re)throw re;
  }
  const {data:updated,error:ue2}=await db.from("columnistInvites").update({
    manualReleasedAtMs:nowMs,
    manualReleasedByOpenId:actorOpenId,
    manualReleaseReason:reason?.trim() || "Liberação manual pelo administrador.",
    expiresAtMs: Math.max(Number(invite.expiresAtMs || 0), nowMs + 7*24*60*60*1000),
    revokedAtMs:null
  }).eq("id",id).select("*").single();
  if(ue2)throw ue2;
  return {success:true,invite:updated,existingUser:Boolean(existingUser),role};
}
export async function findInvite(tokenHash:string,accessToken?:string|null){
  // Public invite preview must work before authentication. The token itself is a
  // high-entropy secret, so perform this single-row lookup with the server-only
  // client instead of the anonymous client, which is correctly blocked by RLS.
  const db=accessToken ? await getDb(accessToken) : getSupabaseAdmin();
  if(!db)return undefined;const {data,error}=await db.from("columnistInvites").select("*").eq("tokenHash",tokenHash).is("acceptedAtMs",null).is("revokedAtMs",null).maybeSingle();if(error)throw error;return data??undefined;}
export async function findInviteBySlug(slug:string,accessToken?:string|null){ const db=accessToken ? await getDb(accessToken) : getSupabaseAdmin(); if(!db)return undefined; const {data,error}=await db.from("columnistInvites").select("*").eq("slug",slug.toLowerCase()).is("acceptedAtMs",null).is("revokedAtMs",null).maybeSingle(); if(error)throw error; return data??undefined; }
export async function acceptInvite(id:string,terms:{responsibilityVersion:string;partnershipVersion:string;confidentialityVersion:string;acceptedIp?:string|null;userAgent?:string|null;termsId:string},accessToken?:string|null){const db=await getDb(accessToken);if(!db)throw new Error("Database unavailable");const acceptedAtMs=Date.now();const {error}=await db.from("columnistInvites").update({acceptedAtMs,responsibilityAcceptedAtMs:acceptedAtMs,responsibilityVersion:terms.responsibilityVersion,partnershipAcceptedAtMs:acceptedAtMs,partnershipVersion:terms.partnershipVersion,confidentialityAcceptedAtMs:acceptedAtMs,confidentialityVersion:terms.confidentialityVersion,termsAcceptedIp:terms.acceptedIp??null,termsAcceptedUserAgent:terms.userAgent??null,termsAcceptedTermsId:terms.termsId}).eq("id",id);if(error)throw error;}
export async function revokeInvite(id:string,accessToken?:string|null){const db=await getDb(accessToken);if(!db)throw new Error("Database unavailable");const {error}=await db.from("columnistInvites").update({revokedAtMs:Date.now()}).eq("id",id);if(error)throw error;return {success:true};}
export async function deleteInvite(id:string,accessToken?:string|null){const db=await getDb(accessToken);if(!db)throw new Error("Database unavailable");const {data,error}=await db.from("columnistInvites").select("id,acceptedAtMs").eq("id",id).maybeSingle();if(error)throw error;if(!data)throw new Error("Convite não encontrado.");if(data.acceptedAtMs)throw new Error("Convites já aceitos não podem ser apagados.");const {error:de}=await db.from("columnistInvites").delete().eq("id",id);if(de)throw de;return {success:true};}
export async function renewInvite(id:string,tokenHash:string,expiresAtMs:number,accessToken?:string|null){const db=await getDb(accessToken);if(!db)throw new Error("Database unavailable");const {data,error}=await db.from("columnistInvites").select("*").eq("id",id).maybeSingle();if(error)throw error;if(!data||data.acceptedAtMs||data.revokedAtMs)return undefined;const nextSlug=normalizeInviteSlug(data.name);const next={...data,tokenHash,expiresAtMs,slug:nextSlug,createdAtMs:Date.now()};const {error:ue}=await db.from("columnistInvites").update({tokenHash,expiresAtMs,slug:nextSlug,createdAtMs:next.createdAtMs}).eq("id",id);if(ue)throw ue;return next;}
export async function createReplacementInvite(sourceId:string,input:{email:string,name:string,role:string},tokenHash:string,expiresAtMs:number,accessToken?:string|null){const db=await getDb(accessToken);if(!db)throw new Error("Database unavailable");const {data:source,error:se}=await db.from("columnistInvites").select("*").eq("id",sourceId).maybeSingle();if(se)throw se;if(!source||source.acceptedAtMs)return undefined;const now=Date.now();const row={id:`invite-${input.role}-${now}-${randomBytes(4).toString("hex")}`,email:input.email.trim().toLowerCase(),name:input.name.trim(),slug:normalizeInviteSlug(input.name),tokenHash,expiresAtMs,createdAtMs:now,acceptedAtMs:null,revokedAtMs:null};const {data,error}=await db.from("columnistInvites").insert(row).select("*").single();if(error)throw error;return data;}
export async function recordArticleAudit(entry:Omit<ArticleAudit,"createdAtMs">,accessToken?:string|null){const db=getSupabaseAdmin();const {error}=await db.from("articleAudit").insert({...entry,createdAtMs:Date.now()});if(error)throw error;return {success:true};}
export async function listArticleAudit(articleId?:string,accessToken?:string|null){const db=getSupabaseAdmin();let q=db.from("articleAudit").select("*, articles(title)").order("createdAtMs",{ascending:false});if(articleId)q=q.eq("articleId",articleId);const {data,error}=await q;if(error)throw error;return (data??[]).map((x:any)=>({...x,articleTitle:x.articles?.title??null,articles:undefined}));}
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

export async function getEditorialAgentAccess(role: string, accessToken?: string | null) {
  if (role === "admin") return true;
  const db = getSupabaseAdmin();
  const { data, error } = await db.from("editorialAgentAccess").select("enabled").eq("agentId","*").eq("role",role).maybeSingle();
  if (error) throw error;
  return Boolean(data?.enabled);
}
export async function setEditorialAgentAccess(role: string, enabled: boolean, accessToken?: string | null) {
  const db = getSupabaseAdmin();
  const { error } = await db.from("editorialAgentAccess").upsert({ id: `access-all-${role}`, agentId:"*", role, enabled, updatedAtMs:Date.now() }, { onConflict:"agentId,role" });
  if (error) throw error;
  return { role, enabled };
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
  message:string; destinationUrl?:string|null; creativeUrl?:string|null; creativeNeed?:"client_artwork"|"pch_creation"|"no_artwork_yet"; consentAtMs:number; status:"received"; createdAtMs:number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const { error } = await db.from("adRequests").insert({
    id: input.id, business: input.business, contact: input.phone || input.email,
    packageName: input.adType, message: input.message, status: input.status, createdAtMs: input.createdAtMs,
    contactName: input.contactName, email: input.email, phone: input.phone, city: input.city || null,
    website: input.website || null, socials: input.socials || null, adType: input.adType,
    budget: input.budget || null, period: input.period || null, creativeUrl: input.creativeUrl || null, creativeNeed: input.creativeNeed || "no_artwork_yet", destinationUrl: input.destinationUrl || null, consentAtMs: input.consentAtMs, source: "public-site",
  });
  if (error) throw error;
  return { ...input };
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


export async function getAgendaMonetizationSettings(accessToken?: string | null) {
  const db = await getDb(accessToken); if (!db) return { enabled: false, provider: "stripe", currency: "BRL", featuredPriceCents: null, sponsoredPriceCents: null };
  const { data, error } = await db.from("agenda_monetization_settings").select("*").eq("id", 1).maybeSingle();
  if (error) throw error;
  return data ?? { enabled: false, provider: "stripe", currency: "BRL", featuredPriceCents: null, sponsoredPriceCents: null };
}

export async function listEventPromotions(accessToken?: string | null) {
  const db = await getDb(accessToken); if (!db) return [];
  const { data, error } = await db.from("event_promotions").select("*, events(title,startAtMs,city,state)").order("createdAtMs", { ascending: false });
  if (error) throw error;
  return data ?? [];
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
  // Public agenda reads must use the server-only Supabase client. The Admin uses
  // an authenticated session, while the public site has no session; relying on
  // the request client here can therefore make the same approved event appear
  // in Admin but disappear from the public Agenda.
  const db = getSupabaseAdmin();
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
  });
  if (error) throw error;
  return { ...input, status: "pending", createdAtMs: nowMs, updatedAtMs: nowMs };
}
export async function getPublicEvent(id: string, _accessToken?: string | null) {
  // Same server-side read path as the public agenda list.
  const db = getSupabaseAdmin();
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
export async function updateEvent(id: string, input: any, accessToken?: string | null) {
  const db = await getDb(accessToken); if (!db) throw new Error("Database unavailable");
  const payload = {
    title: input.title,
    description: input.description,
    eventType: input.eventType,
    organizer: input.organizer,
    contact: input.contact,
    startAtMs: input.startAtMs,
    endAtMs: input.endAtMs ?? null,
    venue: input.venue,
    address: input.address,
    city: input.city,
    state: input.state,
    country: input.country ?? "Brasil",
    latitude: input.latitude ?? null,
    longitude: input.longitude ?? null,
    image: input.image ?? null,
    website: input.website ?? null,
    price: input.price ?? null,
    visibilityScope: input.visibilityScope ?? "national",
    visibilityRegion: input.visibilityRegion ?? null,
    visibilityState: input.visibilityState ?? input.state ?? null,
    visibilitySubregion: input.visibilitySubregion ?? null,
    visibilityCity: input.visibilityCity ?? input.city ?? null,
    updatedAtMs: Date.now(),
  };
  const { error } = await db.from("events").update(payload).eq("id", id);
  if (error) throw error;
  return { success: true };
}


export async function listEditorialSubthemes(includeInactive = false, accessToken?: string | null) {
  const db = includeInactive ? await getDb(accessToken) : getSupabasePublic();
  if (!db) return [];
  let query = db.from("editorialSubthemes").select("*").order("sortOrder", { ascending: true }).order("label", { ascending: true });
  if (!includeInactive) query = query.eq("active", true);
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function saveEditorialSubtheme(input: { id?: string; label: string; parentCategory?: string; sortOrder?: number; active?: boolean }, accessToken?: string | null) {
  const db = await getDb(accessToken);
  if (!db) throw new Error("Database unavailable");
  const label = input.label.trim().slice(0, 120);
  if (!label) throw new Error("O nome do tema é obrigatório.");
  const slug = label.toLowerCase().normalize("NFD").replace(/[\\u0300-\\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  if (!slug) throw new Error("Não foi possível gerar um identificador para o tema.");
  const payload = {
    ...(input.id ? { id: input.id } : {}),
    label,
    slug,
    parentCategory: (input.parentCategory || "Sociedade").trim().slice(0, 120),
    sortOrder: Number.isFinite(input.sortOrder) ? Math.max(0, Math.round(input.sortOrder as number)) : 0,
    active: input.active !== false,
    updatedAt: new Date().toISOString(),
  };
  const { data, error } = await db.from("editorialSubthemes").upsert(payload, { onConflict: input.id ? "id" : "slug" }).select("*").single();
  if (error) throw error;
  return data;
}

export async function deleteEditorialSubtheme(id: string, accessToken?: string | null) {
  const db = await getDb(accessToken);
  if (!db) throw new Error("Database unavailable");
  const { error } = await db.from("editorialSubthemes").delete().eq("id", id);
  if (error) throw error;
  return { id };
}
