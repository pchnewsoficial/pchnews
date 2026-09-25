import { FreedomReviewPanel, TolerajornalMark } from "@/components/FreedomReviewPanel";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Archive, BarChart3, Bell, Check, ChevronDown, Copy, Edit3, History, Eye, ExternalLink, FileText, FolderOpen, ImagePlus, LayoutDashboard, CalendarDays, LogOut, Mail, Menu, MoreHorizontal, Pencil, Plus, Search, Settings, Smartphone, Tablet, Monitor, Bold, Italic, Underline, List, ListOrdered, Link as LinkIcon, Quote, Undo2, Redo2, Trash2, Upload, UserPlus, Users, X, MessageCircle, Megaphone, UserCircle, Sparkles } from "lucide-react";
import { Link, useLocation } from "wouter";
import { ProfileData, persistProfiles, readComments, readProfiles, persistComments, ReaderComment, readAdRequests } from "@/lib/editorial";
import Ads from "./Ads";
import Audit, { AuditEntry } from "./Audit";
import Comments from "./Comments";
import Stats from "./Stats";
import EditorialAgents from "./EditorialAgents";
import Pauta from "./Pauta";
import ApiHubPanel from "@/components/ApiHubPanel";
import ApiHubEditorialTools from "@/components/ApiHubEditorialTools";
import { ArticleStatus, EDITORIAL_CATEGORIES, EDITORIAL_SCOPES, INITIAL_ARTICLES, MediaAsset, NewsArticle, makeArticleId, persistArticles, persistMedia, readStoredArticles, readStoredMedia, statusLabels } from "@/lib/news";

type View = "overview" | "articles" | "pauta" | "media" | "settings" | "profile" | "comments" | "ads" | "stats" | "audit" | "agents" | "apiHub";
type Columnist = { id: string; name: string; email: string; beat: string; active: boolean };
type AccessUser = { id: number; openId: string; name: string | null; email: string | null; role: "user" | "admin" | "columnist"; lastSignedIn: Date };
const LOGO_URL = "/brand/logo.svg?v=20260925-2";
const COLUMNISTS_KEY = "pch-news-columnists";
const slugify = (value: string) => value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const INITIAL_COLUMNISTS: Columnist[] = [{ id: "col-1", name: "Evaldo Poeta", email: "evaldo@pchnews.com.br", beat: "Cultura e opinião", active: true }, { id: "col-2", name: "Marina Alves", email: "marina@pchnews.com.br", beat: "Saúde e bem-estar", active: true }];

type Draft = Pick<NewsArticle, "title" | "category" | "author" | "summary" | "image" | "status" | "bodyHtml" | "scope" | "region" | "state" | "country" | "language" | "featured" | "slug" | "seoTitle" | "metaDescription" | "canonicalUrl" | "focusKeyword" | "ogTitle" | "ogDescription" | "imageAlt" | "noindex"> & { scheduledAt: string; tagsInput: string; youtubeUrl: string; socialLinks: { instagram: string; facebook: string; x: string; linkedin: string; tiktok: string; website: string } };

const blankDraft: Draft = { title: "", category: "Brasil", author: "Redação PCH News", summary: "", slug: "", seoTitle: "", metaDescription: "", canonicalUrl: "", focusKeyword: "", ogTitle: "", ogDescription: "", imageAlt: "", noindex: false, scope: "national", region: "", state: "", country: "Brasil", language: "pt-BR", featured: false, image: "", status: "draft", bodyHtml: "<p>Comece a escrever o corpo da notícia...</p>", scheduledAt: "", tagsInput: "", youtubeUrl: "", socialLinks: { instagram: "", facebook: "", x: "", linkedin: "", tiktok: "", website: "" } };

const statusClass: Record<ArticleStatus, string> = { published: "status-published", draft: "status-draft", review: "status-review", revised: "status-review", approved: "status-published", scheduled: "status-scheduled", updated: "status-published", archived: "status-archived" };

function getGreeting() {
  const hour = new Date().getHours();
  return hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";
}

function formatToday() {
  return new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })
    .format(new Date())
    .replace(/^./, (letter) => letter.toUpperCase());
}

function getInitials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "PN";
}

