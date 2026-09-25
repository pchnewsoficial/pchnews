export type UserRole = "user" | "admin" | "columnist";
export type ArticleStatus = "published" | "draft" | "review" | "revised" | "approved" | "scheduled" | "updated" | "archived";
export type CommentStatus = "pending" | "approved" | "rejected";
export type ReviewStatus = "pass" | "review" | "block";

export interface User {
  id: number;
  openId: string;
  name: string | null;
  email: string | null;
  loginMethod: string | null;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
  lastSignedIn: Date;
}
export type InsertUser = Partial<Omit<User, "id" | "createdAt" | "updatedAt">> & { openId: string };

export interface Article {
  id: string; title: string; category: string; author: string; authorOpenId: string | null;
  summary: string; date: string; updated: string; status: ArticleStatus; views: number;
  image: string; bodyHtml: string; scheduledAt: number | null; tags: string;
  scope: string; region: string | null; state: string | null; country: string | null; language: string; featured: boolean; sourceUrl: string | null; sourceName: string | null;
  youtubeUrl: string | null; socialLinks: string | null; slug: string | null;
  seoTitle: string | null; metaDescription: string | null; canonicalUrl: string | null;
  focusKeyword: string | null; ogTitle: string | null; ogDescription: string | null;
  imageAlt: string | null; noindex: boolean; createdAt: Date; updatedAt: Date;
}
export type InsertArticle = Omit<Article, "createdAt" | "updatedAt"> & Partial<Pick<Article, "createdAt" | "updatedAt">>;

export interface ViewEvent { id:string; articleId:string; visitorId:string; viewedAtMs:number; }
export interface Comment { id:string; articleId:string; name:string; text:string; createdAtMs:number; status:CommentStatus; reply:string|null; repliedBy:string|null; repliedAtMs:number|null; }
export interface ColumnistProfile { slug:string; name:string; beat:string; bio:string; photo:string; instagram:string; facebook:string; x:string; linkedin:string; updatedAt:Date; }
export interface AdRequest { id:string; business:string; contact:string; packageName:string; message:string; status:"received"|"reviewing"|"approved"; createdAtMs:number; }
export interface ColumnistInvite { id:string; email:string; name:string; tokenHash:string; expiresAtMs:number; createdAtMs:number; acceptedAtMs:number|null; revokedAtMs:number|null; }
export interface ArticleAudit { id:string; articleId:string; actorOpenId:string; actorName:string; action:string; beforeJson:string|null; afterJson:string|null; createdAtMs:number; }
export interface EditorialAgentRun { id:string; articleId:string; agentId:string; agentName:string; status:ReviewStatus; findingsJson:string; outputJson:string; actorOpenId:string; createdAtMs:number; }
export type EditorialFindingDecisionState = "pending" | "accepted" | "rejected";\nexport interface EditorialFindingDecision { id:string; articleId:string; agentRunId:string; findingCode:string; decision:EditorialFindingDecisionState; note:string|null; actorOpenId:string; createdAtMs:number; updatedAtMs:number; }
export interface EditorialFreedomReview { id:string; articleId:string; rulesetVersion:string; status:ReviewStatus; score:number; contentType:string; autonomyAnswer:string; checksJson:string; actorOpenId:string; createdAtMs:number; }

export type PautaPriority = "low" | "normal" | "high" | "urgent";
export type PautaStatus = "idea" | "planned" | "assigned" | "reporting" | "review" | "ready" | "published" | "archived";
export interface EditorialPauta {
  id: string; title: string; angle: string; briefing: string; category: string; priority: PautaPriority; status: PautaStatus;
  assignedToOpenId: string | null; assignedToName: string | null; deadlineAtMs: number | null; plannedPublishAtMs: number | null;
  tags: string; sourcesJson: unknown[]; checklistJson: unknown[]; articleId: string | null;
  createdByOpenId: string; createdByName: string | null; createdAtMs: number; updatedAtMs: number;
}
