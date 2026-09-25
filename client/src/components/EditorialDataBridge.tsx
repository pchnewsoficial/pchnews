import { useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { NEWS_STORAGE_KEY, NewsArticle, readStoredArticles } from "@/lib/news";
import { ADS_STORAGE_KEY, COMMENTS_STORAGE_KEY, PROFILE_STORAGE_KEY, AdRequest, DEFAULT_PROFILES, ProfileData, ReaderComment, readAdRequests, readComments, readProfiles } from "@/lib/editorial";

function toDbPayload(user: { role: string; openId: string; name?: string | null }) {
  const localArticles = readStoredArticles();
  const articles = localArticles.map((article) => ({
    id: article.id, title: article.title, category: article.category, author: article.author,
    authorOpenId: article.authorOpenId ?? null, summary: article.summary, date: article.date,
    updated: article.updated, status: article.status, views: article.views, image: article.image,
    bodyHtml: article.bodyHtml, scheduledAt: article.scheduledAt ? new Date(article.scheduledAt).getTime() : null,
    tags: JSON.stringify(article.tags || []), youtubeUrl: article.youtubeUrl || null,
    socialLinks: JSON.stringify(article.socialLinks || {}), createdAt: new Date(), updatedAt: new Date(),
  }));
  const comments = readComments().map((comment) => ({
    id: comment.id, articleId: comment.articleId, name: comment.name, text: comment.text,
    createdAtMs: Date.parse(comment.createdAt) || Date.now(), status: comment.status,
    reply: comment.reply || null, repliedBy: comment.repliedBy || null,
    repliedAtMs: comment.repliedAt ? Date.parse(comment.repliedAt) : null,
  }));
  const profiles = (Object.values(readProfiles()) as ProfileData[]).map((profile) => ({
    slug: profile.slug, name: profile.name, beat: profile.beat, bio: profile.bio, photo: profile.photo,
    instagram: profile.instagram, facebook: profile.facebook, x: profile.x, linkedin: profile.linkedin,
    updatedAt: new Date(),
  }));
  const adRequests = readAdRequests().map((ad) => ({
    id: ad.id, business: ad.business, contact: ad.contact, packageName: ad.packageName,
    message: ad.message, status: ad.status, createdAtMs: ad.createdAtMs || Date.now(),
  }));
  void user;
  return { articles, comments, profiles, adRequests };
}

function safeJson<T>(value: unknown, fallback: T): T {
  if (typeof value !== "string") return (value as T) ?? fallback;
  try { return JSON.parse(value) as T; } catch { return fallback; }
}

function writeDbSnapshot(data: any) {
  const articles: NewsArticle[] = (data.articles || []).map((article: any) => ({
    ...article,
    tags: safeJson(article.tags, [] as string[]),
    socialLinks: safeJson(article.socialLinks, {} as NonNullable<NewsArticle["socialLinks"]>),
    scheduledAt: article.scheduledAt ? new Date(Number(article.scheduledAt)).toISOString().slice(0, 16) : undefined,
  }));
  const comments: ReaderComment[] = (data.comments || []).map((comment: any) => ({
    id: comment.id, articleId: comment.articleId, name: comment.name, text: comment.text,
    createdAt: new Date(Number(comment.createdAtMs)).toLocaleString("pt-BR"), status: comment.status,
    reply: comment.reply || undefined, repliedBy: comment.repliedBy || undefined,
    repliedAt: comment.repliedAtMs ? new Date(Number(comment.repliedAtMs)).toLocaleString("pt-BR") : undefined,
  }));
  const profiles: Record<string, ProfileData> = {};
  (data.profiles || []).forEach((profile: ProfileData) => { profiles[profile.slug] = profile; });
  const ads: AdRequest[] = (data.adRequests || []).map((ad: any) => ({
    id: ad.id, business: ad.business, contact: ad.contact, packageName: ad.packageName,
    message: ad.message, status: ad.status, createdAtMs: Number(ad.createdAtMs),
  }));
  if (articles.length) window.localStorage.setItem(NEWS_STORAGE_KEY, JSON.stringify(articles));
  if (comments.length) window.localStorage.setItem(COMMENTS_STORAGE_KEY, JSON.stringify(comments));
  if (Object.keys(profiles).length) window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify({ ...DEFAULT_PROFILES, ...profiles }));
  if (ads.length) window.localStorage.setItem(ADS_STORAGE_KEY, JSON.stringify(ads));
}

/**
 * Supabase is the editorial source of truth. localStorage is only a read
 * cache and a one-time first-run migration source. We intentionally do not
 * push local browser events back to the database, because that can overwrite
 * newer server state with a stale snapshot.
 */
export default function EditorialDataBridge() {
  const { user, isAuthenticated } = useAuth();
  const { data, isSuccess } = trpc.editorial.bootstrap.useQuery(undefined, { retry: false });
  const sync = trpc.editorial.sync.useMutation();

  useEffect(() => {
    if (!isSuccess || !data || !isAuthenticated || !user) return;
    const hasServerData = data.articles.length + data.comments.length + data.profiles.length + data.adRequests.length > 0;
    if (!hasServerData && user.role === "admin" && !sync.isPending && !sync.isSuccess) {
      sync.mutate(toDbPayload(user));
    } else if (hasServerData) {
      writeDbSnapshot(data);
    }
  }, [data, isSuccess, isAuthenticated, user?.openId, user?.role, sync.isPending, sync.isSuccess]);

  return null;
}