export default function Admin() {
  const [articles, setArticles] = useState<NewsArticle[]>(readStoredArticles);
  const [view, setView] = useState<View>("overview");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ArticleStatus | "all">("all");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<NewsArticle | null>(null);
  const [draft, setDraft] = useState<Draft>(blankDraft);
  const [toast, setToast] = useState("");
  const [autosaveState, setAutosaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const editorOpenedAt = useRef(0);
  const autosaveTimer = useRef<number | null>(null);
  const [previewArticle, setPreviewArticle] = useState<NewsArticle | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [media, setMedia] = useState<MediaAsset[]>(readStoredMedia);
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const [comments, setComments] = useState<ReaderComment[]>(readComments);
  const [profiles, setProfiles] = useState<Record<string, ProfileData>>(readProfiles);
  const [adRequests] = useState(readAdRequests);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const { user, logout: oauthLogout } = useAuth();
  const currentRole = user?.role === "admin" ? "admin" : "columnist";
  const currentAuthor = user?.name || "Colunista";
  const displayName = user?.name || "Redação PCH News";
  const displayInitials = getInitials(displayName);
  const pendingComments = comments.filter((comment) => comment.status === "pending").length;
  const pendingTasks = pendingComments + adRequests.length;
  const isAdmin = currentRole === "admin";
  const { data: analytics } = trpc.editorial.analytics.useQuery({ author: isAdmin ? undefined : currentAuthor }, { enabled: Boolean(user), retry: false });
  const { data: editorialRemote } = trpc.editorial.bootstrap.useQuery(undefined, { enabled: Boolean(user), retry: false });
  const { data: accessUsers = [], refetch: refetchAccess } = trpc.access.list.useQuery(undefined, { enabled: isAdmin, retry: false });
  const { data: auditEntries = [] } = trpc.editorial.audit.useQuery({}, { enabled: isAdmin, retry: false });
  const { data: articleHistory = [] } = trpc.editorial.history.useQuery({ articleId: editing?.id || "" }, { enabled: Boolean(user && editing), retry: false });
  const saveArticleRemote = trpc.editorial.saveArticle.useMutation();
  const reviewArticleRemote = trpc.editorialAgents.run.useMutation();
  const findingDecision = trpc.editorialAgents.decideFinding.useMutation();
  const [editorReview, setEditorReview] = useState<any>(null);
  const [findingDecisions, setFindingDecisions] = useState<Record<string, "pending" | "accepted" | "rejected">>({});
  const setRole = trpc.access.setRole.useMutation({ onSuccess: () => refetchAccess() });
  const profileSave = trpc.profiles.save.useMutation();
  const profileUpload = trpc.profiles.uploadPhoto.useMutation();
  const mediaList = trpc.media.list.useQuery(undefined, { enabled: Boolean(user), retry: false });
  const mediaUpload = trpc.media.upload.useMutation();
  const canManageArticle = (article: NewsArticle) => isAdmin || article.author === currentAuthor;
  const [columnists, setColumnists] = useState<Columnist[]>(() => { try { const stored = window.localStorage.getItem(COLUMNISTS_KEY); return stored ? JSON.parse(stored) : INITIAL_COLUMNISTS; } catch { return INITIAL_COLUMNISTS; } });
  const [, navigate] = useLocation();

  useEffect(() => {
    const due = articles.filter((article) => article.status === "scheduled" && article.scheduledAt && new Date(article.scheduledAt).getTime() <= Date.now());
    if (due.length) {
      const nextArticles = articles.map((article) => due.some((item) => item.id === article.id) ? { ...article, status: "published" as ArticleStatus, updated: "publicado agora" } : article);
      setArticles(nextArticles);
      persistArticles(nextArticles);
    }
    
  }, [articles]);

  const saveColumnists = (next: Columnist[]) => { setColumnists(next); window.localStorage.setItem(COLUMNISTS_KEY, JSON.stringify(next)); };
  const saveProfile = (profile: ProfileData) => { const next = { ...profiles, [profile.slug]: profile }; setProfiles(next); persistProfiles(next); profileSave.mutate(profile, { onSuccess: () => notify("Perfil atualizado e publicado no banco."), onError: () => notify("Não foi possível salvar o perfil agora.") }); };
  const uploadProfilePhoto = async (file: File, setUrl: (url: string) => void) => { try { const bytes = new Uint8Array(await file.arrayBuffer()); let binary = ""; bytes.forEach((byte) => { binary += String.fromCharCode(byte); }); const result = await profileUpload.mutateAsync({ slug: slugify(currentAuthor), fileName: file.name, contentType: file.type as "image/png" | "image/jpeg" | "image/webp" | "image/gif", base64: btoa(binary) }); setUrl(result.url); notify("Foto enviada para o armazenamento seguro."); } catch { notify("Não foi possível enviar a foto."); } };
  const logout = async () => { await oauthLogout(); navigate("/login"); };

  const publishedCount = articles.filter((article) => article.status === "published").length;
  const draftCount = articles.filter((article) => article.status === "draft").length;
  const scheduledCount = articles.filter((article) => article.status === "scheduled").length;
  const reviewCount = articles.filter((article) => article.status === "review").length;
  useEffect(() => {
    const totals = ((analytics as any)?.totals || []) as Array<{ articleId: string; views: number }>;
    if (!totals.length) return;
    setArticles((current) => current.map((article) => {
      const remote = totals.find((item) => item.articleId === article.id);
      return remote ? { ...article, views: remote.views } : article;
    }));
  }, [analytics]);
  useEffect(() => {
    if (!editorialRemote) return;
    const mapArticle = (article: any): NewsArticle => ({
      ...article,
      tags: typeof article.tags === "string" ? (() => { try { return JSON.parse(article.tags || "[]"); } catch { return []; } })() : article.tags || [],
      socialLinks: typeof article.socialLinks === "string" ? (() => { try { return JSON.parse(article.socialLinks || "{}"); } catch { return {}; } })() : article.socialLinks || {},
      scheduledAt: article.scheduledAt ? new Date(Number(article.scheduledAt)).toISOString().slice(0, 16) : undefined,
    });
    setArticles((editorialRemote.articles || []).map(mapArticle));
    setComments((editorialRemote.comments || []).map((comment: any) => ({
      ...comment,
      createdAt: comment.createdAt || new Date(Number(comment.createdAtMs || Date.now())).toLocaleString("pt-BR"),
      repliedAt: comment.repliedAt || (comment.repliedAtMs ? new Date(Number(comment.repliedAtMs)).toLocaleString("pt-BR") : undefined),
    })));
    setProfiles(Object.fromEntries((editorialRemote.profiles || []).map((profile: any) => [profile.slug, profile])));
  }, [editorialRemote]);
  const totalViews = articles.reduce((total, article) => total + article.views, 0);

  const filteredArticles = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return articles.filter((article) => {
      const matchesStatus = statusFilter === "all" || article.status === statusFilter;
      const matchesCategory = categoryFilter === "all" || article.category === categoryFilter;
      const matchesQuery = !normalizedQuery || `${article.title} ${article.category} ${article.author} ${(article.tags || []).join(" ")}`.toLowerCase().includes(normalizedQuery);
      return matchesStatus && matchesCategory && matchesQuery;
    });
  }, [articles, query, statusFilter, categoryFilter]);

  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2800);
  };

  const openCreate = () => {
    setEditing(null);
    setAutosaveState("idle");
    editorOpenedAt.current = Date.now();
    setDraft({ ...blankDraft, author: currentAuthor });
    setEditorOpen(true);
  };

  const openEdit = (article: NewsArticle) => {
    if (!canManageArticle(article)) { notify("Colunistas só podem editar as próprias publicações."); return; }
    setEditing(article);
    setAutosaveState("saved");
    editorOpenedAt.current = Date.now();
    setDraft({ title: article.title, category: article.category, author: article.author, summary: article.summary, slug: article.slug || slugify(article.title), seoTitle: article.seoTitle || article.title, metaDescription: article.metaDescription || article.summary, canonicalUrl: article.canonicalUrl || "", focusKeyword: article.focusKeyword || "", ogTitle: article.ogTitle || article.title, ogDescription: article.ogDescription || article.summary, imageAlt: article.imageAlt || article.title, noindex: Boolean(article.noindex), image: article.image, status: article.status, bodyHtml: article.bodyHtml || `<p>${article.summary}</p>`, scheduledAt: article.scheduledAt || "", youtubeUrl: article.youtubeUrl || "", socialLinks: { instagram: article.socialLinks?.instagram || "", facebook: article.socialLinks?.facebook || "", x: article.socialLinks?.x || "", linkedin: article.socialLinks?.linkedin || "", tiktok: article.socialLinks?.tiktok || "", website: article.socialLinks?.website || "" }, tagsInput: (article.tags || []).join(", "), scope: article.scope || "national", region: article.region || "", state: article.state || "", country: article.country || (article.scope === "international" ? "" : "Brasil"), language: article.language || "pt-BR", featured: Boolean(article.featured) });
    setEditorOpen(true);
  };

  useEffect(() => {
    if (!editorOpen || !editing || !user || Date.now() - editorOpenedAt.current < 1200) return;
    if (!draft.title.trim() || !draft.summary.trim()) return;
    if (autosaveTimer.current) window.clearTimeout(autosaveTimer.current);
    autosaveTimer.current = window.setTimeout(async () => {
      setAutosaveState("saving");
      try {
        await saveArticleRemote.mutateAsync({
          id: editing.id, title: draft.title.trim(), category: draft.category, author: draft.author,
          authorOpenId: editing.authorOpenId ?? user.openId, summary: draft.summary.trim(), date: editing.date,
          updated: "salvo automaticamente", status: draft.status, views: editing.views, image: draft.image,
          bodyHtml: draft.bodyHtml, scheduledAt: draft.scheduledAt ? new Date(draft.scheduledAt).getTime() : null,
          tags: JSON.stringify(draft.tagsInput.split(",").map((tag) => tag.trim()).filter(Boolean)),
          slug: draft.slug || slugify(draft.title), seoTitle: draft.seoTitle || draft.title,
          metaDescription: draft.metaDescription || draft.summary, canonicalUrl: draft.canonicalUrl || null,
          focusKeyword: draft.focusKeyword || null, ogTitle: draft.ogTitle || draft.title,
          ogDescription: draft.ogDescription || draft.summary, imageAlt: draft.imageAlt || draft.title,
          noindex: Boolean(draft.noindex), youtubeUrl: draft.youtubeUrl || null,
          socialLinks: JSON.stringify(draft.socialLinks || {}), scope: draft.scope || "national",
          region: draft.region || null, state: draft.state || null, country: draft.country || "Brasil",
          language: draft.language || "pt-BR", featured: Boolean(draft.featured), sourceUrl: editing.sourceUrl || null,
          sourceName: editing.sourceName || null,
        });
        setAutosaveState("saved");
      } catch (error) {
        console.error(error);
        setAutosaveState("error");
      }
    }, 1400);
    return () => { if (autosaveTimer.current) window.clearTimeout(autosaveTimer.current); };
  }, [draft, editorOpen, editing, user]);
  
  const runFullEditorialReview = async () => {
    const article = { id: editing?.id || "draft-preview", title: draft.title, category: draft.category, author: draft.author, summary: draft.summary, bodyHtml: draft.bodyHtml, image: draft.image, tags: JSON.stringify(draft.tagsInput.split(",").map((tag) => tag.trim()).filter(Boolean)), status: draft.status, scheduledAt: draft.scheduledAt ? new Date(draft.scheduledAt).getTime() : null, region: draft.region || null, state: draft.state || null, country: draft.country || null };
    try {
      const result = await reviewArticleRemote.mutateAsync({ articleId: article.id, agentId: "journalism-master-orchestrator", article });
      setEditorReview(result);
      const agents = ((result as any)?.output?.agents || []) as Array<any>;
      const seo = agents.find((item) => item.agentId === "seo-optimization-specialist")?.output;
      if (seo) setDraft((current) => ({ ...current, slug: current.slug || seo.suggestedSlug || "", metaDescription: current.metaDescription || seo.metaDescription || "" }));
      notify(result.status === "block" ? "Revisão encontrou bloqueios antes da publicação." : result.status === "review" ? "Revisão concluída: há pontos para conferência humana." : "Revisão concluída sem alertas.");
    } catch (error) { notify(error instanceof Error ? error.message : "Não foi possível executar a revisão."); }
  };

  const openDraftPreview = () => {
    setPreviewArticle({
      id: editing?.id ?? "preview",
      title: draft.title.trim() || "Título da sua notícia",
      category: draft.category,
      author: draft.author || "Redação PCH News",
      summary: draft.summary.trim() || "O resumo da notícia aparecerá aqui para apresentar o contexto ao leitor.",
      date: editing?.date ?? "20/09/2026",
      updated: "prévia",
      status: draft.status,
      views: editing?.views ?? 0,
      image: draft.image,
      bodyHtml: draft.bodyHtml,
      scheduledAt: draft.scheduledAt,
      tags: draft.tagsInput.split(",").map((tag) => tag.trim()).filter(Boolean),
    });
  };

  const saveArticle = async (event: FormEvent) => {
    event.preventDefault();
    if (!draft.title.trim() || !draft.summary.trim()) {
      notify("Preencha título e resumo antes de salvar.");
      return;
    }
    if ((draft.status === "published" || draft.status === "scheduled") && !draft.image.trim()) {
      notify("Selecione uma imagem principal antes de publicar ou agendar.");
      return;
    }
    if (draft.status === "scheduled" && !draft.scheduledAt) {
      notify("Defina a data e o horário exatos do agendamento.");
      return;
    }

    if (editing && !canManageArticle(editing)) { notify("Você não tem permissão para editar esta publicação."); return; }
    const nextArticles = editing
      ? articles.map((article) => article.id === editing.id ? { ...article, ...draft, title: draft.title.trim(), summary: draft.summary.trim(), tags: draft.tagsInput.split(",").map((tag) => tag.trim()).filter(Boolean), updated: draft.status === "scheduled" ? `agendada para ${formatSchedule(draft.scheduledAt)}` : "agora" } : article)
      : [{ ...draft, id: makeArticleId(), scope: draft.scope || "national", region: draft.region || null, state: draft.state || null, country: draft.country || null, language: draft.language || "pt-BR", featured: draft.featured, date: "20/09/2026", tags: draft.tagsInput.split(",").map((tag) => tag.trim()).filter(Boolean), updated: draft.status === "scheduled" ? `agendada para ${formatSchedule(draft.scheduledAt)}` : "agora", views: 0 }, ...articles];

    const savedArticle = editing ? nextArticles.find((article) => article.id === editing.id)! : nextArticles[0];
    const remoteStatus = savedArticle.status;
    try {
      await saveArticleRemote.mutateAsync({ id: savedArticle.id, title: savedArticle.title, category: savedArticle.category, author: savedArticle.author, authorOpenId: savedArticle.authorOpenId ?? user?.openId ?? null, summary: savedArticle.summary, date: savedArticle.date, updated: savedArticle.updated, status: remoteStatus, views: savedArticle.views, image: savedArticle.image, bodyHtml: savedArticle.bodyHtml, scheduledAt: savedArticle.scheduledAt ? new Date(savedArticle.scheduledAt).getTime() : null, tags: JSON.stringify(savedArticle.tags || []), slug: savedArticle.slug || slugify(savedArticle.title), seoTitle: savedArticle.seoTitle || savedArticle.title, metaDescription: savedArticle.metaDescription || savedArticle.summary, canonicalUrl: savedArticle.canonicalUrl || null, focusKeyword: savedArticle.focusKeyword || null, ogTitle: savedArticle.ogTitle || savedArticle.title, ogDescription: savedArticle.ogDescription || savedArticle.summary, imageAlt: savedArticle.imageAlt || savedArticle.title, noindex: Boolean(savedArticle.noindex), youtubeUrl: savedArticle.youtubeUrl || null, socialLinks: JSON.stringify(savedArticle.socialLinks || {}), scope: savedArticle.scope || "national", region: savedArticle.region || null, state: savedArticle.state || null, country: savedArticle.country || "Brasil", language: savedArticle.language || "pt-BR", featured: Boolean(savedArticle.featured), sourceUrl: savedArticle.sourceUrl || null, sourceName: savedArticle.sourceName || null });
      setArticles(nextArticles);
      persistArticles(nextArticles);
      window.dispatchEvent(new Event("pch-news-data-changed"));
      setEditorOpen(false);
      notify(draft.status === "scheduled" ? `Publicação agendada para ${formatSchedule(draft.scheduledAt)}.` : editing ? "Notícia atualizada e sincronizada com o banco." : "Notícia criada e salva no banco.");
    } catch (error) {
      console.error(error);
      notify("Não foi possível salvar a publicação no banco. O conteúdo continua nesta tela.");
    }
  };

  const nextWorkflowStatus = (status: ArticleStatus): ArticleStatus => {
    if (status === "draft") return "review";
    if (status === "review") return "revised";
    if (status === "revised") return "approved";
    if (status === "approved") return "scheduled";
    if (status === "published") return "updated";
    if (status === "scheduled") return "published";
    if (status === "archived") return "draft";
    return "draft";
  };

  const updateStatus = (id: string, status: ArticleStatus) => {
    const target = articles.find((article) => article.id === id);
    if (target && !canManageArticle(target)) { notify("Colunistas só podem alterar as próprias publicações."); return; }
    const nextArticles = articles.map((article) => article.id === id ? { ...article, status, updated: "agora", authorOpenId: article.authorOpenId ?? user?.openId ?? null } : article);
    const updatedArticle = nextArticles.find((article) => article.id === id);
    if (!updatedArticle) return;
    const remoteStatus = status;
    saveArticleRemote.mutate({ id: updatedArticle.id, title: updatedArticle.title, category: updatedArticle.category, author: updatedArticle.author, authorOpenId: updatedArticle.authorOpenId ?? null, summary: updatedArticle.summary, date: updatedArticle.date, updated: updatedArticle.updated, status: remoteStatus, views: updatedArticle.views, image: updatedArticle.image, bodyHtml: updatedArticle.bodyHtml, scheduledAt: updatedArticle.scheduledAt ? new Date(updatedArticle.scheduledAt).getTime() : null, tags: JSON.stringify(updatedArticle.tags || []), youtubeUrl: updatedArticle.youtubeUrl || null, socialLinks: JSON.stringify(updatedArticle.socialLinks || {}), scope: updatedArticle.scope || "national", region: updatedArticle.region || null, state: updatedArticle.state || null, country: updatedArticle.country || "Brasil", language: updatedArticle.language || "pt-BR", featured: Boolean(updatedArticle.featured), sourceUrl: updatedArticle.sourceUrl || null, sourceName: updatedArticle.sourceName || null }, { onSuccess: () => { setArticles(nextArticles); persistArticles(nextArticles); window.dispatchEvent(new Event("pch-news-data-changed")); notify(`Notícia marcada como ${statusLabels[status].toLowerCase()}.`); }, onError: () => notify("O banco recusou a alteração de status; a publicação não foi alterada.") });
  };

  const deleteArticle = (id: string) => {
    const article = articles.find((item) => item.id === id);
    if (!article || !canManageArticle(article) || !window.confirm(`Arquivar “${article.title}”?`)) return;
    updateStatus(id, "archived");
  };

  const duplicateArticle = (article: NewsArticle) => {
    if (!canManageArticle(article)) { notify("Colunistas só podem duplicar as próprias publicações."); return; }
    const copy = { ...article, id: makeArticleId(), title: `${article.title} — cópia`, status: "draft" as ArticleStatus, views: 0, updated: "agora" };
    const nextArticles = [copy, ...articles];
    saveArticleRemote.mutate({ id: copy.id, title: copy.title, category: copy.category, author: copy.author, authorOpenId: copy.authorOpenId ?? user?.openId ?? null, summary: copy.summary, date: copy.date, updated: copy.updated, status: "draft", views: 0, image: copy.image, bodyHtml: copy.bodyHtml, scheduledAt: null, tags: JSON.stringify(copy.tags || []), youtubeUrl: copy.youtubeUrl || null, socialLinks: JSON.stringify(copy.socialLinks || {}), scope: copy.scope || "national", region: copy.region || null, state: copy.state || null, country: copy.country || "Brasil", language: copy.language || "pt-BR", featured: Boolean(copy.featured), sourceUrl: copy.sourceUrl || null, sourceName: copy.sourceName || null }, { onSuccess: () => { setArticles(nextArticles); persistArticles(nextArticles); window.dispatchEvent(new Event("pch-news-data-changed")); notify("Cópia criada e salva como rascunho."); }, onError: () => notify("Não foi possível salvar a cópia no banco.") });
  };

  useEffect(() => {
    if (!mediaList.data) return;
    const remoteMedia = (mediaList.data as any[]).map((item) => ({
      id: item.id,
      name: item.name,
      src: item.url,
      size: item.size ? `${Math.round(Number(item.size) / 1024)} KB` : "",
      createdAt: item.createdAt || "agora",
    })) as MediaAsset[];
    setMedia(remoteMedia);
  }, [mediaList.data]);

  const uploadMedia = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { notify("Escolha um arquivo de imagem."); return; }
    if (file.size > 5 * 1024 * 1024) { notify("A imagem deve ter no máximo 5 MB."); return; }
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      let binary = "";
      bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
      const result = await mediaUpload.mutateAsync({
        slug: "editorial",
        fileName: file.name,
        contentType: file.type as "image/png" | "image/jpeg" | "image/webp" | "image/gif",
        base64: btoa(binary),
      });
      const asset: MediaAsset = { id: result.key, name: file.name, src: result.url, size: `${Math.round(file.size / 1024)} KB`, createdAt: "agora" };
      setMedia((current) => [asset, ...current]);
      notify("Imagem enviada para a mídia persistente.");
    } catch (error) {
      console.error(error);
      notify("Não foi possível enviar a imagem para o armazenamento.");
    } finally {
      event.target.value = "";
    }
  };

  const insertMediaIntoDraft = (asset: MediaAsset) => {
    setDraft((current) => ({ ...current, bodyHtml: `${current.bodyHtml}<p><img src="${asset.src}" alt="${asset.name}" /></p>` }));
    setMediaPickerOpen(false);
    notify("Imagem inserida no corpo da notícia.");
  };

  const exportArticles = () => {
    const blob = new Blob([JSON.stringify(articles, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "pch-news-artigos.json";
    anchor.click();
    URL.revokeObjectURL(url);
    notify("Arquivo de notícias exportado.");
  };

  const navItems: { id: View; label: string; icon: typeof LayoutDashboard }[] = [
    { id: "overview", label: "Visão geral", icon: LayoutDashboard },
    { id: "articles", label: "Notícias", icon: FileText },
    { id: "pauta", label: "Pauta", icon: CalendarDays },
    { id: "agents", label: "Agentes editoriais", icon: Sparkles },
    ...(isAdmin ? [{ id: "apiHub" as View, label: "Integrações / API Hub", icon: Settings }] : []),
    { id: "media", label: "Mídia", icon: FolderOpen },
    { id: "stats", label: "Estatísticas", icon: BarChart3 },
    { id: "audit", label: "Auditoria", icon: History },
    { id: "comments", label: "Comentários", icon: MessageCircle },
    { id: "ads", label: "Anúncios", icon: Megaphone },
    { id: "profile", label: "Meu perfil", icon: UserCircle },
    { id: "settings", label: "Configurações", icon: Settings },
  ];

  return (
    <div className="admin-shell">
      <aside className={`admin-sidebar ${sidebarOpen ? "is-open" : ""}`}>
        <div className="admin-brand"><img src={LOGO_URL} alt="PCH News" /><span>STUDIO</span></div>
        <div className="workspace-switcher"><div className="workspace-avatar">PN</div><div><strong>PCH News</strong><small>Redação principal</small></div><ChevronDown size={15} /></div>
        <nav className="admin-nav" aria-label="Navegação do painel"><span className="nav-label">WORKSPACE</span>{navItems.filter((item) => isAdmin || !["settings", "ads"].includes(item.id)).map(({ id, label, icon: Icon }) => <button key={id} className={view === id ? "active" : ""} onClick={() => { setView(id); setSidebarOpen(false); }}><Icon size={17} /><span>{label}</span>{id === "articles" && <em>{articles.length}</em>}</button>)}<span className="nav-label nav-label-spaced">CANAIS</span><button onClick={() => { setView("stats"); setSidebarOpen(false); }}><BarChart3 size={17} /><span>Analytics</span></button><button onClick={() => setNotificationsOpen(true)}><Bell size={17} /><span>Notificações</span>{pendingTasks > 0 && <em>{pendingTasks}</em>}</button></nav>
        <div className="sidebar-bottom"><div className="user-chip"><div className="user-avatar">{displayInitials}</div><div><strong>{displayName}</strong><small>{isAdmin ? "Administrador" : "Colunista"}</small></div><MoreHorizontal size={16} /></div><Link className="back-public" href="/"><ExternalLink size={14} /> Ver site público</Link><button className="logout-button" onClick={logout}><LogOut size={14} /> Sair do painel</button></div>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar"><button className="admin-mobile-menu" aria-label="Abrir menu" onClick={() => setSidebarOpen((open) => !open)}><Menu size={20} /></button><div className="breadcrumbs"><span>Studio</span><b>/</b><strong>{navItems.find((item) => item.id === view)?.label}</strong>{!isAdmin && <span className="author-badge">{currentAuthor}</span>}</div><div className="topbar-actions"><span className="role-badge">{isAdmin ? "Administrador" : "Colunista"}</span><span className="autosave"><span className="online-dot" /> Alterações salvas</span><div className="notification-wrap"><button className="top-icon" aria-label="Notificações" onClick={() => setNotificationsOpen((open) => !open)}><Bell size={18} />{comments.filter((comment) => comment.status === "pending").length + adRequests.length > 0 && <i />}</button>{notificationsOpen && <div className="notification-popover"><strong>Notificações</strong>{comments.filter((comment) => comment.status === "pending").length > 0 && <button onClick={() => { setView("comments"); setNotificationsOpen(false); }}><MessageCircle size={14} /><span><b>{comments.filter((comment) => comment.status === "pending").length} comentário(s)</b><small>Aguardando moderação</small></span></button>}{adRequests.length > 0 && <button onClick={() => { setView("ads"); setNotificationsOpen(false); }}><Megaphone size={14} /><span><b>{adRequests.length} solicitação(ões)</b><small>Interesse em anúncios</small></span></button>}{comments.filter((comment) => comment.status === "pending").length === 0 && adRequests.length === 0 && <small className="notification-empty">Tudo em dia por aqui.</small>}</div>}</div><div className="top-avatar" aria-label={displayName}>{displayInitials}</div></div></header>

        <main className="admin-content">
          {view === "overview" && <><div className="admin-heading"><div><span className="admin-kicker">{formatToday()}</span><h1>{getGreeting()}, {displayName.split(" ")[0]}<span>.</span></h1><p>Centralize pauta, produção, revisão, publicação e audiência em uma única redação.</p></div><button className="primary-cta" onClick={openCreate}><Plus size={17} /> Nova notícia</button></div><section className="metrics-grid"><MetricCard label="Visualizações totais" value={totalViews.toLocaleString("pt-BR")} delta="+18,4%" icon={BarChart3} accent="blue" /><MetricCard label="Publicadas" value={String(publishedCount).padStart(2, "0")} delta="+3 esta semana" icon={Check} accent="green" /><MetricCard label="Em produção" value={String(draftCount + reviewCount + scheduledCount).padStart(2, "0")} delta={reviewCount ? reviewCount + " em revisão" : draftCount + " rascunhos"} icon={Pencil} accent="gold" /><MetricCard label="Pendências" value={String(pendingTasks).padStart(2, "0")} delta={pendingComments ? pendingComments + " comentários" : "Tudo em dia"} icon={Bell} accent="blue" /></section><section className="dashboard-grid"><div className="panel featured-panel"><div className="panel-heading"><div><span className="admin-kicker">DESEMPENHO EDITORIAL</span><h2>Histórias que estão movendo o Brasil</h2></div><button className="ghost-button" onClick={() => setView("articles")}>Ver todas <ArrowIcon /></button></div><div className="featured-list">{articles.filter((article) => article.status === "published").slice(0, 4).map((article, index) => <div className="featured-row" key={article.id}><span className="rank">0{index + 1}</span><img src={article.image} alt="" /><div className="featured-copy"><span>{article.category}</span><h3>{article.title}</h3><small>{article.author} · {article.updated}</small></div><strong>{article.views.toLocaleString("pt-BR")} <small>views</small></strong></div>)}</div></div><div className="panel activity-panel"><div className="panel-heading"><div><span className="admin-kicker">ATIVIDADE</span><h2>Ritmo da redação</h2></div><button className="more-button" aria-label="Mais opções"><MoreHorizontal size={18} /></button></div><div className="activity-chart"><div className="chart-y"><span>1k</span><span>750</span><span>500</span><span>250</span><span>0</span></div><div className="chart-area"><div className="chart-grid-lines"><i /><i /><i /><i /><i /></div><svg viewBox="0 0 420 170" preserveAspectRatio="none" aria-label="Gráfico de visualizações"><defs><linearGradient id="chart-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#1e468c" stopOpacity=".3" /><stop offset="1" stopColor="#1e468c" stopOpacity="0" /></linearGradient></defs><path d="M0,136 C34,128 50,96 82,107 S123,129 150,92 S184,41 214,72 S251,98 282,57 S324,38 351,61 S389,42 420,20 L420,170 L0,170 Z" fill="url(#chart-fill)" /><path d="M0,136 C34,128 50,96 82,107 S123,129 150,92 S184,41 214,72 S251,98 282,57 S324,38 351,61 S389,42 420,20" fill="none" stroke="#1e468c" strokeWidth="3" /></svg><div className="chart-x"><span>14 set</span><span>16 set</span><span>18 set</span><span>20 set</span></div></div></div><div className="chart-total"><strong>3.782</strong><span>visualizações nos últimos 7 dias</span></div></div></section><section className="panel quick-panel"><div className="panel-heading"><div><span className="admin-kicker">ATENÇÃO</span><h2>Próximos passos</h2></div><span className="progress-label">2 de 4 concluídos</span></div><div className="progress-track"><span style={{ width: "50%" }} /></div><div className="checklist"><button onClick={() => notify("Tarefa marcada como concluída.")}><span className="check-empty" /> Revisar matéria sobre jardins urbanos <small>hoje</small></button><button className="done" onClick={() => notify("Tarefa já concluída.")}><span className="check-done"><Check size={12} /></span> Atualizar chamada principal <small>concluído</small></button><button className="done" onClick={() => notify("Tarefa já concluída.")}><span className="check-done"><Check size={12} /></span> Conferir calendário editorial <small>concluído</small></button><button onClick={() => notify("Tarefa marcada como concluída.")}><span className="check-empty" /> Selecionar pauta de cultura <small>amanhã</small></button></div></section></>}

          {view === "pauta" && <Pauta isAdmin={isAdmin} currentAuthor={currentAuthor} accessUsers={accessUsers as AccessUser[]} notify={notify} />}\n\n          {view === "articles" && <><div className="admin-heading compact"><div><span className="admin-kicker">CENTRAL DE CONTEÚDO</span><h1>Notícias<span>.</span></h1><p>Crie, organize e acompanhe tudo o que vai ao ar no PCH News.</p></div><div className="heading-actions"><button className="secondary-cta" onClick={exportArticles}><Upload size={16} /> Exportar</button><button className="primary-cta" onClick={openCreate}><Plus size={17} /> Nova notícia</button></div></div><div className="article-toolbar"><div className="admin-search"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por título, autor ou editoria" /></div><select className="category-filter" value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}><option value="all">Todas as editorias</option>{Array.from(new Set(articles.map((article) => article.category))).map((category) => <option key={category}>{category}</option>)}</select><div className="filter-tabs"><button className={statusFilter === "all" ? "active" : ""} onClick={() => setStatusFilter("all")}>Todas <span>{articles.length}</span></button>{(Object.keys(statusLabels) as ArticleStatus[]).map((status) => <button key={status} className={statusFilter === status ? "active" : ""} onClick={() => setStatusFilter(status)}>{statusLabels[status]} <span>{articles.filter((article) => article.status === status).length}</span></button>)}</div></div><div className="panel table-panel"><div className="table-caption"><span>{filteredArticles.length} publicações encontradas</span><button className="sort-button">Mais recentes <ChevronDown size={14} /></button></div><div className="news-table"><div className="table-head"><span className="check-box" /><span>NOTÍCIA</span><span>EDITORIA</span><span>STATUS</span><span>ATUALIZADA</span><span /></div>{filteredArticles.map((article) => <div className="table-row" key={article.id}><span className="check-box" /><div className="article-cell"><img src={article.image} alt="" /><div><strong>{article.title}</strong><small>Por {article.author}</small></div></div><span className="category-cell">{article.category}</span><span><button disabled={!canManageArticle(article)} className={`status-pill ${statusClass[article.status]}`} onClick={() => updateStatus(article.id, nextWorkflowStatus(article.status))}><i /> {statusLabels[article.status]}</button></span><span className="updated-cell">{article.updated}</span><div className="row-actions"><button aria-label="Visualizar prévia" title="Visualizar prévia" onClick={() => setPreviewArticle(article)}><Eye size={15} /></button><button disabled={!canManageArticle(article)} aria-label="Editar" onClick={() => openEdit(article)}><Edit3 size={15} /></button><button disabled={!canManageArticle(article)} aria-label="Duplicar" onClick={() => duplicateArticle(article)}><FileText size={15} /></button><button disabled={!canManageArticle(article)} aria-label="Arquivar" onClick={() => deleteArticle(article.id)}><Archive size={15} /></button></div></div>)}</div>{filteredArticles.length === 0 && <div className="table-empty"><Search size={22} /><strong>Nenhuma notícia encontrada</strong><span>Tente outro termo ou ajuste os filtros.</span></div>}</div></>}

          {view === "agents" && <EditorialAgents articles={articles} isAdmin={isAdmin} currentAuthor={currentAuthor} notify={notify} />}
          {view === "apiHub" && isAdmin && <ApiHubPanel isAdmin={isAdmin} />}\n          {view === "audit" && isAdmin && <Audit entries={auditEntries as AuditEntry[]} />}
          {view === "stats" && <Stats articles={articles} comments={comments} author={currentAuthor} isAdmin={isAdmin} authors={Array.from(new Set(articles.map((article) => article.author)))} viewEvents={analytics?.events ?? []} />}
          {view === "comments" && <Comments comments={isAdmin ? comments : comments.filter((comment) => articles.find((article) => article.id === comment.articleId)?.author === currentAuthor)} articles={articles} onChange={setComments} notify={notify} currentAuthor={currentAuthor} isAdmin={isAdmin} />}
          {view === "ads" && isAdmin && <Ads notify={notify} />}
          {view === "profile" && <ProfileEditor profile={profiles[slugify(currentAuthor)] || Object.values(profiles)[0]} onSave={saveProfile} onUpload={uploadProfilePhoto} notify={notify} />}
          {view === "media" && <MediaLibrary media={media} onUpload={uploadMedia} onDelete={(id) => { const nextMedia = media.filter((item) => item.id !== id); setMedia(nextMedia); persistMedia(nextMedia); notify("Imagem removida da galeria."); }} />}
          {view === "settings" && isAdmin && <AccessSettings users={accessUsers} onRoleChange={(openId, role) => setRole.mutate({ openId, role })} />}
        </main>
      </div>

      {previewArticle && <PreviewModal article={previewArticle} onClose={() => setPreviewArticle(null)} />}
      {mediaPickerOpen && <MediaPickerModal media={media} onClose={() => setMediaPickerOpen(false)} onSelect={insertMediaIntoDraft} />}
      {editorOpen && <div className="editor-overlay" role="dialog" aria-modal="true"><button className="overlay-dismiss" aria-label="Fechar editor" onClick={() => setEditorOpen(false)} /><aside className="editor-drawer"><div className="editor-header"><div><span className="admin-kicker">{editing ? "EDITAR NOTÍCIA" : "NOVA NOTÍCIA"}</span><h2>{editing ? "Refinar história" : "Começar uma história"}</h2><TolerajornalMark compact />{editing && <span className={"editor-autosave-state " + autosaveState}>{autosaveState === "saving" ? "Salvando…" : autosaveState === "saved" ? "Salvo no Supabase" : autosaveState === "error" ? "Falha ao salvar" : "Aguardando alterações"}</span>}</div><button className="close-editor" onClick={() => setEditorOpen(false)}><X size={18} /></button></div><form onSubmit={saveArticle} className="editor-form"><label>Título da notícia<input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} placeholder="Ex.: Região recebe novo espaço cultural" autoFocus /></label><div className="form-grid"><label>Editoria<select value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value })}>{EDITORIAL_CATEGORIES.map((category) => <option key={category}>{category}</option>)}</select></label><label>Autor<input value={draft.author} onChange={(event) => setDraft({ ...draft, author: event.target.value })} /></label></div><div className="editor-section-label">DISTRIBUIÇÃO EDITORIAL</div><div className="form-grid"><label>Abrangência<select value={draft.scope} onChange={(event) => setDraft({ ...draft, scope: event.target.value as NewsArticle["scope"] })}>{EDITORIAL_SCOPES.map((scope) => <option key={scope.id} value={scope.id}>{scope.label}</option>)}</select></label><label>Idioma<select value={draft.language} onChange={(event) => setDraft({ ...draft, language: event.target.value })}><option value="pt-BR">Português · Brasil</option><option value="en">English</option><option value="es">Español</option></select></label></div><div className="form-grid"><label>Região <span className="field-hint">opcional</span><input value={draft.region || ""} onChange={(event) => setDraft({ ...draft, region: event.target.value })} placeholder="Ex.: Sudeste" /></label><label>Estado <span className="field-hint">opcional</span><input value={draft.state || ""} onChange={(event) => setDraft({ ...draft, state: event.target.value })} placeholder="Ex.: SP" /></label></div><div className="form-grid"><label>País <span className="field-hint">opcional</span><input value={draft.country || ""} onChange={(event) => setDraft({ ...draft, country: event.target.value })} placeholder="Ex.: Brasil" /></label><label className="featured-toggle"><span>Destaque na capa</span><button type="button" role="switch" aria-checked={draft.featured} className={draft.featured ? "toggle-on" : ""} onClick={() => setDraft({ ...draft, featured: !draft.featured })}><i /></button><small>{draft.featured ? "Entra na seleção editorial da capa." : "Sem destaque especial."}</small></label></div><label>Resumo<textarea value={draft.summary} onChange={(event) => setDraft({ ...draft, summary: event.target.value })} placeholder="Uma linha para apresentar o contexto da notícia." rows={3} /></label><div className="editor-ai-actions"><button type="button" className="secondary-cta" onClick={runFullEditorialReview} disabled={reviewArticleRemote.isPending}><Sparkles size={15} /> {reviewArticleRemote.isPending ? "Revisando matéria…" : "Revisar matéria (inclui Liberdade Editorial)"}</button></div>{editorReview && <div className={"editor-review-result " + editorReview.status}><strong>{editorReview.status === "pass" ? "Revisão aprovada pelo fluxo automático" : editorReview.status === "review" ? "Revisão concluída — conferência humana necessária" : "Publicação bloqueada até corrigir os pontos abaixo"}</strong><div>{(editorReview.findings || []).map((finding: any, index: number) => { const code = finding.code || finding.ruleId || `finding-${index}`; const decision = findingDecisions[code] || "pending"; return <div className="editor-review-item" key={code + index}><b>{finding.severity.toUpperCase()}</b><span>{finding.message}</span>{finding.suggestion && <small>{finding.suggestion}</small>}<div className="finding-decision-actions"><button type="button" className={decision === "accepted" ? "active" : ""} onClick={() => { if (!editorReview.runId || !editing) return; findingDecision.mutate({ id: `${editorReview.runId}-${code}-${user?.openId || "user"}`, articleId: editing.id, agentRunId: editorReview.runId, findingCode: code, decision: "accepted" }, { onSuccess: () => setFindingDecisions((d) => ({ ...d, [code]: "accepted" })) }); }}>Aceitar</button><button type="button" className={decision === "rejected" ? "active" : ""} onClick={() => { if (!editorReview.runId || !editing) return; findingDecision.mutate({ id: `${editorReview.runId}-${code}-${user?.openId || "user"}`, articleId: editing.id, agentRunId: editorReview.runId, findingCode: code, decision: "rejected" }, { onSuccess: () => setFindingDecisions((d) => ({ ...d, [code]: "rejected" })) }); }}>Rejeitar</button><span>{decision === "pending" ? "Pendente" : decision === "accepted" ? "Aceito" : "Rejeitado"}</span></div></div>; })}</div></div>}{editorReview?.output?.researchContext && <div className="editor-review-result review"><strong>Contexto de pesquisa do API HUB</strong><div className="editor-review-item"><b>FONTES</b><span>{editorReview.output.researchContext.sources?.length || 0} fonte(s) externa(s) disponíveis para conferência.</span></div><div className="editor-review-item"><b>DADOS</b><span>{editorReview.output.researchContext.economic?.length || 0} série(s) econômica(s) · {editorReview.output.researchContext.chamber?.length || 0} registro(s) da Câmara · {editorReview.output.researchContext.weather ? "clima disponível" : "sem clima"}.</span></div>{(editorReview.output.researchContext.limitations || []).slice(0, 4).map((item: string, index: number) => <div className="editor-review-item" key={"research-limit-" + index}><b>INFO</b><span>{item}</span></div>)}</div>}{editorReview && (() => { const fr = editorReview.agentId === "liberdade-editorial" ? editorReview : (editorReview.output?.agents || []).find((a: any) => a.agentId === "liberdade-editorial"); return fr ? <FreedomReviewPanel report={fr.output} /> : null; })()}<ApiHubEditorialTools draftTitle={draft.title} draftCategory={draft.category} /><RichTextEditor value={draft.bodyHtml} onChange={(bodyHtml) => setDraft({ ...draft, bodyHtml })} onPickImage={() => setMediaPickerOpen(true)} />{editing && <section className="panel editor-history-panel"><div className="panel-heading"><div><span className="admin-kicker">VERSÕES</span><h3>Histórico recente</h3></div></div>{(articleHistory as any[]).slice(0,8).map((entry:any)=><div className="editor-history-row" key={entry.id}><strong>{entry.action}</strong><span>{entry.actorName}</span><time>{new Date(Number(entry.createdAtMs)).toLocaleString("pt-BR")}</time></div>)}</section>}<section className="seo-editor-panel"><div className="editor-section-label">SEO GOOGLE</div><p className="seo-helper">Campos preparados para Pesquisa Google, compartilhamento e dados estruturados. O agente SEO também analisa esta seção.</p><div className="form-grid"><label>Slug<input value={draft.slug || ""} onChange={(event) => setDraft({ ...draft, slug: event.target.value })} /></label><label>Palavra-chave foco<input value={draft.focusKeyword || ""} onChange={(event) => setDraft({ ...draft, focusKeyword: event.target.value })} placeholder="termo principal da matéria" /></label></div><label>Título SEO<input value={draft.seoTitle || ""} onChange={(event) => setDraft({ ...draft, seoTitle: event.target.value })} placeholder={draft.title} /></label><label>Meta description<textarea value={draft.metaDescription || ""} onChange={(event) => setDraft({ ...draft, metaDescription: event.target.value })} rows={3} placeholder={draft.summary} /></label><div className="form-grid"><label>URL canônica<input type="url" value={draft.canonicalUrl || ""} onChange={(event) => setDraft({ ...draft, canonicalUrl: event.target.value })} placeholder="https://pchnews.../materia/..." /></label><label>Alt da imagem<input value={draft.imageAlt || ""} onChange={(event) => setDraft({ ...draft, imageAlt: event.target.value })} placeholder="Descrição objetiva da imagem" /></label></div><div className="form-grid"><label>OG title<input value={draft.ogTitle || ""} onChange={(event) => setDraft({ ...draft, ogTitle: event.target.value })} /></label><label>OG description<input value={draft.ogDescription || ""} onChange={(event) => setDraft({ ...draft, ogDescription: event.target.value })} /></label></div><label className="seo-noindex"><input type="checkbox" checked={Boolean(draft.noindex)} onChange={(event) => setDraft({ ...draft, noindex: event.target.checked })} /> Não indexar esta matéria (noindex)</label></section><label>Tags <span className="field-hint">separe por vírgulas</span><input value={draft.tagsInput} onChange={(event) => setDraft({ ...draft, tagsInput: event.target.value })} placeholder="ex.: cultura, região oeste" /></label><div className="editor-section-label">DISTRIBUIÇÃO DIGITAL</div><div className="form-grid"><label>YouTube <span className="field-hint">opcional</span><input type="url" value={draft.youtubeUrl} onChange={(event) => setDraft({ ...draft, youtubeUrl: event.target.value })} placeholder="https://youtube.com/watch?v=..." /></label><label>Site / link externo <span className="field-hint">opcional</span><input type="url" value={draft.socialLinks.website} onChange={(event) => setDraft({ ...draft, socialLinks: { ...draft.socialLinks, website: event.target.value } })} placeholder="https://..." /></label></div><div className="form-grid"><label>Instagram<input type="url" value={draft.socialLinks.instagram} onChange={(event) => setDraft({ ...draft, socialLinks: { ...draft.socialLinks, instagram: event.target.value } })} placeholder="https://instagram.com/..." /></label><label>Facebook<input type="url" value={draft.socialLinks.facebook} onChange={(event) => setDraft({ ...draft, socialLinks: { ...draft.socialLinks, facebook: event.target.value } })} placeholder="https://facebook.com/..." /></label></div><div className="form-grid"><label>X / Twitter<input type="url" value={draft.socialLinks.x} onChange={(event) => setDraft({ ...draft, socialLinks: { ...draft.socialLinks, x: event.target.value } })} placeholder="https://x.com/..." /></label><label>LinkedIn<input type="url" value={draft.socialLinks.linkedin} onChange={(event) => setDraft({ ...draft, socialLinks: { ...draft.socialLinks, linkedin: event.target.value } })} placeholder="https://linkedin.com/..." /></label></div><label>TikTok<input type="url" value={draft.socialLinks.tiktok} onChange={(event) => setDraft({ ...draft, socialLinks: { ...draft.socialLinks, tiktok: event.target.value } })} placeholder="https://tiktok.com/@..." /></label><label>Imagem principal<span className="field-hint">A imagem escolhida aqui é a que será publicada na matéria.</span><input value={draft.image} onChange={(event) => setDraft({ ...draft, image: event.target.value })} placeholder="Cole a URL exata da imagem ou escolha na galeria" /></label>{draft.image.trim() ? <div className="image-preview"><img src={draft.image} alt="Prévia da imagem principal" /><span>Prévia da imagem que será publicada</span></div> : <div className="image-preview image-preview-empty"><ImagePlus size={20} /><span>Imagem ainda não selecionada. A publicação será bloqueada até escolher uma.</span></div>}<div className="form-grid schedule-grid"><label>Status<select value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value as ArticleStatus })}><option value="draft">Rascunho</option><option value="review">Enviar para revisão</option><option value="published">Publicado agora</option><option value="scheduled">Agendado</option></select></label><label className={draft.status !== "scheduled" ? "field-muted" : ""}>Data e hora da publicação<input type="datetime-local" value={draft.scheduledAt} onChange={(event) => setDraft({ ...draft, scheduledAt: event.target.value })} disabled={draft.status !== "scheduled"} /></label></div>{draft.status === "scheduled" && <div className="schedule-note"><span>◷</span><p>A notícia ficará como <strong>Agendada</strong> e será publicada automaticamente quando chegar o horário definido.</p></div>}<div className="editor-note"><span>i</span><p>O fluxo editorial já está estruturado para rascunho, revisão, agendamento e publicação. Nesta etapa, o conteúdo local é persistido neste navegador.</p></div><div className="editor-actions"><button type="button" className="preview-cta" onClick={openDraftPreview}><Eye size={15} /> Visualizar</button><button type="button" className="secondary-cta" onClick={() => setEditorOpen(false)}>Cancelar</button><button type="submit" className="primary-cta"><Check size={16} /> {editing ? "Salvar alterações" : "Salvar notícia"}</button></div></form></aside></div>}
      {toast && <div className="admin-toast"><span><Check size={14} /></span>{toast}</div>}
    </div>
  );
}

