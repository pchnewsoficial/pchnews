import { desc } from "drizzle-orm";
import { getSupabaseServer } from "./_core/supabase";
import { ENV } from "./_core/env";
import type { AdRequest, Article, ArticleAudit, ColumnistInvite, ColumnistProfile, Comment, InsertUser, User } from "../drizzle/schema";

export async function getDb(accessToken?: string | null) {
  try { return getSupabaseServer(accessToken ?? undefined); } catch { return null; }
}

const now = () => new Date();

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const supabase = await getDb(); if (!supabase) return;
  const payload: any = { openId:user.openId, name:user.name ?? null, email:user.email ?? null, loginMethod:user.loginMethod ?? null, lastSignedIn:user.lastSignedIn ?? now() };
  if (user.role) payload.role = user.role;
  if (!user.role && ENV.ownerOpenId && user.openId === ENV.ownerOpenId) payload.role = "admin";
  const { error } = await supabase.from("users").upsert(payload, { onConflict:"openId" });
  if (error) throw error;
}
export async function getUserByOpenId(openId:string):Promise<User|undefined> {
  const db=await getDb(accessToken); if(!db) return undefined;
  const {data,error}=await db.from("users").select("*").eq("openId",openId).maybeSingle();
  if(error) throw error; return data ?? undefined;
}
export async function getEditorialSnapshot(includePrivate=false) {
  const db=await getDb(accessToken); if(!db) return {articles:[],comments:[],profiles:[],adRequests:[]};
  const articlesQ=includePrivate?db.from("articles").select("*"):db.from("articles").select("*").eq("status","published");
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
export async function getArticle(id:string){const db=await getDb(accessToken);if(!db)return undefined;const {data,error}=await db.from("articles").select("*").eq("id",id).maybeSingle();if(error)throw error;return data??undefined;}
export async function saveArticle(article:any){
  const db=await getDb(accessToken);if(!db)throw new Error("Database unavailable");
  const payload={...article,createdAt:article.createdAt??now(),updatedAt:now(),youtubeUrl:article.youtubeUrl??null,socialLinks:article.socialLinks??null,slug:article.slug??null,seoTitle:article.seoTitle??null,metaDescription:article.metaDescription??null,canonicalUrl:article.canonicalUrl??null,focusKeyword:article.focusKeyword??null,ogTitle:article.ogTitle??null,ogDescription:article.ogDescription??null,imageAlt:article.imageAlt??null,noindex:Boolean(article.noindex)};
  const {data,error}=await db.from("articles").upsert(payload,{onConflict:"id"}).select().single();if(error)throw error;return data;
}
export async function recordArticleView(articleId:string,visitorId:string){const db=await getDb(accessToken);if(!db)return {counted:false,views:0};const {data,error}=await db.rpc("increment_article_view",{p_article_id:articleId,p_visitor_id:visitorId});if(error)throw error;return data as {counted:boolean;views:number};}
export async function getViewAnalytics(author?:string,authorOpenId?:string,fromMs?:number,toMs?:number){
  const db=await getDb(accessToken);if(!db)return {events:[],totals:[]};
  let q=db.from("articles").select("id,views,author,authorOpenId"); if(author)q=q.eq("author",author);if(authorOpenId)q=q.eq("authorOpenId",authorOpenId);
  const {data:arts,error:ae}=await q;if(ae)throw ae;const ids=(arts??[]).map((a:any)=>a.id);if(!ids.length)return {events:[],totals:[]};
  let eq=db.from("viewEvents").select("articleId,viewedAtMs").in("articleId",ids).order("viewedAtMs",{ascending:false});
  if(fromMs)eq=eq.gte("viewedAtMs",fromMs);if(toMs)eq=eq.lte("viewedAtMs",toMs);
  const {data:events,error:ee}=await eq;if(ee)throw ee;
  return {events:events??[],totals:(arts??[]).map((a:any)=>({articleId:a.id,views:a.views}))};
}
export async function updateColumnistProfile(slug:string,profile:Omit<ColumnistProfile,"updatedAt">){const db=await getDb(accessToken);if(!db)throw new Error("Database unavailable");const {error}=await db.from("columnistProfiles").upsert({...profile,slug,updatedAt:now()},{onConflict:"slug"});if(error)throw error;return {success:true};}
export type EditorialSyncPayload={articles:any[];comments:Comment[];profiles:any[];adRequests:AdRequest[]};
export async function syncEditorial(payload:EditorialSyncPayload){
  const db=await getDb(accessToken);if(!db)throw new Error("Database unavailable");
  const ops=[
    payload.articles.length?db.from("articles").upsert(payload.articles,{onConflict:"id"}):Promise.resolve({error:null} as any),
    payload.comments.length?db.from("comments").upsert(payload.comments,{onConflict:"id"}):Promise.resolve({error:null} as any),
    payload.profiles.length?db.from("columnistProfiles").upsert(payload.profiles,{onConflict:"slug"}):Promise.resolve({error:null} as any),
    payload.adRequests.length?db.from("adRequests").upsert(payload.adRequests,{onConflict:"id"}):Promise.resolve({error:null} as any)
  ];
  for(const r of await Promise.all(ops))if(r.error)throw r.error;return {success:true};
}
export async function createInvite(invite:ColumnistInvite){const db=await getDb(accessToken);if(!db)throw new Error("Database unavailable");const {error}=await db.from("columnistInvites").insert(invite);if(error)throw error;return invite;}
export async function listInvites(){const db=await getDb(accessToken);if(!db)return [];const {data,error}=await db.from("columnistInvites").select("*").order("createdAtMs",{ascending:false});if(error)throw error;return data??[];}
export async function findInvite(tokenHash:string){const db=await getDb(accessToken);if(!db)return undefined;const {data,error}=await db.from("columnistInvites").select("*").eq("tokenHash",tokenHash).is("acceptedAtMs",null).is("revokedAtMs",null).maybeSingle();if(error)throw error;return data??undefined;}
export async function acceptInvite(id:string){const db=await getDb(accessToken);if(!db)throw new Error("Database unavailable");const {error}=await db.from("columnistInvites").update({acceptedAtMs:Date.now()}).eq("id",id);if(error)throw error;}
export async function revokeInvite(id:string){const db=await getDb(accessToken);if(!db)throw new Error("Database unavailable");const {error}=await db.from("columnistInvites").update({revokedAtMs:Date.now()}).eq("id",id);if(error)throw error;return {success:true};}
export async function renewInvite(id:string,tokenHash:string,expiresAtMs:number){const db=await getDb(accessToken);if(!db)throw new Error("Database unavailable");const {data,error}=await db.from("columnistInvites").select("*").eq("id",id).maybeSingle();if(error)throw error;if(!data||data.acceptedAtMs||data.revokedAtMs)return undefined;const next={...data,tokenHash,expiresAtMs,createdAtMs:Date.now()};const {error:ue}=await db.from("columnistInvites").update({tokenHash,expiresAtMs,createdAtMs:next.createdAtMs}).eq("id",id);if(ue)throw ue;return next;}
export async function recordArticleAudit(entry:Omit<ArticleAudit,"createdAtMs">){const db=await getDb(accessToken);if(!db)throw new Error("Database unavailable");const {error}=await db.from("articleAudit").insert({...entry,createdAtMs:Date.now()});if(error)throw error;return {success:true};}
export async function listArticleAudit(articleId?:string){const db=await getDb(accessToken);if(!db)return [];let q=db.from("articleAudit").select("*, articles(title)").order("createdAtMs",{ascending:false});if(articleId)q=q.eq("articleId",articleId);const {data,error}=await q;if(error)throw error;return (data??[]).map((x:any)=>({...x,articleTitle:x.articles?.title??null,articles:undefined}));}
export async function recordEditorialAgentRun(entry:any){const db=await getDb(accessToken);if(!db)return {success:false};const {error}=await db.from("editorialAgentRuns").insert(entry);if(error)throw error;return {success:true};}
export async function listEditorialAgentRuns(articleId:string){const db=await getDb(accessToken);if(!db)return [];const {data,error}=await db.from("editorialAgentRuns").select("*").eq("articleId",articleId).order("createdAtMs",{ascending:false}).limit(100);if(error)throw error;return data??[];}
export async function recordFreedomReview(entry:any){const db=await getDb(accessToken);if(!db)return {success:false};const {error}=await db.from("editorialFreedomReviews").insert(entry);if(error)throw error;return {success:true};}
export async function listUsers(){const db=await getDb(accessToken);if(!db)return [];const {data,error}=await db.from("users").select("id,openId,name,email,role,lastSignedIn").order("lastSignedIn",{ascending:false});if(error)throw error;return data??[];}
export async function setUserRole(openId:string,role:string){const db=await getDb(accessToken);if(!db)throw new Error("Database unavailable");const {error}=await db.from("users").update({role}).eq("openId",openId);if(error)throw error;return {success:true};}
export async function createComment(row:Comment){const db=await getDb(accessToken);if(!db)throw new Error("Database unavailable");const {error}=await db.from("comments").insert(row);if(error)throw error;return row;}
