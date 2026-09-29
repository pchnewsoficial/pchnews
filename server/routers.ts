import { createHash, randomBytes } from "node:crypto";
import { syncHostingPressPilulas } from "./pilulasSync";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, columnistProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { acceptInvite, createAdRequest, createComment, createInvite, findInvite, getArticle, getDb, getEditorialSnapshot, getViewAnalytics, listArticleAudit, listInvites, listUsers, recordArticleAudit, recordArticleView, renewInvite, createReplacementInvite, deleteInvite, revokeInvite, saveArticle, setUserRole, syncEditorial, updateColumnistProfile, recordEditorialAgentRun, listEditorialAgentRuns, recordEditorialFindingDecision, listEditorialFindingDecisions, listPautas, getPauta, savePauta, recordEditorialResearchContext, listEditorialResearchContexts, listPublicEvents, createEvent, getPublicEvent, listEventsAdmin, updateEventStatus, updateEvent, listEventCarousel, getAgendaMonetizationSettings, listEventPromotions } from "./db";
import { storagePut, storageList, storageDelete } from "./storage";
import { sendInviteEmail, smtpConfigured } from "./email";
import { ENV } from "./_core/env";
import { getSupabaseAdmin } from "./_core/supabase";
const INVITE_ROLES = ["columnist", "journalist", "editor", "reviewer"] as const;
type InviteRole = (typeof INVITE_ROLES)[number];
/** Invite role is encoded in the invite id (invite-<role>-<ts>-<hex>); legacy ids are columnist invites. */
function roleFromInviteId(id: string): InviteRole {
  const candidate = id.split("-")[1] as InviteRole;
  return INVITE_ROLES.includes(candidate) ? candidate : "columnist";
}
import { recordFreedomReview } from "./db";
// Production build guard: keep editorial event routes type-safe.
import { runEditorialAgent, type EditorialAgentId } from "./editorialAgents";
import { getApiHealth, getBcbSeries, getNewsRadar, getWeather, geocodeBrazil, getIbgeMunicipalities } from "./apiHub";
import { collectEditorialResearchContext } from "./apiHub/editorialContext";
const editorialContentType = z.enum(["noticia","reportagem","analise","coluna","pilula","entrevista","patrocinado"]);
const editorialChecklistSchema = z.object({ fatoConfirmado:z.boolean(), fontesIdentificadas:z.boolean(), dadosConferidos:z.boolean(), contraditorioQuandoNecessario:z.boolean(), fatoOpiniaoSeparados:z.boolean(), tituloCorresponde:z.boolean(), aberturaEntregaRelevancia:z.boolean(), leitorLeigoEntende:z.boolean(), pchAcrescentaCompreensao:z.boolean(), chaveFinal:z.boolean(), comercialIdentificado:z.boolean(), imagemDireitoCredito:z.boolean(), revisaoFinal:z.boolean() });
const articleSchema = z.object({ id: z.string(), title: z.string(), category: z.string(), author: z.string(), authorOpenId: z.string().nullable().optional(), summary: z.string(), date: z.string(), updated: z.string(), status: z.enum(["published", "draft", "review", "revised", "approved", "scheduled", "updated", "archived"]), views: z.number().int(), image: z.string(), bodyHtml: z.string(), scheduledAt: z.number().nullable(), editionNumber: z.number().int().positive().nullable().optional(), authorProfileSlug: z.string().nullable().optional(), tags: z.string(), youtubeUrl: z.string().nullable().optional(), socialLinks: z.string().nullable().optional(), contentType: editorialContentType.default("noticia"), editorialChecklist: editorialChecklistSchema.optional(), editorialNotes: z.string().nullable().optional(), contraponto: z.string().nullable().optional(), keyTakeaway: z.string().nullable().optional(), createdAt: z.coerce.date().optional(), updatedAt: z.coerce.date().optional() });
const commentSchema = z.object({ id: z.string(), articleId: z.string(), name: z.string(), text: z.string(), createdAtMs: z.number().int(), status: z.enum(["pending", "approved", "rejected"]), reply: z.string().nullable().default(null), repliedBy: z.string().nullable().default(null), repliedAtMs: z.number().int().nullable().default(null) });
const profileSchema = z.object({ slug: z.string(), name: z.string(), beat: z.string(), bio: z.string(), photo: z.string(), instagram: z.string(), facebook: z.string(), x: z.string(), linkedin: z.string(), updatedAt: z.coerce.date().optional() });
const adSchema = z.object({ id: z.string(), business: z.string(), contact: z.string(), packageName: z.string(), message: z.string(), status: z.enum(["received", "reviewing", "approved"]), createdAtMs: z.number().int() });
const profileUpdateSchema = z.object({ slug: z.string(), name: z.string().min(1), beat: z.string(), bio: z.string(), photo: z.string(), instagram: z.string(), facebook: z.string(), x: z.string(), linkedin: z.string() });
const uploadSchema = z.object({ slug: z.string(), fileName: z.string().regex(/\.(png|jpe?g|webp|gif)$/i), contentType: z.enum(["image/png", "image/jpeg", "image/webp", "image/gif"]), base64: z.string().min(20).max(8_000_000) });
const slugify = (value: string) => value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");
const articleInput = z.object({ id: z.string(), title: z.string(), category: z.string(), author: z.string(), authorOpenId: z.string().nullable().optional(), summary: z.string(), date: z.string(), updated: z.string(), status: z.enum(["published", "draft", "review", "revised", "approved", "scheduled", "updated", "archived"]), views: z.number().int(), image: z.string(), bodyHtml: z.string(), scheduledAt: z.number().nullable(), editionNumber: z.number().int().positive().nullable().optional(), authorProfileSlug: z.string().nullable().optional(), tags: z.string(), youtubeUrl: z.string().nullable().optional(), socialLinks: z.string().nullable().optional(), scope: z.string().optional(), region: z.string().nullable().optional(), state: z.string().nullable().optional(), country: z.string().nullable().optional(), language: z.string().optional(), featured: z.boolean().optional(), sourceUrl: z.string().nullable().optional(), sourceName: z.string().nullable().optional(), slug: z.string().nullable().optional(), seoTitle: z.string().nullable().optional(), metaDescription: z.string().nullable().optional(), canonicalUrl: z.string().nullable().optional(), focusKeyword: z.string().nullable().optional(), ogTitle: z.string().nullable().optional(), ogDescription: z.string().nullable().optional(), imageAlt: z.string().nullable().optional(), noindex: z.boolean().optional(), contentType: editorialContentType.default("noticia"), editorialChecklist: editorialChecklistSchema.default({ fatoConfirmado:false,fontesIdentificadas:false,dadosConferidos:false,contraditorioQuandoNecessario:false,fatoOpiniaoSeparados:false,tituloCorresponde:false,aberturaEntregaRelevancia:false,leitorLeigoEntende:false,pchAcrescentaCompreensao:false,chaveFinal:false,comercialIdentificado:false,imagemDireitoCredito:false,revisaoFinal:false }), editorialNotes: z.string().nullable().optional(), contraponto: z.string().nullable().optional(), keyTakeaway: z.string().nullable().optional() });
export const appRouter = router({
  system: systemRouter,
  apiHub: router({
    health: adminProcedure.query(() => ({ providers: getApiHealth() })),
    weather: publicProcedure.input(z.object({ latitude: z.number().min(-90).max(90), longitude: z.number().min(-180).max(180) })).query(({ input }) => getWeather(input.latitude, input.longitude)),
    bcbSeries: columnistProcedure.input(z.object({ seriesId: z.number().int().positive(), startDate: z.string().optional(), endDate: z.string().optional() })).query(({ input }) => getBcbSeries(input.seriesId, input.startDate, input.endDate)),
    geocodeBrazil: columnistProcedure.input(z.object({ query: z.string().min(2).max(160) })).query(({ input }) => geocodeBrazil(input.query)),
    ibgeMunicipalities: columnistProcedure.input(z.object({ query: z.string().min(2).max(100) })).query(({ input }) => getIbgeMunicipalities(input.query)),
    newsRadar: columnistProcedure.input(z.object({ provider: z.enum(["mediastack", "currents"]), query: z.string().max(120).optional() })).query(({ input }) => getNewsRadar(input.provider, input.query)),
  }),
  pauta: router({
    list: columnistProcedure.query(({ ctx }) => listPautas(ctx.accessToken)),
    create: columnistProcedure.input(z.object({
      id: z.string().min(1), title: z.string().min(1), angle: z.string().min(1), briefing: z.string().default(""), category: z.string().min(1),
      priority: z.enum(["low","normal","high","urgent"]), status: z.enum(["idea","planned","assigned","reporting","review","ready","published","archived"]),
      assignedToOpenId: z.string().nullable().optional(), assignedToName: z.string().nullable().optional(), deadlineAtMs: z.number().nullable().optional(), plannedPublishAtMs: z.number().nullable().optional(),
      tags: z.string().default(""), sourcesJson: z.array(z.any()).default([]), checklistJson: z.array(z.any()).default([]), articleId: z.string().nullable().optional()
    })).mutation(async ({ input, ctx }) => {
      const row = { ...input, assignedToOpenId: input.assignedToOpenId ?? null, assignedToName: input.assignedToName ?? null, deadlineAtMs: input.deadlineAtMs ?? null, plannedPublishAtMs: input.plannedPublishAtMs ?? null, articleId: input.articleId ?? null, createdByOpenId: ctx.user.openId, createdByName: ctx.user.name || ctx.user.email || "Redação PCH News" };
      return savePauta(row, ctx.accessToken);
    }),
    update: columnistProcedure.input(z.object({
      id: z.string().min(1), title: z.string().min(1), angle: z.string().min(1), briefing: z.string().default(""), category: z.string().min(1),
      priority: z.enum(["low","normal","high","urgent"]), status: z.enum(["idea","planned","assigned","reporting","review","ready","published","archived"]),
      assignedToOpenId: z.string().nullable().optional(), assignedToName: z.string().nullable().optional(), deadlineAtMs: z.number().nullable().optional(), plannedPublishAtMs: z.number().nullable().optional(),
      tags: z.string().default(""), sourcesJson: z.array(z.any()).default([]), checklistJson: z.array(z.any()).default([]), articleId: z.string().nullable().optional()
    })).mutation(async ({ input, ctx }) => {
      const existing = await getPauta(input.id, ctx.accessToken);
      if (!existing) throw new Error("Pauta não encontrada.");
      if (ctx.user.role !== "admin" && existing.createdByOpenId !== ctx.user.openId && existing.assignedToOpenId !== ctx.user.openId) throw new Error("Você não tem permissão para alterar esta pauta.");
      if (ctx.user.role !== "admin" && input.assignedToOpenId && input.assignedToOpenId !== ctx.user.openId && existing.assignedToOpenId !== ctx.user.openId) throw new Error("Somente o administrador pode atribuir a pauta a outra pessoa.");
      return savePauta({ ...existing, ...input, assignedToOpenId: input.assignedToOpenId ?? null, assignedToName: input.assignedToName ?? null, deadlineAtMs: input.deadlineAtMs ?? null, plannedPublishAtMs: input.plannedPublishAtMs ?? null, articleId: input.articleId ?? null }, ctx.accessToken);
    })
  }),
  auth: router({ me: publicProcedure.query((opts) => opts.ctx.user), logout: publicProcedure.mutation(({ ctx }) => { const cookieOptions = getSessionCookieOptions(ctx.req); ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 }); return { success: true } as const; }) }),
  editorialAgents: router({
    run: columnistProcedure.input(z.object({
      articleId: z.string().min(1),
      agentId: z.enum(["story-editor","fact-checker","seo-optimization-specialist","publication-readiness","ethics-advisor","multi-platform-distributor","liberdade-editorial","beyond-news","journalism-master-orchestrator"]),
      article: z.object({
        id: z.string(), title: z.string(), category: z.string(), author: z.string(), summary: z.string(),
        bodyHtml: z.string(), image: z.string(), tags: z.string(), status: z.string(), scheduledAt: z.number().nullable().optional(),
        region: z.string().nullable().optional(), state: z.string().nullable().optional(), country: z.string().nullable().optional()
      })
    })).mutation(async ({ input, ctx }) => {
      let researchContext;
      if (input.agentId === "journalism-master-orchestrator" || input.agentId === "fact-checker") {
        researchContext = await collectEditorialResearchContext({
          title: input.article.title,
          category: input.article.category,
          region: (input.article as any).region ?? null,
          state: (input.article as any).state ?? null,
          country: (input.article as any).country ?? null
        });
        if (input.articleId !== "draft-preview") await recordEditorialResearchContext({
          id: `research-${Date.now()}-${randomBytes(4).toString("hex")}`,
          articleId: input.articleId,
          fetchedAtMs: researchContext.fetchedAtMs,
          providersJson: JSON.stringify(researchContext.providers),
          contextJson: JSON.stringify(researchContext),
          actorOpenId: ctx.user.openId,
          createdAtMs: Date.now()
        }, ctx.accessToken);
      }
      const result = runEditorialAgent(input.agentId as EditorialAgentId, input.article, researchContext);
      const runId = `agent-${Date.now()}-${randomBytes(4).toString("hex")}`;
      const db = await getDb(ctx.accessToken);
      if (db) {
        await recordEditorialAgentRun({
          id: runId,
          articleId: input.articleId,
          agentId: result.agentId,
          agentName: result.agentName,
          status: result.status,
          findingsJson: JSON.stringify(result.findings),
          outputJson: JSON.stringify(result.output),
          actorOpenId: ctx.user.openId,
          createdAtMs: Date.now()
        }, ctx.accessToken);
        const freedom = result.agentId === "liberdade-editorial" ? result : (result.output as any)?.agents?.find((a: any) => a.agentId === "liberdade-editorial");
        if (freedom) { const r = freedom.output as any; await recordFreedomReview({ id: `freedom-${Date.now()}-${randomBytes(4).toString("hex")}`, articleId: input.articleId, rulesetVersion: r.rulesetVersion, status: freedom.status, score: r.score, contentType: r.contentType, autonomyAnswer: r.autonomy.answer, checksJson: JSON.stringify(r.checks), actorOpenId: ctx.user.openId, createdAtMs: Date.now() }, ctx.accessToken); }
      }
      return { ...result, runId };
    }),
    history: columnistProcedure.input(z.object({ articleId: z.string().min(1) })).query(({ input, ctx }) => listEditorialAgentRuns(input.articleId, ctx.accessToken)),
    researchHistory: columnistProcedure.input(z.object({ articleId: z.string().min(1) })).query(({ input, ctx }) => listEditorialResearchContexts(input.articleId, ctx.accessToken)),
    findingDecisions: columnistProcedure.input(z.object({ articleId: z.string().min(1), agentRunId: z.string().optional() })).query(({ input, ctx }) => listEditorialFindingDecisions(input.articleId, input.agentRunId, ctx.accessToken)),
    decideFinding: columnistProcedure.input(z.object({ id: z.string().min(1), articleId: z.string().min(1), agentRunId: z.string().min(1), findingCode: z.string().min(1), decision: z.enum(["pending","accepted","rejected"]), note: z.string().max(1000).optional() })).mutation(async ({ input, ctx }) => {
      const now = Date.now();
      return recordEditorialFindingDecision({ ...input, note: input.note ?? null, actorOpenId: ctx.user.openId, createdAtMs: now, updatedAtMs: now }, ctx.accessToken);
    }),
  }),
  ads: router({
    active: publicProcedure.query(async ({ ctx }) => {
      const db = getSupabaseAdmin();
      const now = Date.now();
      const country = String(ctx.req.headers["x-pch-geo-country"] || ctx.req.headers["cf-ipcountry"] || "").trim().toUpperCase();
      const state = String(ctx.req.headers["x-pch-geo-state"] || "").trim();
      const city = String(ctx.req.headers["x-pch-geo-city"] || "").trim();
      const { data, error } = await db.from("adCampaigns")
        .select("id,name,adType,creativeUrl,destinationUrl,targetScope,placementId,country,region,state,city,priority,startsAtMs,endsAtMs,status,updatedAtMs")
        .in("status", ["approved","active"])
        .or(`startsAtMs.is.null,startsAtMs.lte.${now}`)
        .or(`endsAtMs.is.null,endsAtMs.gte.${now}`)
        .order("updatedAtMs", { ascending: false }).limit(100);
      if (error) throw error;
      const normalize = (value: any) => String(value || "").trim().toLowerCase();
      const matches = (item: any) => {
        const scope = normalize(item.targetScope || "national");
        if (scope === "national") return true;
        if (scope === "country") return !item.country || normalize(item.country) === normalize(country);
        if (scope === "state" || scope === "regional") return (!item.country || normalize(item.country) === normalize(country)) && (!item.state || normalize(item.state) === normalize(state));
        if (scope === "city") return (!item.country || normalize(item.country) === normalize(country)) && (!item.state || normalize(item.state) === normalize(state)) && (!item.city || normalize(item.city) === normalize(city));
        return true;
      };
      const specificity = (item: any) => {
        const scope = normalize(item.targetScope || "national");
        return scope === "city" ? 400 : scope === "state" || scope === "regional" ? 300 : scope === "country" ? 200 : 100;
      };
      const eligible = (data || []).filter(matches);
      const placements = new Map<string, any[]>();
      for (const item of eligible) {
        const placement = item.placementId || "home-main";
        const list = placements.get(placement) || [];
        list.push(item);
        placements.set(placement, list);
      }
      const selected: any[] = [];
      for (const [placement, list] of placements) {
        const maxSpecificity = Math.max(...list.map(specificity));
        selected.push(...list.filter(item => specificity(item) === maxSpecificity).sort((a,b) => Number(b.priority || 0) - Number(a.priority || 0) || Number(b.updatedAtMs || 0) - Number(a.updatedAtMs || 0)).slice(0, 6));
      }
      return selected.map((item: any) => ({
        id: item.id, placementId: item.placementId || "home-main", creativeUrl: item.creativeUrl || null,
        eyebrow: item.adType || "PUBLICIDADE", title: item.name,
        emphasis: item.creativeUrl ? "Confira a campanha." : "Sua marca em destaque.",
        text: item.creativeUrl ? "Conheça esta campanha no PCH News." : "Espaço comercial administrado pela redação.",
        cta: "CONHEÇA A CAMPANHA", href: item.destinationUrl || "/anuncie",
      }));
    }),
    list: adminProcedure.query(async () => {
      const db = getSupabaseAdmin();
      const { data, error } = await db.from("adCampaigns").select("*").order("updatedAtMs", { ascending: false });
      if (error) throw error;
      return data || [];
    }),
    create: adminProcedure.input(z.object({
      id: z.string().min(2).optional(), advertiserCompany: z.string().min(2), name: z.string().min(2), adType: z.string().min(2),
      creativeUrl: z.string().url().nullable().optional(), destinationUrl: z.string().url().nullable().optional(), targetScope: z.string().default("national"),
      placementId: z.string().default("home-main"), country: z.string().nullable().optional(), city: z.string().nullable().optional(), priority: z.number().int().min(0).max(100).default(0),
      region: z.string().nullable().optional(), state: z.string().nullable().optional(),
      startsAtMs: z.number().int().nullable().optional(), endsAtMs: z.number().int().nullable().optional(),
      status: z.enum(["draft","approved","active","paused","finished"]).default("draft"),
    })).mutation(async ({ input }) => {
      const db = getSupabaseAdmin();
      const now = Date.now();
      const advertiserId = `advertiser-${Date.now()}-${randomBytes(4).toString("hex")}`;
      const { error: advertiserError } = await db.from("advertisers").upsert({ id: advertiserId, company: input.advertiserCompany, status: "active", createdAtMs: now, updatedAtMs: now }, { onConflict: "id" });
      if (advertiserError) throw advertiserError;
      const { advertiserCompany: _advertiserCompany, ...campaignInput } = input;
      const row = { id: input.id || `campaign-${now}-${randomBytes(4).toString("hex")}`, ...campaignInput, advertiserId, creativeUrl: input.creativeUrl || null, destinationUrl: input.destinationUrl || null, placementId: input.placementId || "home-main", country: input.country || null, city: input.city || null, priority: input.priority ?? 0, region: input.region || null, state: input.state || null, startsAtMs: input.startsAtMs ?? null, endsAtMs: input.endsAtMs ?? null, createdAtMs: now, updatedAtMs: now };
      const { data, error } = await db.from("adCampaigns").insert(row).select("*").single();
      if (error) throw error;
      return data;
    }),
    update: adminProcedure.input(z.object({
      id: z.string().min(1), name: z.string().min(2), adType: z.string().min(2),
      creativeUrl: z.string().url().nullable().optional(), targetScope: z.string().default("national"),
      placementId: z.string().default("home-main"), country: z.string().nullable().optional(), city: z.string().nullable().optional(), priority: z.number().int().min(0).max(100).default(0),
      region: z.string().nullable().optional(), state: z.string().nullable().optional(),
      startsAtMs: z.number().int().nullable().optional(), endsAtMs: z.number().int().nullable().optional(),
      status: z.enum(["draft","approved","active","paused","finished"]),
      destinationUrl: z.string().url().nullable().optional(),
    })).mutation(async ({ input }) => {
      const db = getSupabaseAdmin();
      const { id, ...rest } = input;
      const { data, error } = await db.from("adCampaigns").update({ ...rest, creativeUrl: rest.creativeUrl || null, destinationUrl: rest.destinationUrl || null, placementId: rest.placementId || "home-main", country: rest.country || null, city: rest.city || null, priority: rest.priority ?? 0, region: rest.region || null, state: rest.state || null, startsAtMs: rest.startsAtMs ?? null, endsAtMs: rest.endsAtMs ?? null, updatedAtMs: Date.now() }).eq("id", id).select("*").single();
      if (error) throw error;
      return data;
    }),
  }),
  adAnalytics: router({
    createAccessLink: adminProcedure.input(z.object({ campaignId:z.string().min(1), expiresAtMs:z.number().int().nullable().optional() })).mutation(async ({ input }) => {
      const db=getSupabaseAdmin();
      const token=randomBytes(32).toString("hex");
      const id=`ad-access-${Date.now()}-${randomBytes(4).toString("hex")}`;
      const { error }=await db.from("adCampaignAccess").insert({ id, campaignId:input.campaignId, tokenHash:hashToken(token), expiresAtMs:input.expiresAtMs ?? null, createdAtMs:Date.now(), revokedAtMs:null });
      if(error) throw error;
      return { id, token, path:`/anuncie?token=${encodeURIComponent(token)}` };
    }),
    record: publicProcedure.input(z.object({ campaignId:z.string().min(1), eventType:z.enum(["impression","click"]) })).mutation(async ({ input, ctx }) => {
      const db = getSupabaseAdmin();
      const visitorSeed = String(ctx.req.headers["x-forwarded-for"] || ctx.req.headers["user-agent"] || "anonymous");
      const visitorHash = createHash("sha256").update(visitorSeed).digest("hex").slice(0,32);
      const deviceType = /mobile|android|iphone|ipad/i.test(String(ctx.req.headers["user-agent"] || "")) ? "mobile" : "desktop";
      const id = `ad-event-${Date.now()}-${randomBytes(5).toString("hex")}`;
      const { error } = await db.from("adCampaignEvents").insert({ id, campaignId:input.campaignId, eventType:input.eventType, occurredAtMs:Date.now(), visitorHash, deviceType, referrer:String(ctx.req.headers.referer || "") || null });
      if (error) throw error;
      return { success:true };
    }),
    report: publicProcedure.input(z.object({ token:z.string().min(20) })).query(async ({ input }) => {
      const db = getSupabaseAdmin();
      const tokenHash = hashToken(input.token);
      const { data: access, error: accessError } = await db.from("adCampaignAccess").select("campaignId,expiresAtMs,revokedAtMs").eq("tokenHash",tokenHash).maybeSingle();
      if (accessError) throw accessError;
      if (!access || access.revokedAtMs || (access.expiresAtMs && Number(access.expiresAtMs) < Date.now())) throw new Error("Link de acompanhamento inválido ou expirado.");
      const { data: campaign, error: campaignError } = await db.from("adCampaigns").select("id,name,adType,startsAtMs,endsAtMs,status").eq("id",access.campaignId).maybeSingle();
      if (campaignError) throw campaignError;
      const { data: events, error: eventsError } = await db.from("adCampaignEvents").select("eventType,occurredAtMs,deviceType,visitorHash").eq("campaignId",access.campaignId).order("occurredAtMs",{ascending:false}).limit(5000);
      if (eventsError) throw eventsError;
      const rows=events||[];
      const impressions=rows.filter((e:any)=>e.eventType==="impression").length;
      const clicks=rows.filter((e:any)=>e.eventType==="click").length;
      return { campaign, impressions, clicks, ctr: impressions ? Number(((clicks/impressions)*100).toFixed(2)) : 0, events: rows.map((e:any)=>({ eventType:e.eventType, occurredAtMs:e.occurredAtMs, deviceType:e.deviceType })) };
    }),
  }),
  adRequests: router({
    uploadAsset: publicProcedure.input(z.object({
      fileName: z.string().regex(/\.(png|jpe?g|webp|gif)$/i),
      contentType: z.enum(["image/png", "image/jpeg", "image/webp", "image/gif"]),
      base64: z.string().min(20).max(8_000_000),
    })).mutation(async ({ input }) => {
      const bytes = Buffer.from(input.base64.replace(/^data:[^;]+;base64,/, ""), "base64");
      if (bytes.length > 5 * 1024 * 1024) throw new Error("A arte deve ter no máximo 5 MB.");
      const safeName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, "-");
      return storagePut(`commercial-requests/${Date.now()}-${randomBytes(4).toString("hex")}/${safeName}`, bytes, input.contentType);
    }),
    create: publicProcedure.input(z.object({
      business: z.string().trim().min(2).max(180), contactName: z.string().trim().min(2).max(120),
      email: z.string().trim().email().max(180), phone: z.string().trim().min(8).max(40),
      city: z.string().trim().max(120).optional().default(""), website: z.string().trim().max(300).optional().default(""),
      socials: z.string().trim().max(500).optional().default(""), adType: z.string().trim().min(2).max(120),
      budget: z.string().trim().max(120).optional().default(""), period: z.string().trim().max(120).optional().default(""),
      message: z.string().trim().min(10).max(5000), destinationUrl: z.string().url().nullable().optional(), consent: z.literal(true),
      creativeUrl: z.string().url().nullable().optional(), creativeNeed: z.enum(["client_artwork", "pch_creation", "no_artwork_yet"]).default("no_artwork_yet"),
    })).mutation(async ({ input }) => createAdRequest({
      id:`ad-${Date.now()}-${randomBytes(6).toString("hex")}`, business:input.business, contactName:input.contactName,
      email:input.email.toLowerCase(), phone:input.phone, city:input.city||null, website:input.website||null, socials:input.socials||null,
      adType:input.adType, budget:input.budget||null, period:input.period||null, message:input.message,
      creativeUrl: input.creativeUrl || null, creativeNeed: input.creativeNeed,
      consentAtMs:Date.now(), status:"received", createdAtMs:Date.now(),
    })),
    list: adminProcedure.query(async ({ ctx }) => { const db=await getDb(ctx.accessToken); if(!db) throw new Error("Database unavailable"); const {data,error}=await db.from("adRequests").select("*").order("createdAtMs",{ascending:false}); if(error) throw error; return data||[]; }),
    update: adminProcedure.input(z.object({id:z.string(),status:z.enum(["received","reviewing","approved"])})).mutation(async ({input,ctx}) => { const db=await getDb(ctx.accessToken); if(!db) throw new Error("Database unavailable"); const {data,error}=await db.from("adRequests").update({status:input.status}).eq("id",input.id).select("*").single(); if(error) throw error; return data; }),
  }),
  editorial: router({
    bootstrap: publicProcedure.query(({ ctx }) => getEditorialSnapshot(Boolean(ctx.user && ["admin","editor","journalist","columnist","reviewer"].includes(ctx.user.role)), ctx.accessToken)),
    sync: adminProcedure.input(z.object({ articles: z.array(articleSchema), comments: z.array(commentSchema), profiles: z.array(profileSchema), adRequests: z.array(adSchema) })).mutation(async ({ input, ctx }) => { const db = await getDb(ctx.accessToken); if (!db) throw new Error("Database unavailable"); if (ctx.user.role !== "admin") { const snapshot = await getEditorialSnapshot(true, ctx.accessToken); const byId = new Map(snapshot.articles.map((row:any) => [row.id, row.authorOpenId])); for (const item of input.articles) { const owner = byId.get(item.id); const claimed = item.authorOpenId ?? (item.author === ctx.user.name ? ctx.user.openId : null); if (claimed !== ctx.user.openId || (owner !== undefined && owner !== ctx.user.openId)) throw new Error("Sincronização recusada: a publicação não pertence ao seu openId."); } } return syncEditorial({ ...input, articles: input.articles.map((item) => ({ ...item, authorOpenId: item.authorOpenId ?? (item.author === ctx.user.name ? ctx.user.openId : null), youtubeUrl: item.youtubeUrl ?? null, socialLinks: item.socialLinks ?? null, createdAt: item.createdAt ?? new Date(), updatedAt: item.updatedAt ?? new Date() })), profiles: input.profiles.map((item) => ({ ...item, updatedAt: item.updatedAt ?? new Date() })) }, ctx.accessToken); }),
    saveArticle: columnistProcedure.input(articleInput).mutation(async ({ input, ctx }) => {
      const existing = await getArticle(input.id, ctx.accessToken);
      const isPrivilegedEditor = ctx.user.role === "admin" || ctx.user.role === "editor";
      const isAuthorRole = ctx.user.role === "journalist" || ctx.user.role === "columnist";
      const owner = existing?.authorOpenId ?? null;

      // Creation: journalists/columnists always become the owner of the new publication.
      // Update: journalists/columnists must already be the recorded owner. Legacy rows
      // without authorOpenId are intentionally read-only so ownership cannot be guessed
      // from a display name shared by multiple people.
      if (!isPrivilegedEditor && !isAuthorRole) {
        throw new Error("Seu perfil não possui permissão para editar publicações.");
      }
      if (existing && !isPrivilegedEditor && owner !== ctx.user.openId) {
        throw new Error("Você só pode editar publicações vinculadas ao seu próprio acesso.");
      }
      const nextOwner = isPrivilegedEditor
        ? (input.authorOpenId ?? owner ?? null)
        : (existing ? owner : ctx.user.openId);

      const effectiveScheduledAt = input.scheduledAt ?? existing?.scheduledAt ?? null;
      if (input.status === "scheduled" && !effectiveScheduledAt) throw new Error("Agendamento exige data e hora de publicação.");
      const effectiveChecklist = input.editorialChecklist ?? existing?.editorialChecklist ?? null;
      const alreadyLive = existing?.status === "published" || existing?.status === "scheduled";
      if (!alreadyLive && (input.status === "published" || input.status === "scheduled") && (!effectiveChecklist || !Object.values(effectiveChecklist).every(Boolean))) throw new Error("Publicação bloqueada: complete o checklist editorial do Manual PCH News antes de publicar ou agendar.");

      const before = existing ? { ...existing } : null;
      const nowMs = Date.now();
      await saveArticle({ ...input, authorOpenId: nextOwner, scheduledAt: effectiveScheduledAt, editorialChecklist: effectiveChecklist ?? undefined, createdAt: existing?.createdAt ?? new Date() }, ctx.accessToken);
      await recordArticleAudit({ id: `audit-${nowMs}-${randomBytes(4).toString("hex")}`, articleId: input.id, actorOpenId: ctx.user.openId, actorName: ctx.user.name || ctx.user.email || "Usuário", action: before ? "updated" : "created", beforeJson: before ? JSON.stringify(before) : null, afterJson: JSON.stringify(input) }, ctx.accessToken);
      const workflowDb = await getDb(ctx.accessToken);
      if (workflowDb) {
        await workflowDb.from("editorialWorkflowEvents").insert({
          id: `workflow-${nowMs}-${randomBytes(4).toString("hex")}`,
          articleId: input.id,
          pautaId: null,
          actorOpenId: ctx.user.openId,
          actorName: ctx.user.name || ctx.user.email || "Usuário",
          fromStatus: before?.status ?? null,
          toStatus: input.status,
          action: before ? "status_changed" : "created",
          note: input.editorialNotes ?? null,
          createdAtMs: nowMs
        });
        const { data: queued } = await workflowDb.from("editorialPublicationQueue").select("id").eq("articleId", input.id).in("status", ["pending","approved","scheduled"]).maybeSingle();
        if (input.status === "scheduled" || input.status === "approved") {
          const queueRow = {
            id: queued?.id ?? `publication-${nowMs}-${randomBytes(4).toString("hex")}`,
            articleId: input.id,
            status: input.status === "approved" ? "approved" : "scheduled",
            requestedByOpenId: ctx.user.openId,
            approvedByOpenId: input.status === "approved" ? ctx.user.openId : null,
            scheduledAtMs: input.status === "scheduled" ? input.scheduledAt : null,
            publishedAtMs: null,
            note: input.editorialNotes ?? null,
            createdAtMs: nowMs,
            updatedAtMs: nowMs
          };
          await workflowDb.from("editorialPublicationQueue").upsert(queueRow, { onConflict: "id" });
        } else if (input.status === "published" || input.status === "updated") {
          if (queued?.id) {
            await workflowDb.from("editorialPublicationQueue").update({ status: "published", publishedAtMs: nowMs, updatedAtMs: nowMs }).eq("id", queued.id);
          } else {
            await workflowDb.from("editorialPublicationQueue").insert({
              id: `publication-${nowMs}-${randomBytes(4).toString("hex")}`,
              articleId: input.id,
              status: "published",
              requestedByOpenId: ctx.user.openId,
              approvedByOpenId: ctx.user.openId,
              scheduledAtMs: null,
              publishedAtMs: nowMs,
              note: input.editorialNotes ?? null,
              createdAtMs: nowMs,
              updatedAtMs: nowMs
            });
          }
        }
      }
      return { success: true }; }),
    recordView: publicProcedure.input(z.object({ articleId: z.string().min(1), visitorId: z.string().min(8).max(128) })).mutation(({ input }) => recordArticleView(input.articleId, input.visitorId)),
    analytics: protectedProcedure.input(z.object({ author: z.string().optional(), authorOpenId: z.string().optional(), fromMs: z.number().optional(), toMs: z.number().optional() })).query(({ input, ctx }) => getViewAnalytics(ctx.user.role === "admin" ? input.author : ctx.user.name ?? undefined, ctx.user.role === "admin" ? input.authorOpenId : ctx.user.openId, input.fromMs, input.toMs, ctx.accessToken)),
    audit: adminProcedure.input(z.object({ articleId: z.string().optional() })).query(({ input, ctx }) => listArticleAudit(input.articleId, ctx.accessToken)),
    history: columnistProcedure.input(z.object({ articleId: z.string().min(1) })).query(async ({ input, ctx }) => { const article = await getArticle(input.articleId, ctx.accessToken); if (!article) return []; if (ctx.user.role !== "admin" && article.authorOpenId !== ctx.user.openId) throw new Error("Você não tem acesso ao histórico desta publicação."); return listArticleAudit(input.articleId, ctx.accessToken); }),
  }),
  media: router({
    list: columnistProcedure.query(async ({ ctx }) => { const stored = await storageList(`editorial/${ctx.user.openId}`); const snapshot = await getEditorialSnapshot(true, ctx.accessToken); const allowedArticles = ctx.user.role === "admin" ? snapshot.articles : snapshot.articles.filter((article: any) => article.authorOpenId === ctx.user.openId); const virtual = allowedArticles.filter((article: any) => typeof article.image === "string" && article.image.trim()).map((article: any) => ({ id: `article-image-${article.id}`, name: article.title || article.id, key: `article:${article.id}`, url: article.image, size: "", createdAt: article.updatedAt || article.createdAt || null })); const seen = new Set<string>(); return [...stored, ...virtual].filter((item: any) => { const key = item.url || item.key || item.id; if (seen.has(key)) return false; seen.add(key); return true; }); }),
    delete: columnistProcedure.input(z.object({ key: z.string().min(1) })).mutation(async ({ input, ctx }) => {
      if (!input.key.startsWith(`editorial/${ctx.user.openId}/`) && ctx.user.role !== "admin") throw new Error("Você só pode remover sua própria mídia.");
      return storageDelete(input.key);
    }),
    upload: columnistProcedure.input(uploadSchema).mutation(async ({ input, ctx }) => {
      const safeName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, "-");
      const bytes = Buffer.from(input.base64.replace(/^data:[^;]+;base64,/, ""), "base64");
      if (bytes.length > 5 * 1024 * 1024) throw new Error("A imagem deve ter no máximo 5 MB.");
      return storagePut(`editorial/${ctx.user.openId}/${safeName}`, bytes, input.contentType, ctx.accessToken);
    }),
  }),
  profiles: router({ save: columnistProcedure.input(profileUpdateSchema).mutation(({ input, ctx }) => { if (ctx.user.role !== "admin" && slugify(ctx.user.name || "") !== input.slug) throw new Error("Você só pode editar o próprio perfil."); return updateColumnistProfile(input.slug, input, ctx.accessToken); }), uploadPhoto: columnistProcedure.input(uploadSchema).mutation(async ({ input, ctx }) => { if (ctx.user.role !== "admin" && slugify(ctx.user.name || "") !== input.slug) throw new Error("Você só pode editar o próprio perfil."); const safeName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, "-"); const bytes = Buffer.from(input.base64.replace(/^data:[^;]+;base64,/, ""), "base64"); if (bytes.length > 5 * 1024 * 1024) throw new Error("A imagem deve ter no máximo 5 MB."); return storagePut(`columnists/${input.slug}/${safeName}`, bytes, input.contentType, ctx.accessToken); }) }),
  comments: router({
    create: publicProcedure.input(z.object({ articleId: z.string().min(1), name: z.string().min(2).max(120), text: z.string().min(2).max(4000) })).mutation(async ({ input, ctx }) => {
      const row = { id: `comment-${Date.now()}-${randomBytes(4).toString("hex")}`, articleId: input.articleId, name: input.name.trim(), text: input.text.trim(), createdAtMs: Date.now(), status: "pending" as const, reply: null, repliedBy: null, repliedAtMs: null };
      await createComment(row, ctx.accessToken);
      return row;
    }),
    moderate: columnistProcedure.input(z.object({
      id: z.string().min(1),
      action: z.enum(["approve", "reject", "remove", "reply"]),
      reply: z.string().max(4000).optional(),
    })).mutation(async ({ input, ctx }) => {
      const db = await getDb(ctx.accessToken);
      if (!db) throw new Error("Database unavailable");
      const { data: comment, error: commentError } = await db.from("comments").select("*").eq("id", input.id).maybeSingle();
      if (commentError) throw commentError;
      if (!comment) throw new Error("Comentário não encontrado.");
      const article = await getArticle(String(comment.articleId), ctx.accessToken);
      if (!article) throw new Error("Matéria do comentário não encontrada.");
      const articleOwner = article.authorOpenId ?? (article.author === ctx.user.name ? ctx.user.openId : null);
      if (ctx.user.role !== "admin" && articleOwner !== ctx.user.openId) {
        throw new Error("Você não tem permissão para moderar este comentário.");
      }
      if (input.action === "reply") {
        const reply = input.reply?.trim();
        if (!reply) throw new Error("A resposta não pode ficar vazia.");
        const { data, error } = await db.from("comments").update({
          reply,
          repliedBy: ctx.user.name || ctx.user.email || "PCH News",
          repliedAtMs: Date.now(),
        }).eq("id", input.id).select("*").single();
        if (error) throw error;
        return data;
      }
      const nextStatus = input.action === "approve" ? "approved" : "rejected";
      const { data, error } = await db.from("comments").update({ status: nextStatus }).eq("id", input.id).select("*").single();
      if (error) throw error;
      return data;
    }),
  }),
  access: router({ list: adminProcedure.query(async ({ ctx }) => { return listUsers(ctx.accessToken); }), setRole: adminProcedure.input(z.object({ openId: z.string(), role: z.enum(["user", "admin", "editor", "journalist", "columnist", "reviewer"]) })).mutation(async ({ input, ctx }) => { return setUserRole(input.openId,input.role,ctx.accessToken); }) }),
  pilulas: router({ sync: adminProcedure.mutation(({ ctx }) => syncHostingPressPilulas(ctx.accessToken)) }),
  invites: router({
    list: adminProcedure.query(({ ctx }) => listInvites(ctx.accessToken)),
    revoke: adminProcedure.input(z.object({ id: z.string() })).mutation(({ input, ctx }) => revokeInvite(input.id, ctx.accessToken)),
    delete: adminProcedure.input(z.object({ id: z.string() })).mutation(({ input, ctx }) => deleteInvite(input.id, ctx.accessToken)),
    resend: adminProcedure.input(z.object({ id: z.string(), email: z.string().email().optional(), name: z.string().min(2).optional(), role: z.enum(INVITE_ROLES).optional() })).mutation(async ({ input, ctx }) => { const current = (await listInvites(ctx.accessToken)).find((item:any) => item.id === input.id); if (!current) throw new Error("Convite não encontrado."); if (current.acceptedAtMs) throw new Error("Esse convite já foi aceito."); const token = randomBytes(16).toString("hex"); const expiresAtMs = Date.now() + 7 * 24 * 60 * 60 * 1000; const nextEmail = input.email?.trim().toLowerCase() || current.email; const nextName = input.name?.trim() || current.name; const nextRole = input.role || roleFromInviteId(current.id); let invite:any; if (!current.revokedAtMs && current.expiresAtMs >= Date.now() && !input.email && !input.name && !input.role) { invite = await renewInvite(input.id, hashToken(token), expiresAtMs, ctx.accessToken); } else { if (!current.revokedAtMs) await revokeInvite(input.id, ctx.accessToken); invite = await createReplacementInvite(input.id, { email: nextEmail, name: nextName, role: nextRole }, hashToken(token), expiresAtMs, ctx.accessToken); } if (!invite) throw new Error("Não foi possível renovar o convite."); const origin = ENV.publicAppUrl || `${ctx.req.protocol}://${ctx.req.get("host")}`; const inviteUrl = `${origin}/convite/${token}`; let emailSent = false; try { emailSent = (await sendInviteEmail(invite.email, invite.name, inviteUrl)).sent; } catch (error) { console.error("[SMTP] Invite resend failed:", error); } return { inviteUrl: `/convite/${token}`, absoluteInviteUrl: inviteUrl, emailSent, smtpConfigured: smtpConfigured(), expiresAtMs: invite.expiresAtMs, email: invite.email, name: invite.name, role: nextRole }; }),
    create: adminProcedure.input(z.object({ email: z.string().email(), name: z.string().min(2), role: z.enum(INVITE_ROLES).default("columnist") })).mutation(async ({ input, ctx }) => { const token = randomBytes(16).toString("hex"); const invite = { id: `invite-${input.role}-${Date.now()}-${randomBytes(4).toString("hex")}`, email: input.email.toLowerCase(), name: input.name.trim(), tokenHash: hashToken(token), expiresAtMs: Date.now() + 7 * 24 * 60 * 60 * 1000, createdAtMs: Date.now(), acceptedAtMs: null, revokedAtMs: null }; await createInvite(invite, ctx.accessToken); const origin = ENV.publicAppUrl || `${ctx.req.protocol}://${ctx.req.get("host")}`; const inviteUrl = `${origin}/convite/${token}`; let emailSent = false; try { emailSent = (await sendInviteEmail(invite.email, invite.name, inviteUrl)).sent; } catch (error) { console.error("[SMTP] Invite delivery failed:", error); } return { ...invite, role: input.role, token, inviteUrl: `/convite/${token}`, absoluteInviteUrl: inviteUrl, emailSent, smtpConfigured: smtpConfigured() }; }),
    preview: publicProcedure.input(z.object({ token: z.string().min(20) })).query(async ({ input }) => { const invite = await findInvite(hashToken(input.token)); if (!invite || invite.expiresAtMs < Date.now() || invite.revokedAtMs) return { valid: false }; return { valid: true, email: invite.email, name: invite.name, role: roleFromInviteId(invite.id), expiresAtMs: invite.expiresAtMs }; }),
    accept: protectedProcedure.input(z.object({ token: z.string().min(20), responsibilityAccepted: z.literal(true), responsibilityVersion: z.string().min(1).max(40), partnershipAccepted: z.literal(true), partnershipVersion: z.string().min(1).max(40), confidentialityAccepted: z.literal(true), confidentialityVersion: z.string().min(1).max(40), termsId: z.string().min(1).max(100) })).mutation(async ({ input, ctx }) => {
      // The invitee is not an admin yet: RLS blocks every step with the user's
      // own JWT. The token is a high-entropy secret validated here, so the
      // server performs the privileged steps with the service-role client.
      const invite = await findInvite(hashToken(input.token));
      if (!invite || invite.expiresAtMs < Date.now()) throw new Error("Convite inválido, expirado ou já utilizado.");
      if ((ctx.user.email || "").toLowerCase() !== invite.email.toLowerCase()) throw new Error("Entre com o mesmo e-mail que recebeu o convite.");
      const role = roleFromInviteId(invite.id);
      const admin = getSupabaseAdmin();
      const now = Date.now();
      const nextRole = ctx.user.role === "admin" ? "admin" : role;
      const { error: userError } = await admin.from("users").update({ role: nextRole, name: ctx.user.name || invite.name }).eq("openId", ctx.user.openId);
      if (userError) throw userError;
      const forwardedFor = (ctx.req as any)?.headers?.["x-forwarded-for"] || (ctx.req as any)?.headers?.["cf-connecting-ip"] || null;
      const userAgent = typeof (ctx.req as any)?.get === "function" ? (ctx.req as any).get("user-agent") : ((ctx.req as any)?.headers?.["user-agent"] || null);
      const { error: inviteError } = await admin.from("columnistInvites").update({
        acceptedAtMs: now,
        responsibilityAcceptedAtMs: now,
        responsibilityVersion: input.responsibilityVersion,
        partnershipAcceptedAtMs: now,
        partnershipVersion: input.partnershipVersion,
        confidentialityAcceptedAtMs: now,
        confidentialityVersion: input.confidentialityVersion,
        termsAcceptedIp: typeof forwardedFor === "string" ? forwardedFor.split(",")[0].trim() : null,
        termsAcceptedUserAgent: userAgent,
        termsAcceptedTermsId: input.termsId
      }).eq("id", invite.id);
      if (inviteError) throw inviteError;
      return { success: true, role: nextRole, responsibilityAcceptedAtMs: now, responsibilityVersion: input.responsibilityVersion, partnershipAcceptedAtMs: now, partnershipVersion: input.partnershipVersion, confidentialityAcceptedAtMs: now, confidentialityVersion: input.confidentialityVersion, termsId: input.termsId };
    }),
  }),
  editorialRequests: router({ create: publicProcedure.input(z.object({articleId:z.string().max(180).optional(),requestType:z.enum(["correction","right_of_reply","removal","context"]),name:z.string().min(2).max(160),email:z.string().email().max(240),phone:z.string().max(60).optional(),organization:z.string().max(180).optional(),reason:z.string().min(10).max(6000),requestedChange:z.string().min(10).max(6000),evidence:z.string().max(12000).optional()})).mutation(async({input,ctx})=>{const db=getSupabaseAdmin();const now=Date.now();const row={id:`req-${now}-${randomBytes(4).toString("hex")}`,articleId:input.articleId||null,requestType:input.requestType,name:input.name.trim(),email:input.email.trim().toLowerCase(),phone:input.phone?.trim()||null,organization:input.organization?.trim()||null,reason:input.reason.trim(),requestedChange:input.requestedChange.trim(),evidence:input.evidence?.trim()||null,status:"pending",createdAtMs:now,updatedAtMs:now};const {error}=await db.from("editorialRequests").insert(row);if(error)throw error;return row;}), list:adminProcedure.query(async()=>{const db=getSupabaseAdmin();const {data,error}=await db.from("editorialRequests").select("*").order("createdAtMs",{ascending:false});if(error)throw error;return data||[];}), update:adminProcedure.input(z.object({id:z.string(),status:z.enum(["pending","in_review","accepted","rejected","published"]),responseText:z.string().max(6000).optional()})).mutation(async({input,ctx})=>{const db=getSupabaseAdmin();const now=Date.now();const {data,error}=await db.from("editorialRequests").update({status:input.status,responseText:input.responseText||null,respondedByOpenId:ctx.user.openId,respondedAtMs:now,updatedAtMs:now}).eq("id",input.id).select("*").single();if(error)throw error;return data;}) }),
  events: router({
    monetization: publicProcedure.query(() => getAgendaMonetizationSettings()),
    carousel: publicProcedure.input(z.object({ state: z.string().optional(), city: z.string().optional(), region: z.string().optional(), limit: z.number().min(1).max(20).optional() }).optional()).query(({ input }) => listEventCarousel(input)),

    list: publicProcedure.input(z.object({ state: z.string().optional(), city: z.string().optional(), eventType: z.string().optional(), fromMs: z.number().optional(), nearLat: z.number().optional(), nearLng: z.number().optional(), radiusKm: z.number().min(1).max(200).optional() }).optional()).query(({ input }) => listPublicEvents(input)),
    get: publicProcedure.input(z.object({ id: z.string() })).query(({ input }) => getPublicEvent(input.id)),
    submit: publicProcedure.input(z.object({ id: z.string().min(8), title: z.string().min(3), description: z.string().min(10), eventType: z.string().min(1), organizer: z.string().min(2), contact: z.string().min(3), startAtMs: z.number().int(), endAtMs: z.number().int().nullable(), venue: z.string().min(2), address: z.string().min(3), city: z.string().min(2), state: z.string().min(2), country: z.string().default("Brasil"), latitude: z.string().nullable(), longitude: z.string().nullable(), image: z.string().nullable(), website: z.string().nullable(), price: z.string().nullable(), sourceType: z.enum(["public_submission","partner","external"]).optional(), sourceName: z.string().max(180).nullable().optional(), sourceUrl: z.string().url().nullable().optional(), visibilityScope: z.enum(["national","regional","state","subregional","city"]).optional(), visibilityRegion: z.string().max(120).nullable().optional(), visibilityState: z.string().max(80).nullable().optional(), visibilitySubregion: z.string().max(120).nullable().optional(), visibilityCity: z.string().max(120).nullable().optional() })).mutation(({ input }) => createEvent(input)),
    adminList: protectedProcedure.query(({ ctx }) => { if (!["admin","editor"].includes(ctx.user.role)) throw new Error("FORBIDDEN"); return listEventsAdmin(ctx.accessToken); }),
    adminPromotions: protectedProcedure.query(({ ctx }) => { if (!["admin","editor"].includes(ctx.user.role)) throw new Error("FORBIDDEN"); return listEventPromotions(ctx.accessToken); }),
    setStatus: protectedProcedure.input(z.object({ id: z.string(), status: z.enum(["pending", "approved", "rejected", "cancelled"]) })).mutation(({ input, ctx }) => { if (!["admin","editor"].includes(ctx.user.role)) throw new Error("FORBIDDEN"); return updateEventStatus(input.id, input.status, ctx.accessToken); }),
    update: protectedProcedure.input(z.object({ id: z.string(), title: z.string().min(3), description: z.string().min(10), eventType: z.string().min(1), organizer: z.string().min(2), contact: z.string().min(3), startAtMs: z.number().int(), endAtMs: z.number().int().nullable(), venue: z.string().min(2), address: z.string().min(3), city: z.string().min(2), state: z.string().min(2), country: z.string().default("Brasil"), latitude: z.string().nullable(), longitude: z.string().nullable(), image: z.string().nullable(), website: z.string().nullable(), price: z.string().nullable(), visibilityScope: z.enum(["national","regional","state","subregional","city"]).optional(), visibilityRegion: z.string().max(120).nullable().optional(), visibilityState: z.string().max(80).nullable().optional(), visibilitySubregion: z.string().max(120).nullable().optional(), visibilityCity: z.string().max(120).nullable().optional() })).mutation(({ input, ctx }) => { if (!["admin","editor"].includes(ctx.user.role)) throw new Error("FORBIDDEN"); return updateEvent(input.id, input, ctx.accessToken); }),
  }),
});
export type AppRouter = typeof appRouter;