function MetricCard({ label, value, delta, icon: Icon, accent }: { label: string; value: string; delta: string; icon: typeof BarChart3; accent: string }) {
  return <div className="metric-card"><div className={`metric-icon ${accent}`}><Icon size={18} /></div><span>{label}</span><strong>{value}</strong><small className={accent === "green" ? "positive" : ""}>{delta}</small></div>;
}

function ArrowIcon() { return <span className="arrow-icon">↗</span>; }

function PreviewModal({ article, onClose }: { article: NewsArticle; onClose: () => void }) {
  const [device, setDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
  return <div className="preview-overlay" role="dialog" aria-modal="true" aria-label="Prévia da notícia"><button className="overlay-dismiss" aria-label="Fechar prévia" onClick={onClose} /><section className={`preview-window preview-${device}`}><div className="preview-topbar"><div className="preview-label"><span className="preview-live-dot" /> PRÉVIA DO SITE <small>Não publicada</small></div><div className="preview-devices" role="group" aria-label="Tamanho da prévia"><button className={device === "desktop" ? "active" : ""} onClick={() => setDevice("desktop")} aria-label="Prévia desktop"><Monitor size={15} /> Desktop</button><button className={device === "tablet" ? "active" : ""} onClick={() => setDevice("tablet")} aria-label="Prévia tablet"><Tablet size={15} /> Tablet</button><button className={device === "mobile" ? "active" : ""} onClick={() => setDevice("mobile")} aria-label="Prévia mobile"><Smartphone size={15} /> Mobile</button></div><button className="close-editor" onClick={onClose} aria-label="Fechar prévia"><X size={18} /></button></div><div className="preview-browser-bar"><span className="preview-url">pchnews.hostingpress.com.br / matéria / {article.id}</span><span>VISUALIZAÇÃO EDITORIAL</span></div><article className="preview-article"><div className="preview-site-brand"><div className="brand-mark">PCH<small>NEWS</small></div><span>Jornalismo local, pensamento amplo.</span></div><div className="preview-article-content"><span className="preview-category">{article.category}</span><h1>{article.title}</h1><p className="preview-deck">{article.summary}</p><div className="preview-meta">Por <strong>{article.author}</strong><span>•</span>{article.date}</div><img className="preview-hero" src={article.image} alt="" /><div className="preview-body" dangerouslySetInnerHTML={{ __html: article.bodyHtml || `<p>${article.summary}</p>` }} /></div></article></section></div>;
}

function RichTextEditor({ value, onChange, onPickImage }: { value: string; onChange: (value: string) => void; onPickImage: () => void }) {
  const run = (command: string, argument?: string) => { document.execCommand(command, false, argument); const editor = document.querySelector('[contenteditable="true"]') as HTMLElement | null; if (editor) onChange(editor.innerHTML); };
  return <div className="rich-editor-field"><label>Corpo da notícia</label><div className="rich-toolbar" role="toolbar" aria-label="Formatação do texto"><button type="button" onClick={() => run("undo")} aria-label="Desfazer"><Undo2 size={14} /></button><button type="button" onClick={() => run("redo")} aria-label="Refazer"><Redo2 size={14} /></button><span /><button type="button" onClick={() => run("bold")} aria-label="Negrito"><Bold size={14} /></button><button type="button" onClick={() => run("italic")} aria-label="Itálico"><Italic size={14} /></button><button type="button" onClick={() => run("underline")} aria-label="Sublinhado"><Underline size={14} /></button><span /><button type="button" onClick={() => run("formatBlock", "<h3>")} aria-label="Título">H3</button><button type="button" onClick={() => run("formatBlock", "<blockquote>")} aria-label="Citação"><Quote size={14} /></button><button type="button" onClick={() => run("insertUnorderedList")} aria-label="Lista"><List size={14} /></button><button type="button" onClick={() => run("insertOrderedList")} aria-label="Lista numerada"><ListOrdered size={14} /></button><button type="button" onClick={() => { const url = window.prompt("URL do link"); if (url) run("createLink", url); }} aria-label="Inserir link"><LinkIcon size={14} /></button><button type="button" onClick={onPickImage} aria-label="Inserir imagem da galeria"><ImagePlus size={14} /></button></div><div className="rich-editor" contentEditable suppressContentEditableWarning onInput={(event) => onChange(event.currentTarget.innerHTML)} dangerouslySetInnerHTML={{ __html: value }} /></div>;
}

function formatSchedule(value?: string) {
  if (!value) return "horário não definido";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

function AccessSettings({ users, onRoleChange }: { users: AccessUser[]; onRoleChange: (openId: string, role: AccessUser["role"]) => void }) {
  return <div className="columnist-settings"><div className="admin-heading compact"><div><span className="admin-kicker">CONTROLE DE ACESSO</span><h1>Equipe<span>.</span></h1><p>As contas são autenticadas pelo OAuth oficial e os papéis ficam persistidos no banco.</p></div><span className="team-count"><Users size={16} /> {users.filter((person) => person.role === "columnist").length} colunistas</span></div><section className="panel team-panel"><div className="panel-heading"><div><span className="admin-kicker">USUÁRIOS AUTENTICADOS</span><h2>Administradores e colunistas</h2></div></div>{users.length === 0 ? <div className="media-empty"><Users size={28} /><strong>Nenhuma conta sincronizada ainda</strong><span>Quando alguém entrar com OAuth, aparecerá nesta lista.</span></div> : <div className="columnist-list">{users.map((person) => <div className="columnist-row" key={person.openId}><div className="columnist-avatar">{(person.name || person.email || "U").split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase()}</div><div className="columnist-copy"><strong>{person.name || "Sem nome"}</strong><small>{person.email || person.openId}</small><span>Último acesso: {new Date(person.lastSignedIn).toLocaleString("pt-BR")}</span></div><select className="role-select" value={person.role} onChange={(event) => onRoleChange(person.openId, event.target.value as AccessUser["role"])}><option value="user">Leitor</option><option value="columnist">Colunista</option><option value="admin">Administrador</option></select></div>)}</div>}<p className="editor-note">Leitor: sem acesso ao painel. Colunista: pode criar, editar e responder nas próprias publicações. Administrador: gerencia toda a redação e os acessos.</p></section><InvitePanel /></div>;
}
function InvitePanel() { const [email, setEmail] = useState(""); const [name, setName] = useState(""); const [lastUrl, setLastUrl] = useState(""); const [delivery, setDelivery] = useState(""); const { data: invites = [], refetch } = trpc.invites.list.useQuery(); const create = trpc.invites.create.useMutation({ onSuccess: (invite) => { refetch(); setEmail(""); setName(""); setLastUrl(`${window.location.origin}${invite.inviteUrl}`); setDelivery(invite.emailSent ? "E-mail enviado pelo SMTP." : invite.smtpConfigured ? "Convite criado, mas o SMTP não confirmou o envio." : "Convite criado. Configure SMTP_HOST, SMTP_USER, SMTP_PASS e SMTP_FROM para envio automático."); } }); const resend = trpc.invites.resend.useMutation({ onSuccess: (result) => { refetch(); setDelivery(result.emailSent ? "Convite reenviado pelo SMTP. A validade foi renovada por 7 dias." : result.smtpConfigured ? "Token renovado, mas o SMTP não confirmou o envio." : "Token renovado. Configure o SMTP para enviar automaticamente."); }, onError: (error) => setDelivery(error.message) }); const revoke = trpc.invites.revoke.useMutation({ onSuccess: () => refetch() }); const submit = (event: FormEvent) => { event.preventDefault(); create.mutate({ email, name }); }; return <section className="panel invite-panel"><div className="panel-heading"><div><span className="admin-kicker">NOVO ACESSO</span><h2>Convidar colunista</h2></div><Mail size={19} /></div><p className="invite-intro">O convite é salvo com token protegido, expira em 7 dias e pode ser enviado automaticamente pelo SMTP configurado no ambiente.</p><form className="invite-form" onSubmit={submit}><label>Nome completo<input value={name} onChange={(event) => setName(event.target.value)} placeholder="Ex.: Ana Souza" required /></label><label>E-mail institucional<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="ana@exemplo.com" required /></label><button className="primary-cta" type="submit" disabled={create.isPending}><Mail size={15} /> {create.isPending ? "Enviando…" : "Enviar convite"}</button></form>{delivery && <p className="invite-delivery">{delivery}</p>}{lastUrl && <div className="invite-result"><span>Link de contingência</span><input readOnly value={lastUrl} /><button onClick={() => navigator.clipboard?.writeText(lastUrl)}><Copy size={14} /> Copiar</button><button onClick={() => { window.location.href = `mailto:?subject=Convite PCH News&body=${encodeURIComponent(`Você foi convidado para ser colunista do PCH News: ${lastUrl}`)}`; }}><Mail size={14} /> Abrir e-mail</button></div>}<div className="invite-list">{invites.slice(0, 8).map((invite) => { const pending = !invite.acceptedAtMs && !invite.revokedAtMs && invite.expiresAtMs >= Date.now(); return <div key={invite.id}><span><strong>{invite.name}</strong><small>{invite.email}</small></span><span className="invite-state"><em className={invite.acceptedAtMs ? "accepted" : invite.revokedAtMs ? "revoked" : invite.expiresAtMs < Date.now() ? "expired" : "pending"}>{invite.acceptedAtMs ? "Aceito" : invite.revokedAtMs ? "Revogado" : invite.expiresAtMs < Date.now() ? "Expirado" : "Pendente"}</em>{pending && <><button disabled={resend.isPending} onClick={() => resend.mutate({ id: invite.id })}>{resend.isPending ? "Reenviando…" : "Reenviar"}</button><button onClick={() => revoke.mutate({ id: invite.id })}>Revogar</button></>}</span></div>; })}</div></section>; }

function ProfileEditor({ profile, onSave, onUpload, notify }: { profile: ProfileData; onSave: (profile: ProfileData) => void; onUpload: (file: File, setUrl: (url: string) => void) => void; notify: (message: string) => void }) {
  const [draft, setDraft] = useState(profile);
  useEffect(() => setDraft(profile), [profile]);
  const update = (key: keyof ProfileData, value: string) => setDraft((current) => ({ ...current, [key]: value }));
  const upload = (event: React.ChangeEvent<HTMLInputElement>) => { const file = event.target.files?.[0]; if (!file || !file.type.startsWith("image/")) { notify("Escolha uma imagem válida."); return; } onUpload(file, (url) => update("photo", url)); };
  return <div className="profile-editor-page"><div className="admin-heading compact"><div><span className="admin-kicker">IDENTIDADE EDITORIAL</span><h1>Meu perfil<span>.</span></h1><p>Atualize como os leitores conhecem seu trabalho no PCH News.</p></div><div className="profile-edit-preview"><img src={draft.photo} alt="" /><span>{draft.name}</span></div></div><div className="profile-edit-layout"><section className="panel profile-edit-card"><div className="panel-heading"><div><span className="admin-kicker">APRESENTAÇÃO</span><h2>Informações públicas</h2></div></div><label>Nome<input value={draft.name} onChange={(e) => update("name", e.target.value)} /></label><label>Área de atuação<input value={draft.beat} onChange={(e) => update("beat", e.target.value)} /></label><label>Biografia<textarea value={draft.bio} onChange={(e) => update("bio", e.target.value)} rows={5} placeholder="Conte brevemente sobre seu trabalho" /></label><label>Foto de perfil<input type="file" accept="image/*" onChange={upload} /></label><button className="primary-cta" onClick={() => onSave(draft)}><Check size={15} /> Salvar perfil</button></section><section className="panel profile-edit-card"><div className="panel-heading"><div><span className="admin-kicker">CANAIS</span><h2>Redes sociais</h2></div></div><label>Instagram<input value={draft.instagram} onChange={(e) => update("instagram", e.target.value)} placeholder="@seuperfil" /></label><label>Facebook<input value={draft.facebook} onChange={(e) => update("facebook", e.target.value)} placeholder="seu.perfil" /></label><label>X / Twitter<input value={draft.x} onChange={(e) => update("x", e.target.value)} placeholder="@seuperfil" /></label><label>LinkedIn<input value={draft.linkedin} onChange={(e) => update("linkedin", e.target.value)} placeholder="seu-perfil" /></label><p className="editor-note">Os links aparecem no seu perfil público e abrem em uma nova aba.</p></section></div></div>;
}

function MediaLibrary({ media, onUpload, onDelete }: { media: MediaAsset[]; onUpload: (event: React.ChangeEvent<HTMLInputElement>) => void; onDelete: (id: string) => void }) {
  return <div className="media-library"><div className="admin-heading compact"><div><span className="admin-kicker">BIBLIOTECA DE MÍDIA</span><h1>Imagens<span>.</span></h1><p>Faça upload e reutilize imagens diretamente nas suas notícias.</p></div><label className="primary-cta upload-label"><Upload size={16} /> Adicionar imagem<input type="file" accept="image/*" onChange={onUpload} /></label></div>{media.length === 0 ? <div className="panel media-empty"><ImagePlus size={28} /><strong>Sua galeria está vazia</strong><span>Adicione a primeira imagem para usar no editor.</span></div> : <div className="media-grid">{media.map((asset) => <div className="media-card" key={asset.id}><img src={asset.src} alt={asset.name} /><div className="media-card-info"><strong title={asset.name}>{asset.name}</strong><small>{asset.size} · {asset.createdAt}</small><button onClick={() => onDelete(asset.id)}><Trash2 size={13} /> Remover</button></div></div>)}</div>}</div>;
}

function MediaPickerModal({ media, onClose, onSelect }: { media: MediaAsset[]; onClose: () => void; onSelect: (asset: MediaAsset) => void }) {
  return <div className="media-picker-overlay"><button className="overlay-dismiss" onClick={onClose} aria-label="Fechar galeria" /><section className="media-picker"><div className="editor-header"><div><span className="admin-kicker">GALERIA DE MÍDIA</span><h2>Inserir imagem</h2></div><button className="close-editor" onClick={onClose}><X size={18} /></button></div>{media.length === 0 ? <div className="media-empty compact-empty"><ImagePlus size={23} /><span>Adicione imagens pela aba Mídia primeiro.</span></div> : <div className="picker-grid">{media.map((asset) => <button key={asset.id} onClick={() => onSelect(asset)}><img src={asset.src} alt={asset.name} /><span>{asset.name}</span></button>)}</div>}</section></div>;
}

function PlaceholderView({ icon: Icon, title, description, action, onAction }: { icon: typeof Settings; title: string; description: string; action: string; onAction: () => void }) {
  return <div className="placeholder-view"><div className="placeholder-icon"><Icon size={28} /></div><span className="admin-kicker">EM CONSTRUÇÃO</span><h1>{title}<span>.</span></h1><p>{description}</p><button className="primary-cta" onClick={onAction}><Plus size={17} /> {action}</button></div>;
}

export function resetDemoData() {
  persistArticles(INITIAL_ARTICLES);
}
