import { createHash, randomBytes } from "node:crypto";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, columnistProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { acceptInvite, createComment, createInvite, findInvite, getArticle, getDb, getEditorialSnapshot, getViewAnalytics, listArticleAudit, listInvites, listUsers, recordArticleAudit, recordArticleView, renewInvite, revokeInvite, saveArticle, setUserRole, syncEditorial, updateColumnistProfile, recordEditorialAgentRun, listEditorialAgentRuns, listPautas, getPauta, savePauta, recordEditorialResearchContext, listEditorialResearchContexts } from "./db";
import { storagePut } from "./storage";
import { sendInviteEmail, smtpConfigured } from "./email";
import { ENV } from "./_core/env";
import { recordFreedomReview } from "./db";
import { runEditorialAgent, type EditorialAgentId } from "./editorialAgents";
import { getApiHealth, getBcbSeries, getNewsRadar, getWeather, geocodeBrazil, getIbgeMunicipalities } from "./apiHub";
import { collectEditorialResearchContext } from "./apiHub/editorialContext";
const articleSchema = z.object({ id: z.string(), title: z.string(), category: z.string(), author: z.string(), authorOpenId: z.string().nullable().optional(), summary: z.string(), date: z.string(), updated: z.string(), status: z.enum(["published", "draft", "scheduled", "archived"]), views: z.number().int(), image: z.string(), bodyHtml: z.string(), scheduledAt: z.number().nullable(), tags: z.string(), youtubeUrl: z.string().nullable().optional(), socialLinks: z.string().nullable().optional(), createdAt: z.coerce.date().optional(), updatedAt: z.coerce.date().optional() });
const commentSchema = z.object({ id: z.string(), articleId: z.string(), name: z.string(), text: z.string(), createdAtMs: z.number().int(), status: z.enum(["pending", "approved", "rejected"]), reply: z.string().nullable().default(null), repliedBy: z.string().nullable().default(null), repliedAtMs: z.number().int().nullable().default(null) });
const profileSchema = z.object({ slug: z.string(), name: z.string(), beat: z.string(), bio: z.string(), photo: z.string(), instagram: z.string(), facebook: z.string(), x: z.string(), linkedin: z.string(), updatedAt: z.coerce.date().optional() });
const adSchema = z.object({ id: z.string(), business: z.string(), contact: z.string(), packageName: z.string(), message: z.string(), status: z.enum(["received", "reviewing", "approved"]), createdAtMs: z.number().int() });
const profileUpdateSchema = z.object({ slug: z.string(), name: z.string().min(1), beat: z.string(), bio: z.string(), photo: z.string(), instagram: z.string(), facebook: z.string(), x: z.string(), linkedin: z.string() });
const uploadSchema = z.object({ slug: z.string(), fileName: z.string().regex(/\.(png|jpe?g|webp|gif)$/i), contentType: z.enum(["image/png", "image/jpeg", "image/webp", "image/gif"]), base64: z.string().min(20).max(8_000_000) });
const slugify = (value: string) => value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");
const articleInput = z.object({ id: z.string(), title: z.string(), category: z.string(), author: z.string(), authorOpenId: z.string().nullable().optional(), summary: z.string(), date: z.string(), updated: z.string(), status: z.enum(["published", "draft", "scheduled", "archived"]), views: z.number().int(), image: z.string(), bodyHtml: z.string(), scheduledAt: z.number().nullable(), tags: z.string(), youtubeUrl: z.string().nullable().optional(), socialLinks: z.string().nullable().optional(), scope: z.string().optional(), region: z.string().nullable().optional(), state: z.string().nullable().optional(), country: z.string().nullable().optional(), language: z.string().optional(), featured: z.boolean().optional(), sourceUrl: z.string().nullable().optional(), sourceName: z.string().nullable().optional(), slug: z.string().nullable().optional(), seoTitle: z.string().nullable().optional(), metaDescription: z.string().nullable().optional(), canonicalUrl: z.string().nullable().optional(), focusKeyword: z.string().nullable().optional(), ogTitle: z.string().nullable().optional(), ogDescription: z.string().nullable().optional(), imageAlt: z.string().nullable().optional(), noindex: z.boolean().optional() });
export const appRouter = router({
  system: systemRouter,
  apiHub: router({
    health: adminProcedure.query(() => ({ providers: getApiHealth() })),
    weather: columnistProcedure.input(z.object({ latitude: z.number().min(-90).max(90), longitude: z.number().min(-180).max(180) })).query(({ input }) => getWeather(input.latitude, input.longitude)),
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
      agentId: z.enum(["story-editor","fact-checker","seo-optimization-specialist","publication-readiness","ethics-advisor","multi-platform-distributor","liberdade-editorial","journalism-master-orchestrator"]),
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
      const db = await getDb(ctx.accessToken);
      if (db) {
        await recordEditorialAgentRun({
          id: `agent-${Date.now()}-${randomBytes(4).toString("hex")}`,
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
      return result;
    }),
    history: columnistProcedure.input(z.object({ articleId: z.string().min(1) })).query(({ input, ctx }) => listEditorialAgentRuns(input.articleId, ctx.accessToken)),
    researchHistory: columnistProcedure.input(z.object({ articleId: z.string().min(1) })).query(({ input, ctx }) => listEditorialResearchContexts(input.articleId, ctx.accessToken)),
  }),
  editorial: router({
    bootstrap: publicProcedure.query(({ ctx }) => getEditorialSnapshot(Boolean(ctx.user && ["admin","columnist"].includes(ctx.user.role)), ctx.accessToken)),
    sync: protectedProcedure.input(z.object({ articles: z.array(articleSchema), comments: z.array(commentSchema), profiles: z.array(profileSchema), adRequests: z.array(adSchema) })).mutation(async ({ input, ctx }) => { const db = await getDb(ctx.accessToken); if (!db) throw new Error("Database unavailable"); if (ctx.user.role !== "admin") { const snapshot = await getEditorialSnapshot(true, ctx.accessToken); const byId = new Map(snapshot.articles.map((row:any) => [row.id, row.authorOpenId])); for (const item of input.articles) { const owner = byId.get(item.id); const claimed = item.authorOpenId ?? (item.author === ctx.user.name ? ctx.user.openId : null); if (claimed !== ctx.user.openId || (owner !== undefined && owner !== ctx.user.openId)) throw new Error("Sincronização recusada: a publicação não pertence ao seu openId."); } } return syncEditorial({ ...input, articles: input.articles.map((item) => ({ ...item, authorOpenId: item.authorOpenId ?? (item.author === ctx.user.name ? ctx.user.openId : null), youtubeUrl: item.youtubeUrl ?? null, socialLinks: item.socialLinks ?? null, createdAt: item.createdAt ?? new Date(), updatedAt: item.updatedAt ?? new Date() })), profiles: input.profiles.map((item) => ({ ...item, updatedAt: item.updatedAt ?? new Date() })) }, ctx.accessToken); }),
    saveArticle: columnistProcedure.input(articleInput).mutation(async ({ input, ctx }) => { const existing = await getArticle(input.id, ctx.accessToken); const owner = existing?.authorOpenId ?? (existing?.author === ctx.user.name ? ctx.user.openId : null); const nextOwner = input.authorOpenId ?? owner ?? (ctx.user.role === "columnist" ? ctx.user.openId : null); if (ctx.user.role !== "admin" && owner !== ctx.user.openId && !(owner === null && !existing)) throw new Error("Você só pode editar publicações vinculadas ao seu openId."); const before = existing ? { ...existing } : null; await saveArticle({ ...input, authorOpenId: nextOwner, createdAt: existing?.createdAt ?? new Date() }, ctx.accessToken); await recordArticleAudit({ id: `audit-${Date.now()}-${randomBytes(4).toString("hex")}`, articleId: input.id, actorOpenId: ctx.user.openId, actorName: ctx.user.name || ctx.user.email || "Usuário", action: before ? "updated" : "created", beforeJson: before ? JSON.stringify(before) : null, afterJson: JSON.stringify(input) }, ctx.accessToken); return { success: true }; }),
    recordView: publicProcedure.input(z.object({ articleId: z.string().min(1), visitorId: z.string().min(8).max(128) })).mutation(({ input }) => recordArticleView(input.articleId, input.visitorId)),
    analytics: protectedProcedure.input(z.object({ author: z.string().optional(), authorOpenId: z.string().optional(), fromMs: z.number().optional(), toMs: z.number().optional() })).query(({ input, ctx }) => getViewAnalytics(ctx.user.role === "admin" ? input.author : ctx.user.name ?? undefined, ctx.user.role === "admin" ? input.authorOpenId : ctx.user.openId, input.fromMs, input.toMs, ctx.accessToken)),
    audit: adminProcedure.input(z.object({ articleId: z.string().optional() })).query(({ input, ctx }) => listArticleAudit(input.articleId, ctx.accessToken)),
  }),
  profiles: router({ save: columnistProcedure.input(profileUpdateSchema).mutation(({ input, ctx }) => { if (ctx.user.role !== "admin" && slugify(ctx.user.name || "") !== input.slug) throw new Error("Você só pode editar o próprio perfil."); return updateColumnistProfile(input.slug, input, ctx.accessToken); }), uploadPhoto: columnistProcedure.input(uploadSchema).mutation(async ({ input, ctx }) => { if (ctx.user.role !== "admin" && slugify(ctx.user.name || "") !== input.slug) throw new Error("Você só pode editar o próprio perfil."); const safeName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, "-"); const bytes = Buffer.from(input.base64.replace(/^data:[^;]+;base64,/, ""), "base64"); if (bytes.length > 5 * 1024 * 1024) throw new Error("A imagem deve ter no máximo 5 MB."); return storagePut(`columnists/${input.slug}/${safeName}`, bytes, input.contentType, ctx.accessToken); }) }),
  comments: router({
    create: publicProcedure.input(z.object({ articleId: z.string().min(1), name: z.string().min(2).max(120), text: z.string().min(2).max(4000) })).mutation(async ({ input, ctx }) => {
      const row = { id: `comment-${Date.now()}-${randomBytes(4).toString("hex")}`, articleId: input.articleId, name: input.name.trim(), text: input.text.trim(), createdAtMs: Date.now(), status: "pending" as const, reply: null, repliedBy: null, repliedAtMs: null };
      await createComment(row, ctx.accessToken);
      return row;
    }),
  }),
  access: router({ list: adminProcedure.query(async ({ ctx }) => { return listUsers(ctx.accessToken); }), setRole: adminProcedure.input(z.object({ openId: z.string(), role: z.enum(["user", "admin", "columnist"]) })).mutation(async ({ input, ctx }) => { return setUserRole(input.openId,input.role,ctx.accessToken); }) }),
  invites: router({
    list: adminProcedure.query(({ ctx }) => listInvites(ctx.accessToken)),
    revoke: adminProcedure.input(z.object({ id: z.string() })).mutation(({ input, ctx }) => revokeInvite(input.id, ctx.accessToken)),
    resend: adminProcedure.input(z.object({ id: z.string() })).mutation(async ({ input, ctx }) => { const token = randomBytes(32).toString("hex"); const invite = await renewInvite(input.id, hashToken(token), Date.now() + 7 * 24 * 60 * 60 * 1000, ctx.accessToken); if (!invite) throw new Error("Somente convites pendentes podem ser reenviados."); const origin = ENV.publicAppUrl || `${ctx.req.protocol}://${ctx.req.get("host")}`; const inviteUrl = `${origin}/convite/${token}`; let emailSent = false; try { emailSent = (await sendInviteEmail(invite.email, invite.name, inviteUrl)).sent; } catch (error) { console.error("[SMTP] Invite resend failed:", error); } return { inviteUrl: `/convite/${token}`, emailSent, smtpConfigured: smtpConfigured(), expiresAtMs: invite.expiresAtMs }; }),
    create: adminProcedure.input(z.object({ email: z.string().email(), name: z.string().min(2) })).mutation(async ({ input, ctx }) => { const token = randomBytes(32).toString("hex"); const invite = { id: `invite-${Date.now()}-${randomBytes(4).toString("hex")}`, email: input.email.toLowerCase(), name: input.name.trim(), tokenHash: hashToken(token), expiresAtMs: Date.now() + 7 * 24 * 60 * 60 * 1000, createdAtMs: Date.now(), acceptedAtMs: null, revokedAtMs: null }; await createInvite(invite, ctx.accessToken); const origin = ENV.publicAppUrl || `${ctx.req.protocol}://${ctx.req.get("host")}`; const inviteUrl = `${origin}/convite/${token}`; let emailSent = false; try { emailSent = (await sendInviteEmail(invite.email, invite.name, inviteUrl)).sent; } catch (error) { console.error("[SMTP] Invite delivery failed:", error); } return { ...invite, token, inviteUrl: `/convite/${token}`, emailSent, smtpConfigured: smtpConfigured() }; }),
    preview: publicProcedure.input(z.object({ token: z.string().min(20) })).query(async ({ input }) => { const invite = await findInvite(hashToken(input.token)); if (!invite || invite.expiresAtMs < Date.now() || invite.revokedAtMs) return { valid: false }; return { valid: true, email: invite.email, name: invite.name, expiresAtMs: invite.expiresAtMs }; }),
    accept: protectedProcedure.input(z.object({ token: z.string().min(20) })).mutation(async ({ input, ctx }) => { const invite = await findInvite(hashToken(input.token)); if (!invite || invite.expiresAtMs < Date.now()) throw new Error("Convite inválido ou expirado."); if ((ctx.user.email || "").toLowerCase() !== invite.email.toLowerCase()) throw new Error("Entre com o mesmo e-mail que recebeu o convite."); await setUserRole(ctx.user.openId, "columnist", ctx.accessToken); const db = await getDb(ctx.accessToken); if (!db) throw new Error("Database unavailable"); await db.from("users").update({ name: ctx.user.name || invite.name }).eq("openId", ctx.user.openId); await acceptInvite(invite.id, ctx.accessToken); return { success: true }; }),
  }),
});
export type AppRouter = typeof appRouter;
