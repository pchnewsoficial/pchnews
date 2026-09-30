import { FreedomReviewPanel, PchNewsFreedomMark } from "@/components/FreedomReviewPanel";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Archive, BarChart3, Bell, Check, CheckCircle2, ChevronDown, Copy, Edit3, History, Eye, ExternalLink, FileText, FolderOpen, ImagePlus, LayoutDashboard, CalendarDays, LogOut, Mail, Menu, MoreHorizontal, PanelLeft, PanelLeftClose, PanelRight, PanelRightClose, Pencil, Plus, Search, Settings, Smartphone, Tablet, Monitor, Bold, Italic, Underline, List, ListOrdered, Link as LinkIcon, Quote, Undo2, Redo2, Trash2, Upload, UserPlus, Users, X, MessageCircle, Megaphone, UserCircle, Sparkles } from "lucide-react";
import { Link, useLocation } from "wouter";
import { ProfileData, ReaderComment } from "@/lib/editorial";
import Ads from "./Ads";
import Audit, { AuditEntry } from "./Audit";
import Comments from "./Comments";
import Stats from "./Stats";
import { EDITORIAL_AGENTS } from "./EditorialAgents";
import EditorialCommandCenter from "./EditorialCommandCenter";
import ApiHubPanel from "@/components/ApiHubPanel";
import EditorialSubthemesAdmin from "@/components/EditorialSubthemesAdmin";
import { ArticleStatus, EDITORIAL_CATEGORIES, EDITORIAL_SCOPES, EDITORIAL_CONTENT_TYPES, EDITORIAL_CHECKLIST_DEFAULT, EDITORIAL_CHECKLIST_LABELS, MediaAsset, NewsArticle, makeArticleId, statusLabels } from "@/lib/news";

type View = "overview" | "articles" | "media" | "settings" | "team" | "profile" | "comments" | "ads" | "stats" | "audit" | "apiHub" | "hostingPress" | "events" | "editorialRequests" | "subthemes";
type AccessUser = { id: number; openId: string; name: string | null; email: string | null; role: "user" | "admin" | "editor" | "journalist" | "columnist" | "reviewer"; lastSignedIn: Date };
import officialLogoUrl from "@/assets/pch-news-official-current.svg";
const LOGO_URL = officialLogoUrl;
const slugify = (value: string) => value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

type Draft = Pick<NewsArticle, "title" | "category" | "author" | "summary" | "editionNumber" | "authorProfileSlug" | "image" | "status" | "bodyHtml" | "scope" | "region" | "state" | "country" | "language" | "featured" | "slug" | "seoTitle" | "metaDescription" | "canonicalUrl" | "focusKeyword" | "ogTitle" | "ogDescription" | "imageAlt" | "noindex"> & { contentType: NonNullable<NewsArticle["contentType"]>; editorialChecklist: NonNullable<NewsArticle["editorialChecklist"]>; editorialNotes: string; contraponto: string; keyTakeaway: string; scheduledAt: string; tagsInput: string; youtubeUrl: string; socialLinks: { instagram: string; facebook: string; x: string; linkedin: string; youtube: string; tiktok: string; website: string } };

const blankDraft: Draft = { title: "", contentType: "noticia", editionNumber: null, authorProfileSlug: null, editorialChecklist: { ...EDITORIAL_CHECKLIST_DEFAULT }, editorialNotes: "", contraponto: "", keyTakeaway: "", category: "Brasil", author: "Redação PCH News", summary: "", slug: "", seoTitle: "", metaDescription: "", canonicalUrl: "", focusKeyword: "", ogTitle: "", ogDescription: "", imageAlt: "", noindex: false, scope: "national", region: "", state: "", country: "Brasil", language: "pt-BR", featured: false, image: "", status: "draft", bodyHtml: "<p>Comece a escrever o corpo da notícia...</p>", scheduledAt: "", tagsInput: "", youtubeUrl: "", socialLinks: { instagram: "", facebook: "", x: "", linkedin: "", youtube: "", tiktok: "", website: "" } };

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

function EditorFieldHelp({ children }: { children: React.ReactNode }) {
  return <small className="editor-field-help">{children}</small>;
}

function EventsAdmin({ notify }: { notify: (message: string) => void }) {
  const { data: events = [], refetch, isLoading } = trpc.events.adminList.useQuery(undefined, { retry: false });
  const setStatus = trpc.events.setStatus.useMutation({ onSuccess: () => { void refetch(); notify("Status do evento atualizado."); }, onError: (error) => notify(error.message) });
  const updateEvent = trpc.events.update.useMutation({ onSuccess: () => { void refetch(); setEditing(null); notify("Evento atualizado."); }, onError: (error) => notify(error.message) });
  const [editing, setEditing] = useState<any>(null);
  const labels: Record<string,string> = { pending:"Pendente", approved:"Aprovado", rejected:"Rejeitado", cancelled:"Cancelado" };
  const editDraft = editing ? {
    ...editing,
    startAt: new Date(Number(editing.startAtMs)).toISOString().slice(0,16),
    endAt: editing.endAtMs ? new Date(Number(editing.endAtMs)).toISOString().slice(0,16) : "",
  } : null;
  const save = (event: FormEvent) => {
    event.preventDefault();
    if (!editDraft) return;
    updateEvent.mutate({
      id: editDraft.id,
      title: editDraft.title,
      description: editDraft.description,
      eventType: editDraft.eventType,
      organizer: editDraft.organizer,
      contact: editDraft.contact,
      startAtMs: new Date(editDraft.startAt).getTime(),
      endAtMs: editDraft.endAt ? new Date(editDraft.endAt).getTime() : null,
      venue: editDraft.venue,
      address: editDraft.address,
      city: editDraft.city,
      state: editDraft.state,
      country: editDraft.country || "Brasil",
      latitude: editDraft.latitude || null,
      longitude: editDraft.longitude || null,
      image: editDraft.image || null,
      website: editDraft.website || null,
      price: editDraft.price || null,
      visibilityScope: editDraft.visibilityScope || "national",
      visibilityRegion: editDraft.visibilityRegion || null,
      visibilityState: editDraft.visibilityState || editDraft.state || null,
      visibilitySubregion: editDraft.visibilitySubregion || null,
      visibilityCity: editDraft.visibilityCity || editDraft.city || null,
    });
  };
  return <section className="panel events-admin-panel">
    <div className="admin-heading compact"><div><span className="admin-kicker">AGENDA PCH NEWS</span><h1>Eventos<span>.</span></h1><p>Gerencie, edite, modere e retire eventos da agenda pública.</p></div><Link className="secondary-cta" href="/agenda"><ExternalLink size={15}/> Ver agenda compartilhável</Link></div>
    {isLoading ? <div className="events-empty">Carregando eventos…</div> : events.length === 0 ? <div className="events-empty"><CalendarDays size={28}/><h2>Nenhum evento recebido</h2><p>Quando alguém enviar um evento, ele aparecerá aqui para validação.</p></div> :
      <div className="events-admin-list">{events.map((event:any) => <article className="events-admin-row" key={event.id}>
        <div><span className="event-type">{event.eventType}</span><h3>{event.title}</h3><p>{event.description}</p><small>{event.organizer} · {event.city}/{event.state} · {new Date(Number(event.startAtMs)).toLocaleString("pt-BR")}</small></div>
        <div className="events-admin-meta"><span className={`event-status status-${event.status}`}>{labels[event.status] || event.status}</span><div className="events-admin-actions">
          <button className="ghost-button" onClick={() => setEditing(event)}><Edit3 size={14}/> Editar</button>
          {event.status !== "approved" && event.status !== "cancelled" && <button className="primary-cta" disabled={setStatus.isPending} onClick={() => setStatus.mutate({id:event.id,status:"approved"})}>Aprovar</button>}
          {event.status !== "rejected" && event.status !== "cancelled" && <button className="secondary-cta" disabled={setStatus.isPending} onClick={() => setStatus.mutate({id:event.id,status:"rejected"})}>Rejeitar</button>}
          {event.status === "approved" && <button className="ghost-button" disabled={setStatus.isPending} onClick={() => setStatus.mutate({id:event.id,status:"cancelled"})}>Cancelar</button>}
          {event.status !== "cancelled" && <button className="ghost-button" disabled={setStatus.isPending} onClick={() => { if (window.confirm(`Retirar “${event.title}” da agenda pública?`)) setStatus.mutate({id:event.id,status:"cancelled"}); }}><Archive size={14}/> Excluir</button>}
        </div></div>
      </article>)}</div>}
    {editing&&<div className="event-modal"><button className="event-modal-close" onClick={() => setEditing(null)}><X/></button><form onSubmit={save} className="event-form"><span className="eyebrow">EDITOR DA AGENDA</span><h2>Editar evento</h2><label>Nome do evento<input required value={editDraft.title} onChange={e=>setEditing({...editDraft,title:e.target.value})}/></label><label>Descrição<textarea required rows={4} value={editDraft.description} onChange={e=>setEditing({...editDraft,description:e.target.value})}/></label><div className="form-grid"><label>Tipo<input required value={editDraft.eventType} onChange={e=>setEditing({...editDraft,eventType:e.target.value})}/></label><label>Organizador<input required value={editDraft.organizer} onChange={e=>setEditing({...editDraft,organizer:e.target.value})}/></label></div><div className="form-grid"><label>Início<input required type="datetime-local" value={editDraft.startAt} onChange={e=>setEditing({...editDraft,startAt:e.target.value})}/></label><label>Fim<input type="datetime-local" value={editDraft.endAt} onChange={e=>setEditing({...editDraft,endAt:e.target.value})}/></label></div><div className="form-grid"><label>Local<input required value={editDraft.venue} onChange={e=>setEditing({...editDraft,venue:e.target.value})}/></label><label>Cidade<input required value={editDraft.city} onChange={e=>setEditing({...editDraft,city:e.target.value})}/></label></div><div className="form-grid"><label>Estado<input required value={editDraft.state} onChange={e=>setEditing({...editDraft,state:e.target.value})}/></label><label>Contato<input required value={editDraft.contact} onChange={e=>setEditing({...editDraft,contact:e.target.value})}/></label></div><label>Endereço<input required value={editDraft.address} onChange={e=>setEditing({...editDraft,address:e.target.value})}/></label><div className="editor-actions"><button type="button" className="secondary-cta" onClick={()=>setEditing(null)}>Cancelar</button><button type="submit" className="primary-cta" disabled={updateEvent.isPending}>Salvar alterações</button></div></form></div>}
  </section>;
}

export default function Admin() {
  // Editorial content is loaded from Supabase; browser storage is not a CMS fallback.
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [view, setView] = useState<View>("articles");
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
  const [editorLeftOpen, setEditorLeftOpen] = useState(true);
  const [editorAgentsOpen, setEditorAgentsOpen] = useState(true);
  const [media, setMedia] = useState<MediaAsset[]>([]);
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const [comments, setComments] = useState<ReaderComment[]>([]);
  const [profiles, setProfiles] = useState<Record<string, ProfileData>>({});
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(() => new Date());
  useEffect(() => {
    const timer = window.setInterval(() => setCurrentTime(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const { user, logout: oauthLogout } = useAuth();
  const currentRole = user?.role || "user";
  const currentAuthor = user?.name || "Colunista";
  const roleLabels: Record<AccessUser["role"], string> = { user: "Usuário", admin: "Administrador", editor: "Editor", journalist: "Jornalista", columnist: "Colunista", reviewer: "Revisor" };
  const displayName = user?.name || "Redação PCH News";
  useEffect(() => {
    if (!user || !["columnist", "journalist"].includes(user.role)) return;
    const key = `pch_onboarding_editorial_v1:${user.openId || user.email || user.role}`;
    if (localStorage.getItem(key) !== "done") setOnboardingOpen(true);
  }, [user]);
  const displayInitials = getInitials(displayName);
  useEffect(() => {
    if (editorOpen) {
      setEditorLeftOpen(true);
      setEditorAgentsOpen(true);
    }
  }, [editorOpen]);
  const { data: editorialRemote, refetch: refetchEditorial } = trpc.editorial.bootstrap.useQuery(undefined, { enabled: Boolean(user), retry: false, refetchInterval: 5000, refetchIntervalInBackground: true });
  const adRequests = editorialRemote?.adRequests ?? [];
  const pendingComments = comments.filter((comment) => comment.status === "pending").length;
  const pendingAdRequests = adRequests.filter((request: any) => request.status === "received" || request.status === "reviewing").length;
  const pendingTasks = pendingComments + pendingAdRequests;
  const isAdmin = currentRole === "admin";
  const { data: editorialAgentAccess } = trpc.editorialAgents.access.useQuery(undefined, { enabled: Boolean(user), retry: false });
  const { data: personalInvitation } = trpc.invitation.useQuery(undefined, { enabled: Boolean(user), retry: false });
  const canUseEditorialAgents = isAdmin || Boolean(editorialAgentAccess?.enabled);
  const canManageAgenda = isAdmin || currentRole === "editor";
  const { data: analytics } = trpc.editorial.analytics.useQuery({ author: undefined, authorOpenId: undefined }, { enabled: Boolean(user), retry: false, refetchInterval: 5000, refetchIntervalInBackground: true });
  const { data: adminCampaigns = [] } = trpc.ads.list.useQuery(undefined, { enabled: isAdmin, retry: false, refetchInterval: 15000, refetchIntervalInBackground: true });
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
  const mediaDelete = trpc.media.delete.useMutation({ onSuccess: () => { void mediaList.refetch(); notify("Mídia removida do armazenamento."); }, onError: (error) => notify(error.message) });
  const canManageArticle = (article: NewsArticle) => isAdmin || currentRole === "editor" || ((currentRole === "journalist" || currentRole === "columnist") && ((Boolean(article.authorOpenId) && article.authorOpenId === user?.openId) || article.author === currentAuthor));
  const [, navigate] = useLocation();

  const saveProfile = (profile: ProfileData) => { const next = { ...profiles, [profile.slug]: profile }; setProfiles(next); profileSave.mutate(profile, { onSuccess: () => notify("Perfil atualizado e publicado no banco."), onError: (error) => { notify(error.message || "Não foi possível salvar o perfil agora."); } }); };
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
      scheduledAt: article.scheduledAt ? (() => { const d = new Date(Number(article.scheduledAt)); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16); })() : undefined,
    });
    setArticles((editorialRemote.articles || []).map(mapArticle));
    setComments((editorialRemote.comments || []).map((comment: any) => ({
      ...comment,
      createdAt: comment.createdAt || new Date(Number(comment.createdAtMs || Date.now())).toLocaleString("pt-BR"),
      repliedAt: comment.repliedAt || (comment.repliedAtMs ? new Date(Number(comment.repliedAtMs)).toLocaleString("pt-BR") : undefined),
    })));
    setProfiles(Object.fromEntries((editorialRemote.profiles || []).map((profile: any) => [profile.slug, { ...profile, productsJson: typeof profile.productsJson === "string" ? profile.productsJson : JSON.stringify(profile.productsJson || []) }])));
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
  const syncPilulas = trpc.pilulas.sync.useMutation({ onSuccess: (result) => { void refetchEditorial(); notify(`Acervo de Pílulas importado: ${result.count} item(ns).`); }, onError: (error) => notify(error.message) });

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
    setDraft({ contentType: article.contentType || "noticia", editionNumber: article.editionNumber ?? null, authorProfileSlug: article.authorProfileSlug ?? null, editorialChecklist: { ...EDITORIAL_CHECKLIST_DEFAULT, ...(article.editorialChecklist || {}) }, editorialNotes: article.editorialNotes || "", contraponto: article.contraponto || "", keyTakeaway: article.keyTakeaway || "", title: article.title, category: article.category, author: article.author, summary: article.summary, slug: article.slug || slugify(article.title), seoTitle: article.seoTitle || article.title, metaDescription: article.metaDescription || article.summary, canonicalUrl: article.canonicalUrl || "", focusKeyword: article.focusKeyword || "", ogTitle: article.ogTitle || article.title, ogDescription: article.ogDescription || article.summary, imageAlt: article.imageAlt || article.title, noindex: Boolean(article.noindex), image: article.image, status: article.status, bodyHtml: article.bodyHtml || `<p>${article.summary}</p>`, scheduledAt: article.scheduledAt || "", youtubeUrl: article.youtubeUrl || "", socialLinks: { instagram: article.socialLinks?.instagram || "", facebook: article.socialLinks?.facebook || "", x: article.socialLinks?.x || "", linkedin: article.socialLinks?.linkedin || "", youtube: article.socialLinks?.youtube || "", tiktok: article.socialLinks?.tiktok || "", website: article.socialLinks?.website || "" }, tagsInput: (article.tags || []).join(", "), scope: article.scope || "national", region: article.region || "", state: article.state || "", country: article.country || (article.scope === "international" ? "" : "Brasil"), language: article.language || "pt-BR", featured: Boolean(article.featured) });
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
          contentType: draft.contentType, editionNumber: draft.editionNumber || null, authorProfileSlug: draft.authorProfileSlug || null, editorialChecklist: draft.editorialChecklist, editorialNotes: draft.editorialNotes || null, contraponto: draft.contraponto || null, keyTakeaway: draft.keyTakeaway || null,
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

  const runEditorAgent = async (agentId: (typeof EDITORIAL_AGENTS)[number]["id"]) => {
    if (!canUseEditorialAgents) { notify("Os Agentes Editoriais não estão liberados para este perfil."); return; }
    const articleId = editing?.id || "draft-preview";
    try {
      const result = await reviewArticleRemote.mutateAsync({
        articleId,
        agentId,
        article: {
          id: articleId,
          title: draft.title,
          category: draft.category,
          author: draft.author,
          summary: draft.summary,
          bodyHtml: draft.bodyHtml,
          image: draft.image,
          tags: JSON.stringify(draft.tagsInput.split(",").map((tag) => tag.trim()).filter(Boolean)),
          status: draft.status,
          scheduledAt: draft.scheduledAt ? new Date(draft.scheduledAt).getTime() : null,
          region: draft.region || null,
          state: draft.state || null,
          country: draft.country || null,
        },
      });
      setEditorReview(result);
      notify(`Agente “${EDITORIAL_AGENTS.find((agent) => agent.id === agentId)?.name || agentId}” executado.`);
    } catch (error) {
      notify(error instanceof Error ? error.message : "Não foi possível executar o agente.");
    }
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
    if ((draft.status === "published" || draft.status === "scheduled") && !(editing && (editing.status === "published" || editing.status === "scheduled")) && !Object.values(draft.editorialChecklist || {}).every(Boolean)) { notify("Publicação bloqueada: complete o checklist editorial do Manual PCH News."); return; }
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
      await saveArticleRemote.mutateAsync({ id: savedArticle.id, title: savedArticle.title, category: savedArticle.category, author: savedArticle.author, authorOpenId: savedArticle.authorOpenId ?? user?.openId ?? null, summary: savedArticle.summary, date: savedArticle.date, updated: savedArticle.updated, status: remoteStatus, views: savedArticle.views, image: savedArticle.image, bodyHtml: savedArticle.bodyHtml, scheduledAt: savedArticle.scheduledAt ? new Date(savedArticle.scheduledAt).getTime() : null, tags: JSON.stringify(savedArticle.tags || []), slug: savedArticle.slug || slugify(savedArticle.title), seoTitle: savedArticle.seoTitle || savedArticle.title, metaDescription: savedArticle.metaDescription || savedArticle.summary, canonicalUrl: savedArticle.canonicalUrl || null, focusKeyword: savedArticle.focusKeyword || null, ogTitle: savedArticle.ogTitle || savedArticle.title, ogDescription: savedArticle.ogDescription || savedArticle.summary, imageAlt: savedArticle.imageAlt || savedArticle.title, noindex: Boolean(savedArticle.noindex), youtubeUrl: savedArticle.youtubeUrl || null, socialLinks: JSON.stringify(savedArticle.socialLinks || {}), scope: savedArticle.scope || "national", region: savedArticle.region || null, state: savedArticle.state || null, country: savedArticle.country || "Brasil", language: savedArticle.language || "pt-BR", featured: Boolean(savedArticle.featured), sourceUrl: savedArticle.sourceUrl || null, sourceName: savedArticle.sourceName || null, contentType: savedArticle.contentType || "noticia", editorialChecklist: savedArticle.editorialChecklist || EDITORIAL_CHECKLIST_DEFAULT, editorialNotes: savedArticle.editorialNotes || null, contraponto: savedArticle.contraponto || null, keyTakeaway: savedArticle.keyTakeaway || null });
      setArticles(nextArticles);
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
    saveArticleRemote.mutate({ id: updatedArticle.id, title: updatedArticle.title, category: updatedArticle.category, author: updatedArticle.author, authorOpenId: updatedArticle.authorOpenId ?? null, summary: updatedArticle.summary, date: updatedArticle.date, updated: updatedArticle.updated, status: remoteStatus, views: updatedArticle.views, image: updatedArticle.image, bodyHtml: updatedArticle.bodyHtml, scheduledAt: updatedArticle.scheduledAt ? new Date(updatedArticle.scheduledAt).getTime() : null, tags: JSON.stringify(updatedArticle.tags || []), youtubeUrl: updatedArticle.youtubeUrl || null, socialLinks: JSON.stringify(updatedArticle.socialLinks || {}), scope: updatedArticle.scope || "national", region: updatedArticle.region || null, state: updatedArticle.state || null, country: updatedArticle.country || "Brasil", language: updatedArticle.language || "pt-BR", featured: Boolean(updatedArticle.featured), sourceUrl: updatedArticle.sourceUrl || null, sourceName: updatedArticle.sourceName || null }, { onSuccess: () => { setArticles(nextArticles); notify(`Notícia marcada como ${statusLabels[status].toLowerCase()}.`); }, onError: () => notify("O banco recusou a alteração de status; a publicação não foi alterada.") });
  };

  const deleteArticle = (id: string) => {
    const article = articles.find((item) => item.id === id);
    if (!article || !canManageArticle(article) || !window.confirm(`Excluir “${article.title}” da publicação?`)) return;
    updateStatus(id, "archived");
  };

  const duplicateArticle = (article: NewsArticle) => {
    if (!canManageArticle(article)) { notify("Colunistas só podem duplicar as próprias publicações."); return; }
    const copy = { ...article, id: makeArticleId(), title: `${article.title} — cópia`, status: "draft" as ArticleStatus, views: 0, updated: "agora" };
    const nextArticles = [copy, ...articles];
    saveArticleRemote.mutate({ id: copy.id, title: copy.title, category: copy.category, author: copy.author, authorOpenId: copy.authorOpenId ?? user?.openId ?? null, summary: copy.summary, date: copy.date, updated: copy.updated, status: "draft", views: 0, image: copy.image, bodyHtml: copy.bodyHtml, scheduledAt: null, tags: JSON.stringify(copy.tags || []), youtubeUrl: copy.youtubeUrl || null, socialLinks: JSON.stringify(copy.socialLinks || {}), scope: copy.scope || "national", region: copy.region || null, state: copy.state || null, country: copy.country || "Brasil", language: copy.language || "pt-BR", featured: Boolean(copy.featured), sourceUrl: copy.sourceUrl || null, sourceName: copy.sourceName || null }, { onSuccess: () => { setArticles(nextArticles); notify("Cópia criada e salva como rascunho."); }, onError: () => notify("Não foi possível salvar a cópia no banco.") });
  };

  useEffect(() => {
    if (!mediaList.data) return;
    const remoteMedia = (mediaList.data as any[]).map((item) => ({
      id: item.key || item.id,
      name: item.name,
      src: item.url,
      size: item.size ? `${Math.round(Number(item.size) / 1024)} KB` : "",
      createdAt: item.createdAt || "agora",
    })) as MediaAsset[];
    setMedia(remoteMedia);
  }, [mediaList.data]);

  const uploadImageFile = async (file: File): Promise<MediaAsset | null> => {
    if (!["image/png", "image/jpeg", "image/webp", "image/gif"].includes(file.type)) { notify("Use uma imagem JPG, PNG, WebP ou GIF."); return null; }
    if (file.size > 5 * 1024 * 1024) { notify("A imagem deve ter no máximo 5 MB."); return null; }
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
      return asset;
    } catch (error) {
      console.error(error);
      notify("Não foi possível enviar a imagem para o armazenamento.");
      return null;
    }
  };

  const uploadMedia = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (await uploadImageFile(file)) notify("Imagem enviada para a mídia.");
  };

  const [coverUploading, setCoverUploading] = useState(false);
  const [pickerMode, setPickerMode] = useState<"body" | "cover">("body");
  const uploadCoverImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setCoverUploading(true);
    const asset = await uploadImageFile(file);
    setCoverUploading(false);
    if (asset) { setDraft((current) => ({ ...current, image: asset.src, imageAlt: current.imageAlt || current.title })); notify("Imagem principal enviada. Salve a matéria para publicar a troca."); }
  };

  const insertMediaIntoDraft = (asset: MediaAsset) => {
    if (pickerMode === "cover") {
      setDraft((current) => ({ ...current, image: asset.src }));
      setMediaPickerOpen(false);
      notify("Imagem principal trocada. Salve a matéria para publicar a troca.");
      return;
    }
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

  const navGroups: { label: string; items: { id: View; label: string; icon: typeof LayoutDashboard }[] }[] = [
    { label: "Redação", items: [
      { id: "overview", label: "Visão geral", icon: LayoutDashboard },
      { id: "articles", label: "Notícias", icon: FileText },
      ...(canManageAgenda ? [{ id: "events" as View, label: "Agenda de eventos", icon: CalendarDays }] : []),
      ...(isAdmin ? [{ id: "editorialRequests" as View, label: "Correções e respostas", icon: MessageCircle }] : []),
    ]},
    { label: "Equipe e conteúdo", items: [
      ...(isAdmin ? [{ id: "team" as View, label: "Colunistas e equipe", icon: Users }] : []),
      ...(isAdmin ? [{ id: "subthemes" as View, label: "Temas específicos", icon: MoreHorizontal }] : []),
      { id: "media", label: "Mídia", icon: FolderOpen },
      { id: "comments", label: "Comentários", icon: MessageCircle },
      ...(isAdmin ? [{ id: "ads" as View, label: "Anúncios", icon: Megaphone }] : []),
    ]},
    { label: "Gestão e ferramentas", items: [
      ...(isAdmin ? [{ id: "hostingPress" as View, label: "HostingPress", icon: ExternalLink }] : []),
      { id: "stats", label: "Estatísticas", icon: BarChart3 },
      ...(isAdmin ? [{ id: "audit" as View, label: "Auditoria", icon: History }] : []),
      ...(isAdmin ? [{ id: "apiHub" as View, label: "Integrações / API Hub", icon: Settings }] : []),
    ]},
    { label: "Conta", items: [
      { id: "profile", label: "Meu perfil", icon: UserCircle },
    ]},
  ];

  return (
    <div className="admin-shell">
      <aside className={`admin-sidebar ${sidebarOpen ? "is-open" : ""}`}>
        <div className="admin-brand"><img src={LOGO_URL} alt="PCH News" /><span>STUDIO</span></div>
        <div className="workspace-switcher"><div className="workspace-avatar">PN</div><div><strong>PCH News</strong><small>Redação principal</small></div><ChevronDown size={15} /></div>
        <nav className="admin-nav" aria-label="Navegação do painel">{navGroups.map((group) => group.items.length ? <div key={group.label} className="admin-nav-group"><span className="nav-label">{group.label}</span>{group.items.map(({ id, label, icon: Icon }) => <button key={id} className={view === id ? "active" : ""} onClick={() => { setView(id); setSidebarOpen(false); }}><Icon size={17} /><span>{label}</span>{id === "articles" && <em>{articles.length}</em>}</button>)}</div> : null)}</nav>
        <div className="sidebar-bottom"><div className="user-chip"><div className="user-avatar">{displayInitials}</div><div><strong>{displayName}</strong><small>{roleLabels[currentRole as AccessUser["role"]] || "Equipe editorial"}</small></div><MoreHorizontal size={16} /></div><Link className="back-public" href="/"><ExternalLink size={14} /> Ver site público</Link><button className="logout-button" onClick={logout}><LogOut size={14} /> Sair do painel</button></div>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar"><button className="admin-mobile-menu" aria-label="Abrir menu" onClick={() => setSidebarOpen((open) => !open)}><Menu size={20} /></button><div className="breadcrumbs"><span>Studio</span><b>/</b><strong>{navGroups.flatMap((group) => group.items).find((item) => item.id === view)?.label}</strong>{!isAdmin && <span className="author-badge">{currentAuthor}</span>}</div><div className="topbar-actions"><div className="topbar-clock" aria-label="Horário da redação"><div className="topbar-clock-time">{currentTime.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</div><div className="topbar-clock-date">{currentTime.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short" })}</div></div><span className="role-badge">{roleLabels[currentRole as AccessUser["role"]] || "Equipe editorial"}</span><span className="autosave"><span className="online-dot" /> Alterações salvas</span><div className="notification-wrap"><button className="top-icon" aria-label="Notificações" onClick={() => setNotificationsOpen((open) => !open)}><Bell size={18} />{comments.filter((comment) => comment.status === "pending").length + pendingAdRequests > 0 && <i />}</button>{notificationsOpen && <div className="notification-popover"><strong>Notificações</strong>{comments.filter((comment) => comment.status === "pending").length > 0 && <button onClick={() => { setView("comments"); setNotificationsOpen(false); }}><MessageCircle size={14} /><span><b>{comments.filter((comment) => comment.status === "pending").length} comentário(s)</b><small>Aguardando moderação</small></span></button>}{adRequests.length > 0 && <button onClick={() => { setView("ads"); setNotificationsOpen(false); }}><Megaphone size={14} /><span><b>{pendingAdRequests} solicitação(ões)</b><small>Interesse em anúncios pendente</small></span></button>}{comments.filter((comment) => comment.status === "pending").length === 0 && pendingAdRequests === 0 && <small className="notification-empty">Tudo em dia por aqui.</small>}</div>}</div><div className="top-avatar" aria-label={displayName}>{displayInitials}</div></div></header>

        <main className="admin-content">
          {personalInvitation && <section className="personal-invitation-card">
            <div className="personal-invitation-mark">PCH</div>
            <div className="personal-invitation-copy">
              <span className="admin-kicker">SEU CONVITE PCH NEWS</span>
              <h2>Você faz parte desta redação.</h2>
              <p>Seu convite para atuar como <strong>{roleLabels[personalInvitation.role as AccessUser["role"]] || personalInvitation.role}</strong> foi registrado. Este espaço mantém sua participação e os termos aceitos sempre acessíveis.</p>
              <div className="personal-invitation-meta">
                <span>Convidado em {new Date(Number(personalInvitation.createdAtMs)).toLocaleDateString("pt-BR")}</span>
                {personalInvitation.acceptedAtMs && <span>Aceito em {new Date(Number(personalInvitation.acceptedAtMs)).toLocaleDateString("pt-BR")}</span>}
                {personalInvitation.termsAcceptedTermsId && <span>Termos {personalInvitation.termsAcceptedTermsId}</span>}
              </div>
            </div>
            <div className="personal-invitation-status"><CheckCircle2 size={18}/><span>Convite aceito</span></div>
          </section>}
          {view === "overview" && <EditorialCommandCenter articles={articles} isAdmin={isAdmin} onNavigate={(target) => setView(target as View)} />}
          {view === "overview" && false && <><div className="admin-heading"><div><span className="admin-kicker">{formatToday()}</span><h1>{getGreeting()}, {displayName.split(" ")[0]}<span>.</span></h1><p>Centralize produção, revisão, publicação e audiência em uma única redação.</p></div><div className="heading-actions"><button className="secondary-cta" disabled={syncPilulas.isPending} onClick={() => syncPilulas.mutate()}><Sparkles size={16} /> {syncPilulas.isPending ? "Importando acervo…" : "Importar acervo de Pílulas"}</button><button className="primary-cta" onClick={openCreate}><Plus size={17} /> Nova notícia</button></div></div><section className="metrics-grid"><MetricCard label="Visualizações totais" value={totalViews.toLocaleString("pt-BR")} delta="Fonte: Supabase" icon={BarChart3} accent="blue" /><MetricCard label="Publicadas" value={String(publishedCount).padStart(2, "0")} delta="Fonte: Supabase" icon={Check} accent="green" /><MetricCard label="Em produção" value={String(draftCount + reviewCount + scheduledCount).padStart(2, "0")} delta={reviewCount ? reviewCount + " em revisão" : draftCount + " rascunhos"} icon={Pencil} accent="gold" /><MetricCard label="Pendências" value={String(pendingTasks).padStart(2, "0")} delta={pendingComments ? pendingComments + " comentários" : "Tudo em dia"} icon={Bell} accent="blue" /></section><section className="admin-command-center"><div className="panel command-panel"><div className="panel-heading"><div><span className="admin-kicker">ACOMPANHAMENTO DO ADMINISTRADOR</span><h2>Centro de controle da redação</h2><p>Visão rápida do que exige atenção agora, sem precisar abrir cada módulo.</p></div></div><div className="command-grid"><button onClick={() => setView("articles")}><FileText size={18}/><span><strong>{articles.length}</strong><small>publicações no sistema</small></span><ArrowIcon/></button><button onClick={() => setView("articles")}><CalendarDays size={18}/><span><strong>Consultar</strong><small>produção editorial</small></span><ArrowIcon/></button><button onClick={() => setView("team")}><Users size={18}/><span><strong>{isAdmin ? accessUsers.filter((u:any)=>["admin","editor","journalist","columnist","reviewer"].includes(u.role)).length : "—"}</strong><small>membros editoriais</small></span><ArrowIcon/></button><button onClick={() => setView("ads")}><Megaphone size={18}/><span><strong>{isAdmin ? adminCampaigns.length : "—"}</strong><small>campanhas cadastradas</small></span><ArrowIcon/></button><button onClick={() => setView("editorialRequests")}><MessageCircle size={18}/><span><strong>{isAdmin ? pendingAdRequests + pendingComments : "—"}</strong><small>pendências de atendimento</small></span><ArrowIcon/></button></div></div><div className="panel command-panel command-attention"><div className="panel-heading"><div><span className="admin-kicker">ATENÇÃO</span><h2>Fila administrativa</h2></div></div><div className="attention-list"><div><span className="attention-number">{pendingComments}</span><span><strong>Comentários pendentes</strong><small>Modere ou encaminhe na Central de comentários.</small></span><button onClick={() => setView("comments")}>Abrir</button></div><div><span className="attention-number">{pendingAdRequests}</span><span><strong>Solicitações comerciais</strong><small>Pedidos recebidos pelo formulário público /anuncie.</small></span><button onClick={() => setView("ads")}>Abrir</button></div><div><span className="attention-number">{reviewCount}</span><span><strong>Notícias em revisão</strong><small>Conteúdo aguardando conferência editorial.</small></span><button onClick={() => setView("articles")}>Abrir</button></div></div></div></section><section className="dashboard-grid"><div className="panel featured-panel"><div className="panel-heading"><div><span className="admin-kicker">DESEMPENHO EDITORIAL</span><h2>Histórias que estão movendo o Brasil</h2></div><button className="ghost-button" onClick={() => setView("articles")}>Ver todas <ArrowIcon /></button></div><div className="featured-list">{articles.filter((article) => article.status === "published").slice(0, 4).map((article, index) => <div className="featured-row" key={article.id}><span className="rank">0{index + 1}</span><img src={article.image} alt={article.title} /><div className="featured-copy"><span>{article.category}</span><h3>{article.title}</h3><small>{article.author} · {article.updated}</small></div><strong>{article.views.toLocaleString("pt-BR")} <small>views</small></strong></div>)}</div></div><div className="panel activity-panel"><div className="panel-heading"><div><span className="admin-kicker">ATIVIDADE</span><h2>Ritmo da redação</h2></div><button className="more-button" aria-label="Abrir estatísticas" title="Abrir estatísticas" onClick={() => setView("stats")}><MoreHorizontal size={18} /></button></div><div className="activity-chart"><div className="chart-area real-bars">{articles.slice().sort((a,b)=>b.views-a.views).slice(0,5).map((article,index)=><div className="real-bar-row" key={article.id}><span>{index+1}. {article.title.slice(0,34)}</span><i style={{ width: `${totalViews ? Math.max(6, Math.round((article.views / Math.max(1, totalViews)) * 100)) : 6}%` }} /><b>{article.views.toLocaleString("pt-BR")}</b></div>)}</div></div><div className="chart-total"><strong>{totalViews.toLocaleString("pt-BR")}</strong><span>visualizações registradas no banco</span></div></div></section></>}

          {view === "articles" && <><div className="admin-heading compact"><div><span className="admin-kicker">CENTRAL DE CONTEÚDO</span><h1>Notícias<span>.</span></h1><p>Crie, organize e acompanhe tudo o que vai ao ar no PCH News.</p></div><div className="heading-actions"><button className="secondary-cta" onClick={exportArticles}><Upload size={16} /> Exportar</button><button className="primary-cta" onClick={openCreate}><Plus size={17} /> Nova notícia</button></div></div><div className="article-toolbar"><div className="admin-search"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por título, autor ou editoria" /></div><select className="category-filter" value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}><option value="all">Todas as editorias</option>{Array.from(new Set(articles.map((article) => article.category))).map((category) => <option key={category}>{category}</option>)}</select><div className="filter-tabs"><button className={statusFilter === "all" ? "active" : ""} onClick={() => setStatusFilter("all")}>Todas <span>{articles.length}</span></button>{(Object.keys(statusLabels) as ArticleStatus[]).map((status) => <button key={status} className={statusFilter === status ? "active" : ""} onClick={() => setStatusFilter(status)}>{statusLabels[status]} <span>{articles.filter((article) => article.status === status).length}</span></button>)}</div></div><div className="panel table-panel"><div className="table-caption"><span>{filteredArticles.length} publicações encontradas</span><button className="sort-button">Mais recentes <ChevronDown size={14} /></button></div><div className="news-table"><div className="table-head"><span className="check-box" /><span>NOTÍCIA</span><span>EDITORIA</span><span>STATUS</span><span>VISUALIZAÇÕES</span><span>ATUALIZADA</span><span /></div>{filteredArticles.map((article) => <div className="table-row" key={article.id}><span className="check-box" /><div className="article-cell"><img src={article.image} alt="" /><div><strong>{article.title}</strong><small>Por {article.author}</small></div></div><span className="category-cell">{article.category}</span><span>{canManageArticle(article) ? <button className={`status-pill ${statusClass[article.status]}`} onClick={() => updateStatus(article.id, nextWorkflowStatus(article.status))}><i /> {statusLabels[article.status]}</button> : <span className={`status-pill ${statusClass[article.status]}`} aria-label="Somente leitura"><i /> {statusLabels[article.status]}</span>}</span><span className="views-cell"><Eye size={14} /> {Number(article.views || 0).toLocaleString("pt-BR")}</span><span className="updated-cell">{article.status === "scheduled" && article.scheduledAt ? `Sai em ${new Date(article.scheduledAt).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" })}` : article.date}</span><div className="row-actions"><button className="row-preview-action" aria-label="Visualizar publicação" title="Visualizar publicação" onClick={() => setPreviewArticle(article)}><Eye size={15} /><span>Ver</span></button>{canManageArticle(article) && <><button className="row-edit-action" aria-label="Editar publicação" title="Editar publicação" onClick={() => openEdit(article)}><Edit3 size={15} /><span>Editar</span></button><button aria-label="Duplicar" onClick={() => duplicateArticle(article)}><FileText size={15} /></button><button aria-label="Arquivar" onClick={() => deleteArticle(article.id)}><Archive size={15} /></button></>}</div></div>)}</div>{filteredArticles.length === 0 && <div className="table-empty"><Search size={22} /><strong>Nenhuma notícia encontrada</strong><span>Tente outro termo ou ajuste os filtros.</span></div>}</div></>}

          {view === "events" && canManageAgenda && <EventsAdmin notify={notify} />}
          {view === "editorialRequests" && isAdmin && <EditorialRequestsAdmin notify={notify} />}
          {view === "apiHub" && isAdmin && <ApiHubPanel isAdmin={isAdmin} />}
          {view === "hostingPress" && isAdmin && <HostingPressPanel />}
          {view === "audit" && isAdmin && <Audit entries={auditEntries as AuditEntry[]} />}
          {view === "stats" && <Stats articles={articles} comments={comments} author={undefined} isAdmin={isAdmin} authors={Array.from(new Set(articles.map((article) => article.author)))} viewEvents={analytics?.events ?? []} />}
          {view === "comments" && <Comments comments={isAdmin ? comments : comments.filter((comment) => articles.find((article) => article.id === comment.articleId)?.author === currentAuthor)} articles={articles} onChange={setComments} notify={notify} currentAuthor={currentAuthor} isAdmin={isAdmin} />}
          {view === "ads" && isAdmin && <Ads notify={notify} />}
          {view === "profile" && (isAdmin ? <AdminAccountProfile user={user} roleLabel={roleLabels[currentRole as AccessUser["role"]] || "Administrador"} /> : <ProfileEditor profile={profiles[slugify(currentAuthor)] || Object.values(profiles)[0]} onSave={saveProfile} onUpload={uploadProfilePhoto} notify={notify} />)}
          {view === "media" && <MediaLibrary media={media} onUpload={uploadMedia} deletingId={null} onDelete={(id) => { const removed = media.find((asset) => asset.id === id); if (!removed || mediaDelete.isPending) return; setMedia((current) => current.filter((asset) => asset.id !== id)); mediaDelete.mutate({ key: id }, { onError: () => { setMedia((current) => [removed, ...current.filter((asset) => asset.id !== id)]); notify("Não foi possível remover a mídia."); } }); }} />}
          {view === "team" && isAdmin && <><AccessSettings users={accessUsers} onRoleChange={(openId, role) => setRole.mutate({ openId, role })} /><ProfileCommercialAdmin profiles={profiles} onToggle={(profile, approved) => profileSave.mutate({ ...profile, productsJson: typeof profile.productsJson === "string" ? profile.productsJson : JSON.stringify(profile.productsJson || []), commercialApproved: approved }, { onSuccess: () => { notify(approved ? "Divulgação aprovada." : "Divulgação retirada."); void refetchEditorial(); }, onError: (error) => notify(error.message) })} /></>}
          {view === "subthemes" && isAdmin && <EditorialSubthemesAdmin notify={notify} />}
          {view === "settings" && isAdmin && <section className="panel"><div className="admin-heading compact"><div><span className="admin-kicker">CONFIGURAÇÕES</span><h1>Configurações<span>.</span></h1><p>Preferências administrativas do PCH News.</p></div></div><p className="editor-note">As funções de equipe e convites ficam no módulo <strong>Colunistas e equipe</strong>, no menu lateral.</p></section>}
        </main>
      </div>

      {onboardingOpen && <EditorialOnboarding role={currentRole as "columnist" | "journalist"} onClose={() => {
        const key = `pch_onboarding_editorial_v1:${user?.openId || user?.email || currentRole}`;
        try { localStorage.setItem(key, "done"); } catch { /* ignore */ }
        setOnboardingOpen(false);
      }} onOpenArticles={() => { setView("articles"); setOnboardingOpen(false); }}  />}
      {previewArticle && <PreviewModal article={previewArticle} onClose={() => setPreviewArticle(null)} />}
      {mediaPickerOpen && <MediaPickerModal media={media} mode={pickerMode} onUpload={uploadImageFile} onDelete={(id) => { const removed = media.find((asset) => asset.id === id); if (!removed || mediaDelete.isPending) return; setMedia((current) => current.filter((asset) => asset.id !== id)); mediaDelete.mutate({ key: id }, { onError: () => { setMedia((current) => [removed, ...current.filter((asset) => asset.id !== id)]); notify("Não foi possível remover a mídia."); } }); }} onClose={() => setMediaPickerOpen(false)} onSelect={insertMediaIntoDraft} />}
      {editorOpen && <div className={`editor-overlay editorial-editor-screen ${editorLeftOpen ? "editor-left-open" : "editor-left-closed"} ${editorAgentsOpen ? "editor-agents-open" : "editor-agents-closed"}`} role="dialog" aria-modal="true" aria-label={editing ? "Editar notícia" : "Nova notícia"}>
  <button type="button" className="editor-side-toggle editor-side-toggle-left" onClick={() => setEditorLeftOpen((open) => !open)} aria-label={editorLeftOpen ? "Fechar menu lateral" : "Abrir menu lateral"} title={editorLeftOpen ? "Fechar menu" : "Abrir menu"}>
    {editorLeftOpen ? <PanelLeftClose size={18} /> : <PanelLeft size={18} />}
  </button>
  <button type="button" className="editor-side-toggle editor-side-toggle-right" onClick={() => setEditorAgentsOpen((open) => !open)} aria-label={editorAgentsOpen ? "Fechar agentes editoriais" : "Abrir agentes editoriais"} title={editorAgentsOpen ? "Fechar agentes" : "Abrir agentes"}>
    {editorAgentsOpen ? <PanelRightClose size={18} /> : <PanelRight size={18} />}
  </button>

  {editorLeftOpen && <aside className="editor-left-drawer" aria-label="Navegação do Studio">
    <div className="editor-left-brand"><img src={LOGO_URL} alt="PCH News" /><span>STUDIO</span></div>
    <div className="editor-left-workspace"><div className="workspace-avatar">PN</div><div><strong>PCH News</strong><small>Redação principal</small></div><ChevronDown size={14} /></div>
    <nav className="editor-left-nav" aria-label="Navegação do painel">
      {navGroups.map((group) => group.items.length ? <div key={group.label} className="editor-left-nav-group"><span>{group.label}</span>{group.items.map(({ id, label, icon: Icon }) => <button key={id} className={view === id ? "active" : ""} onClick={() => { setView(id); setEditorOpen(false); setEditorLeftOpen(false); }}><Icon size={16} /><span>{label}</span>{id === "articles" && <em>{articles.length}</em>}</button>)}</div> : null)}
    </nav>
    <div className="editor-left-footer"><strong>{displayName}</strong><small>{roleLabels[currentRole as AccessUser["role"]] || "Equipe editorial"}</small></div>
  </aside>}

  <aside className="editor-drawer editorial-editor-drawer">
    <div className="editor-header editorial-editor-header">
      <div className="editor-header-copy">
        <span className="admin-kicker">{editing ? "EDITAR NOTÍCIA" : "NOVA NOTÍCIA"}</span>
        <h2>{editing ? "Editor editorial" : "Nova notícia"}</h2>
        {editing && <span className={"editor-autosave-state " + autosaveState}>{autosaveState === "saving" ? "Salvando…" : autosaveState === "saved" ? "Salvo automaticamente" : autosaveState === "error" ? "Falha ao salvar" : "Aguardando alterações"}</span>}
      </div>
      <div className="editor-header-actions">
        <PchNewsFreedomMark compact />
        <button className="close-editor" type="button" onClick={() => setEditorOpen(false)} aria-label="Fechar editor"><X size={18} /></button>
      </div>
    </div>

    <div className="editor-workspace editorial-document-workspace">
      <form onSubmit={saveArticle} className="editor-form editorial-document-paper">
        <div className="editor-document-topline">
          <button type="button" className="editor-back-button" onClick={() => setEditorOpen(false)}>← Voltar</button>
          <span className={"editor-document-status " + statusClass[draft.status]}>{statusLabels[draft.status]}</span>
        </div>
        <div className="editor-guide"><strong>Como usar este editor</strong><span>Preencha a notícia, revise o conteúdo e use as <b>Opções editoriais</b> para classificação, SEO, distribuição e publicação. As explicações mostram o objetivo de cada área.</span></div>

        <label className="editor-document-title">
          <span className="editor-field-caption">Título da notícia</span><EditorFieldHelp>É o título que identifica a matéria para o leitor. Prefira clareza, precisão e objetividade.</EditorFieldHelp>
          <input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} placeholder="Título da notícia" autoFocus />
        </label>

        <label className="editor-document-summary">
          <span className="editor-field-caption">Resumo / linha fina</span><EditorFieldHelp>Resume o fato principal. Aparece na apresentação da matéria, nos destaques e em compartilhamentos.</EditorFieldHelp>
          <textarea value={draft.summary} onChange={(event) => setDraft({ ...draft, summary: event.target.value })} placeholder="Digite um resumo objetivo da matéria. Ele aparecerá no destaque e nas redes sociais." rows={2} />
        </label>

        <div className="form-grid editor-document-meta">
          <label><span className="editor-field-caption">Editoria</span><EditorFieldHelp>Define em qual área jornalística a matéria será organizada no portal.</EditorFieldHelp><select value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value })}>{EDITORIAL_CATEGORIES.map((category) => <option key={category}>{category}</option>)}</select></label>
          <label><span className="editor-field-caption">Autor</span><EditorFieldHelp>Identifica quem assina a publicação.</EditorFieldHelp><input value={draft.author} onChange={(event) => setDraft({ ...draft, author: event.target.value })} /></label>
        </div>

        <RichTextEditor value={draft.bodyHtml} onChange={(bodyHtml) => setDraft({ ...draft, bodyHtml })} onPickImage={() => { setPickerMode("body"); setMediaPickerOpen(true); }} onUploadImage={async (file) => { const asset = await uploadImageFile(file); if (asset) insertMediaIntoDraft(asset); }} />

        <details className="editor-advanced editorial-document-options">
          <summary>Opções editoriais</summary>

          <section className="editor-option-section">
            <div className="editor-option-heading"><span className="admin-kicker">REDAÇÃO</span><strong>Classificação e distribuição</strong></div><EditorFieldHelp>Use para definir o formato, o alcance e a mensagem final da matéria.</EditorFieldHelp>
            <div className="form-grid">
              <label><span className="editor-field-caption">Tipo de conteúdo</span><EditorFieldHelp>Indica o formato editorial, como notícia ou Pílula.</EditorFieldHelp><select value={draft.contentType} onChange={(event) => setDraft({ ...draft, contentType: event.target.value as Draft["contentType"] })}>{EDITORIAL_CONTENT_TYPES.map((type) => <option key={type.id} value={type.id}>{type.label}</option>)}</select></label>
              {draft.contentType === "pilula" && <label><span className="editor-field-caption">Edição da Pílula</span><EditorFieldHelp>Informe o número para manter a sequência da série.</EditorFieldHelp><input type="number" min="1" value={draft.editionNumber ?? ""} onChange={(event) => setDraft({ ...draft, editionNumber: event.target.value ? Number(event.target.value) : null })} placeholder="Ex.: 23" /></label>}
              <label><span className="editor-field-caption">Chave final para o leitor</span><EditorFieldHelp>Registre a principal ideia ou conclusão que o leitor deve levar.</EditorFieldHelp><input value={draft.keyTakeaway} onChange={(event) => setDraft({ ...draft, keyTakeaway: event.target.value })} placeholder="O que o leitor deve levar desta matéria?" /></label>
            </div>
            <div className="form-grid">
              <label><span className="editor-field-caption">Abrangência</span><EditorFieldHelp>Define se a matéria será nacional, regional ou internacional.</EditorFieldHelp><select value={draft.scope} onChange={(event) => setDraft({ ...draft, scope: event.target.value as NewsArticle["scope"] })}>{EDITORIAL_SCOPES.map((scope) => <option key={scope.id} value={scope.id}>{scope.label}</option>)}</select></label>
              <label><span className="editor-field-caption">Idioma</span><EditorFieldHelp>Informa o idioma principal da publicação.</EditorFieldHelp><select value={draft.language} onChange={(event) => setDraft({ ...draft, language: event.target.value })}><option value="pt-BR">Português · Brasil</option><option value="en">English</option><option value="es">Español</option></select></label>
            </div>
            <div className="form-grid">
              <label><span className="editor-field-caption">Região <span className="field-hint">opcional</span></span><EditorFieldHelp>Use quando houver recorte regional específico.</EditorFieldHelp><input value={draft.region || ""} onChange={(event) => setDraft({ ...draft, region: event.target.value })} placeholder="Ex.: Sudeste" /></label>
              <label><span className="editor-field-caption">Estado <span className="field-hint">opcional</span></span><EditorFieldHelp>Use para identificar o estado relacionado à notícia.</EditorFieldHelp><input value={draft.state || ""} onChange={(event) => setDraft({ ...draft, state: event.target.value })} placeholder="Ex.: SP" /></label>
            </div>
            <div className="form-grid">
              <label><span className="editor-field-caption">País <span className="field-hint">opcional</span></span><EditorFieldHelp>Indique o país quando o contexto geográfico exigir.</EditorFieldHelp><input value={draft.country || ""} onChange={(event) => setDraft({ ...draft, country: event.target.value })} placeholder="Ex.: Brasil" /></label>
              <label className="featured-toggle"><span>Destaque na capa</span><EditorFieldHelp>Ative quando a redação quiser incluir a matéria na seleção de destaque da capa.</EditorFieldHelp><button type="button" role="switch" aria-checked={draft.featured} className={draft.featured ? "toggle-on" : ""} onClick={() => setDraft({ ...draft, featured: !draft.featured })}><i /></button><small>{draft.featured ? "Entra na seleção editorial da capa." : "Sem destaque especial."}</small></label>
            </div>
          </section>

          <section className="editor-option-section">
            <div className="editor-option-heading"><span className="admin-kicker">CONFERÊNCIA</span><strong>Checklist de publicação</strong></div><EditorFieldHelp>Marque cada item depois de conferir a matéria. O checklist ajuda a evitar publicação incompleta.</EditorFieldHelp>
            <div className="editorial-checklist-grid">{EDITORIAL_CHECKLIST_LABELS.map(([key,label]) => <label key={key} className="checklist-item"><input type="checkbox" checked={Boolean(draft.editorialChecklist?.[key])} onChange={(event) => setDraft({ ...draft, editorialChecklist: { ...draft.editorialChecklist, [key]: event.target.checked } })} /><span>{label}</span></label>)}</div>
          </section>

          <details className="editor-advanced">
            <summary>Contexto e notas internas</summary><EditorFieldHelp>Área de trabalho da redação. Estas notas não substituem o texto publicado.</EditorFieldHelp>
            <div className="form-grid">
              <label><span className="editor-field-caption">Contraponto / contexto adicional</span><EditorFieldHelp>Registre outra perspectiva ou contexto necessário para uma cobertura equilibrada.</EditorFieldHelp><textarea value={draft.contraponto} onChange={(event) => setDraft({ ...draft, contraponto: event.target.value })} rows={3} placeholder="Registre o contraponto quando necessário." /></label>
              <label><span className="editor-field-caption">Notas editoriais</span><EditorFieldHelp>Use para observações internas sobre apuração, revisão ou decisões da redação.</EditorFieldHelp><textarea value={draft.editorialNotes} onChange={(event) => setDraft({ ...draft, editorialNotes: event.target.value })} rows={3} placeholder="Observações internas da redação." /></label>
            </div>
          </details>

          <section className="editor-option-section">
            <div className="editor-option-heading"><span className="admin-kicker">SEO</span><strong>Busca e compartilhamento</strong></div><EditorFieldHelp>Ajuda buscadores e redes sociais a entender e apresentar a matéria.</EditorFieldHelp>
            <div className="form-grid"><label><span className="editor-field-caption">Slug</span><EditorFieldHelp>Identificador amigável da URL; use palavras curtas e hífens.</EditorFieldHelp><input value={draft.slug || ""} onChange={(event) => setDraft({ ...draft, slug: event.target.value })} /></label><label><span className="editor-field-caption">Palavra-chave foco</span><EditorFieldHelp>Termo principal pelo qual a matéria pode ser encontrada.</EditorFieldHelp><input value={draft.focusKeyword || ""} onChange={(event) => setDraft({ ...draft, focusKeyword: event.target.value })} placeholder="termo principal da matéria" /></label></div>
            <label><span className="editor-field-caption">Título SEO</span><EditorFieldHelp>Versão do título usada como referência para mecanismos de busca.</EditorFieldHelp><input value={draft.seoTitle || ""} onChange={(event) => setDraft({ ...draft, seoTitle: event.target.value })} placeholder={draft.title} /></label>
            <label><span className="editor-field-caption">Meta description</span><EditorFieldHelp>Descrição curta que pode aparecer nos resultados de busca.</EditorFieldHelp><textarea value={draft.metaDescription || ""} onChange={(event) => setDraft({ ...draft, metaDescription: event.target.value })} rows={3} placeholder={draft.summary} /></label>
            <div className="form-grid"><label><span className="editor-field-caption">URL canônica</span><EditorFieldHelp>Indica qual URL deve ser considerada a versão principal da matéria.</EditorFieldHelp><input type="url" value={draft.canonicalUrl || ""} onChange={(event) => setDraft({ ...draft, canonicalUrl: event.target.value })} placeholder="https://pchnews.com.br/materia/..." /></label><label><span className="editor-field-caption">Alt da imagem</span><EditorFieldHelp>Descrição objetiva da imagem para acessibilidade.</EditorFieldHelp><input value={draft.imageAlt || ""} onChange={(event) => setDraft({ ...draft, imageAlt: event.target.value })} placeholder="Descrição objetiva da imagem" /></label></div>
            <div className="form-grid"><label><span className="editor-field-caption">OG title</span><EditorFieldHelp>Título usado nas prévias de compartilhamento.</EditorFieldHelp><input value={draft.ogTitle || ""} onChange={(event) => setDraft({ ...draft, ogTitle: event.target.value })} /></label><label><span className="editor-field-caption">OG description</span><EditorFieldHelp>Texto curto usado na prévia de compartilhamento.</EditorFieldHelp><input value={draft.ogDescription || ""} onChange={(event) => setDraft({ ...draft, ogDescription: event.target.value })} /></label></div>
            <label className="seo-noindex"><EditorFieldHelp>Ative somente quando a matéria não deve aparecer nos mecanismos de busca.</EditorFieldHelp><input type="checkbox" checked={Boolean(draft.noindex)} onChange={(event) => setDraft({ ...draft, noindex: event.target.checked })} /> Não indexar esta matéria (noindex)</label>
          </section>

          <section className="editor-option-section">
            <div className="editor-option-heading"><span className="admin-kicker">DISTRIBUIÇÃO</span><strong>Tags, redes e imagem</strong></div><EditorFieldHelp>Use para facilitar descoberta e distribuição. Os links são complementares.</EditorFieldHelp>
            <label><span className="editor-field-caption">Tags <span className="field-hint">separe por vírgulas</span></span><EditorFieldHelp>Palavras que ajudam a relacionar a matéria a assuntos semelhantes.</EditorFieldHelp><input value={draft.tagsInput} onChange={(event) => setDraft({ ...draft, tagsInput: event.target.value })} placeholder="ex.: cultura, região oeste" /></label>
            <div className="form-grid"><label><span className="editor-field-caption">YouTube <span className="field-hint">opcional</span></span><EditorFieldHelp>Vídeo relacionado que complementa a matéria.</EditorFieldHelp><input type="url" value={draft.youtubeUrl} onChange={(event) => setDraft({ ...draft, youtubeUrl: event.target.value })} placeholder="https://youtube.com/watch?v=..." /></label><label><span className="editor-field-caption">Site / link externo <span className="field-hint">opcional</span></span><EditorFieldHelp>Fonte oficial ou página externa diretamente relacionada.</EditorFieldHelp><input type="url" value={draft.socialLinks.website} onChange={(event) => setDraft({ ...draft, socialLinks: { ...draft.socialLinks, website: event.target.value } })} placeholder="https://..." /></label></div>
            <div className="form-grid"><label><span className="editor-field-caption">Instagram</span><EditorFieldHelp>Link para conteúdo ou perfil relacionado no Instagram.</EditorFieldHelp><input type="url" value={draft.socialLinks.instagram} onChange={(event) => setDraft({ ...draft, socialLinks: { ...draft.socialLinks, instagram: event.target.value } })} placeholder="https://instagram.com/..." /></label><label><span className="editor-field-caption">Facebook</span><EditorFieldHelp>Link para conteúdo ou perfil relacionado no Facebook.</EditorFieldHelp><input type="url" value={draft.socialLinks.facebook} onChange={(event) => setDraft({ ...draft, socialLinks: { ...draft.socialLinks, facebook: event.target.value } })} placeholder="https://facebook.com/..." /></label></div>
            <div className="form-grid"><label><span className="editor-field-caption">X / Twitter</span><EditorFieldHelp>Link para conteúdo ou perfil relacionado no X.</EditorFieldHelp><input type="url" value={draft.socialLinks.x} onChange={(event) => setDraft({ ...draft, socialLinks: { ...draft.socialLinks, x: event.target.value } })} placeholder="https://x.com/..." /></label><label><span className="editor-field-caption">LinkedIn</span><EditorFieldHelp>Link para conteúdo ou perfil relacionado no LinkedIn.</EditorFieldHelp><input type="url" value={draft.socialLinks.linkedin} onChange={(event) => setDraft({ ...draft, socialLinks: { ...draft.socialLinks, linkedin: event.target.value } })} placeholder="https://linkedin.com/..." /></label></div>
            <label><span className="editor-field-caption">TikTok</span><EditorFieldHelp>Link para conteúdo ou perfil relacionado no TikTok.</EditorFieldHelp><input type="url" value={draft.socialLinks.tiktok} onChange={(event) => setDraft({ ...draft, socialLinks: { ...draft.socialLinks, tiktok: event.target.value } })} placeholder="https://tiktok.com/@..." /></label>
            <label><span className="editor-field-caption">Imagem principal <span className="field-hint">obrigatória para publicação</span></span><EditorFieldHelp>É a imagem de capa da matéria. Escolha uma imagem relacionada ao conteúdo.</EditorFieldHelp><input value={draft.image} onChange={(event) => setDraft({ ...draft, image: event.target.value })} placeholder="URL ou use os botões abaixo" /></label>
            <EditorFieldHelp>Você pode enviar do computador ou escolher uma imagem já existente na galeria. A prévia mostra o que será publicado.</EditorFieldHelp><div className="cover-actions"><label className="cover-upload-button">{coverUploading ? "Enviando..." : "Enviar do computador"}<input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={uploadCoverImage} disabled={coverUploading} hidden /></label><button type="button" onClick={() => { setPickerMode("cover"); setMediaPickerOpen(true); }}>Escolher da galeria</button>{draft.image.trim() && <button type="button" className="cover-remove" onClick={() => setDraft({ ...draft, image: "" })}>Remover</button>}</div>
            {draft.image.trim() ? <div className="image-preview"><img src={draft.image} alt="Prévia da imagem principal" /><span>Prévia da imagem que será publicada</span></div> : <div className="image-preview image-preview-empty"><ImagePlus size={20} /><span>Imagem ainda não selecionada.</span></div>}
          </section>

          <section className="editor-option-section">
            <div className="editor-option-heading"><span className="admin-kicker">PUBLICAÇÃO</span><strong>Status e agendamento</strong></div><EditorFieldHelp>O status controla a etapa da matéria. O agendamento define quando uma publicação aprovada entra no ar.</EditorFieldHelp>
            <div className="form-grid schedule-grid"><label><span className="editor-field-caption">Status</span><EditorFieldHelp>Rascunho mantém em produção; revisão envia para conferência; publicado coloca no ar; agendado prepara a publicação para um horário.</EditorFieldHelp><select value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value as ArticleStatus })}><option value="draft">Rascunho</option><option value="review">Enviar para revisão</option><option value="published">Publicado agora</option><option value="scheduled">Agendado</option></select></label><label className={draft.status !== "scheduled" ? "field-muted" : ""}><span className="editor-field-caption">Data e hora da publicação</span><EditorFieldHelp>Escolha o momento em que a matéria agendada deverá ser publicada.</EditorFieldHelp><input type="datetime-local" value={draft.scheduledAt} onChange={(event) => setDraft({ ...draft, scheduledAt: event.target.value })} disabled={draft.status !== "scheduled"} /></label></div>
            {draft.status === "scheduled" && <div className="schedule-note"><span>◷</span><p>A notícia ficará como <strong>Agendada</strong> e será publicada automaticamente quando chegar o horário definido.</p></div>}
          </section>

          {editing && <section className="editor-option-section"><div className="editor-option-heading"><span className="admin-kicker">HISTÓRICO</span><strong>Versões recentes</strong></div>{(articleHistory as any[]).slice(0,8).map((entry:any)=><div className="editor-history-row" key={entry.id}><strong>{entry.action}</strong><span>{entry.actorName}</span><time>{new Date(Number(entry.createdAtMs)).toLocaleString("pt-BR")}</time></div>)}</section>}

          <div className="editor-note"><span>i</span><p>O fluxo editorial é persistido no Supabase: rascunho, revisão, aprovação, agendamento, publicação e atualização.</p></div>
        </details>

        {editorReview && <details className="editor-advanced editor-analysis-details">
          <summary>Resultado da análise editorial</summary>
          <div className={"editor-review-result " + editorReview.status}>
            <strong>{editorReview.status === "pass" ? "Revisão concluída" : editorReview.status === "review" ? "Conferência humana necessária" : "Atenção antes de publicar"}</strong>
            {(editorReview.findings || []).slice(0, 6).map((finding: any, index: number) => <div className="editor-review-item" key={(finding.code || finding.ruleId || "finding") + index}><b>{String(finding.severity || "INFO").toUpperCase()}</b><span>{finding.message}</span>{finding.suggestion && <small>{finding.suggestion}</small>}</div>)}
          </div>
          {(() => { const fr = editorReview.agentId === "liberdade-editorial" ? editorReview : (editorReview.output?.agents || []).find((a: any) => a.agentId === "liberdade-editorial"); return fr ? <FreedomReviewPanel report={fr.output} /> : null; })()}
          {(() => { const beyond = editorReview.agentId === "beyond-news" ? editorReview : (editorReview.output?.agents || []).find((a: any) => a.agentId === "beyond-news"); return beyond ? <section className="editor-review-panel"><div className="panel-heading"><div><span className="admin-kicker">ALÉM DA NOTÍCIA</span><h3>Segunda leitura editorial</h3></div></div><p>{beyond.output?.editorialQuestion}</p></section> : null; })()}
        </details>}

        <div className="editor-actions">
          <button type="button" className="preview-cta" onClick={openDraftPreview}><Eye size={15} /> Visualizar</button>
          <button type="button" className="secondary-cta" onClick={() => setEditorOpen(false)}>Cancelar</button>
          {isAdmin && <button type="button" className="secondary-cta" onClick={() => { window.open("https://hostingpress.com.br/login", "_blank", "noopener,noreferrer"); notify("HostingPress aberto em uma nova aba para publicação."); }}><ExternalLink size={15} /> Publicar também no HostingPress</button>}
          <button type="submit" className="primary-cta"><Check size={16} /> {editing ? "Salvar alterações" : "Salvar notícia"}</button>
        </div>
      </form>

      {editorAgentsOpen && <aside className="editor-agents-sidebar editorial-agent-rail" aria-label="Agentes editoriais">
        <div className="editor-agents-sidebar-head"><div><span className="admin-kicker">AGENTES EDITORIAIS</span><strong>Assistência da redação</strong></div><button type="button" className="editor-panel-close" onClick={() => setEditorAgentsOpen(false)} aria-label="Fechar painel de agentes" title="Fechar agentes"><PanelRightClose size={16}/></button></div>
        <p>Use os agentes ao lado sem sair da matéria.</p>
        <div className="editor-agents-sidebar-list">
          {EDITORIAL_AGENTS.map((agent) => { const Icon = agent.icon; return <button type="button" key={agent.id} title={agent.name} aria-label={agent.name} data-agent-label={agent.name} className={editorReview?.agentId === agent.id ? "editor-agent-action active" : "editor-agent-action"} onClick={() => runEditorAgent(agent.id)} disabled={reviewArticleRemote.isPending || !canUseEditorialAgents}><Icon size={16}/><span><strong>{agent.name}</strong><small>{agent.description}</small></span>{reviewArticleRemote.isPending ? <em>…</em> : <em>Executar</em>}</button>; })}
        </div>
        {editorReview && <div className={"editor-agent-result " + editorReview.status}><span className="admin-kicker">ÚLTIMA ANÁLISE</span><strong>{editorReview.agentName || editorReview.agentId || "Agente editorial"}</strong><small>{editorReview.status === "pass" ? "Concluída sem bloqueios." : editorReview.status === "review" ? "Conferência humana necessária." : "Há pontos para revisar."}</small></div>}
      </aside>}
    </div>
  </aside>
</div>}
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

function RichTextEditor({ value, onChange, onPickImage, onUploadImage }: { value: string; onChange: (value: string) => void; onPickImage: () => void; onUploadImage: (file: File) => Promise<void> }) {
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const run = (command: string, argument?: string) => { document.execCommand(command, false, argument); const editor = document.querySelector('[contenteditable="true"]') as HTMLElement | null; if (editor) onChange(editor.innerHTML); };
  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => { const file = event.target.files?.[0]; event.target.value = ""; if (file) await onUploadImage(file); };
  return <div className="rich-editor-field"><label>Corpo da notícia</label><div className="rich-toolbar" role="toolbar" aria-label="Formatação do texto"><button type="button" onClick={() => run("undo")} aria-label="Desfazer"><Undo2 size={14} /></button><button type="button" onClick={() => run("redo")} aria-label="Refazer"><Redo2 size={14} /></button><span /><button type="button" onClick={() => run("bold")} aria-label="Negrito"><Bold size={14} /></button><button type="button" onClick={() => run("italic")} aria-label="Itálico"><Italic size={14} /></button><button type="button" onClick={() => run("underline")} aria-label="Sublinhado"><Underline size={14} /></button><span /><button type="button" onClick={() => run("formatBlock", "<h3>")} aria-label="Título">H3</button><button type="button" onClick={() => run("formatBlock", "<blockquote>")} aria-label="Citação"><Quote size={14} /></button><button type="button" onClick={() => run("insertUnorderedList")} aria-label="Lista"><List size={14} /></button><button type="button" onClick={() => run("insertOrderedList")} aria-label="Lista numerada"><ListOrdered size={14} /></button><button type="button" onClick={() => { const raw = window.prompt("Cole o endereço do link (ex.: https://exemplo.com)"); const url = raw?.trim(); if (!url) return; const normalized = /^(https?:|mailto:|\/)/i.test(url) ? url : `https://${url}`; run("createLink", normalized); }} aria-label="Inserir link"><LinkIcon size={14} /></button><button type="button" onClick={onPickImage} aria-label="Escolher imagem da galeria"><ImagePlus size={14} /></button><button type="button" onClick={() => uploadInputRef.current?.click()} aria-label="Fazer upload de imagem"><Upload size={14} /></button><input ref={uploadInputRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={handleUpload} hidden /></div><div className="rich-editor" contentEditable suppressContentEditableWarning onInput={(event) => onChange(event.currentTarget.innerHTML)} dangerouslySetInnerHTML={{ __html: value }} /></div>;
}

function EditorialOnboarding({ role, onClose, onOpenArticles }: { role: "columnist" | "journalist"; onClose: () => void; onOpenArticles: () => void }) {
  const isColumnist = role === "columnist";
  return <div className="media-picker-overlay" role="dialog" aria-modal="true" aria-label="Primeiros passos do painel editorial">
    <button className="overlay-dismiss" onClick={onClose} aria-label="Fechar onboarding" />
    <section className="media-picker" style={{ maxWidth: 760 }}>
      <div className="editor-header">
        <div><span className="admin-kicker">BEM-VINDO AO PCH NEWS</span><h2>Seu guia rápido de publicação</h2></div>
        <button className="close-editor" onClick={onClose} aria-label="Fechar"><X size={18} /></button>
      </div>
      <div className="onboarding-grid">
        <article className="panel"><span className="admin-kicker">1 · NOTÍCIA</span><h3>Comece pela notícia</h3><p>Abra uma notícia, escreva o conteúdo, execute os agentes editoriais e siga até a publicação.</p><button className="secondary-cta" onClick={onOpenArticles}>Abrir notícias</button></article>
        <article className="panel"><span className="admin-kicker">2 · PUBLICAÇÃO</span><h3>Escreva e salve</h3><p>Em <strong>Notícias</strong>, crie sua publicação. O rascunho é salvo automaticamente para evitar perda de conteúdo.</p><button className="secondary-cta" onClick={onOpenArticles}>Abrir notícias</button></article>
        <article className="panel"><span className="admin-kicker">3 · SEU CONTEÚDO</span><h3>{isColumnist ? "Sua coluna é sua área de edição" : "Suas matérias são sua área de edição"}</h3><p>Você pode editar apenas o conteúdo que pertence a você. Publicações de outros autores ficam disponíveis para leitura e comparação, sem alteração.</p></article>
        <article className="panel"><span className="admin-kicker">4 · EDITOR</span><h3>O que acontece depois?</h3><p>Use o checklist editorial, revise o texto e encaminhe a publicação pelo fluxo do PCH News. A redação pode revisar e administrar o conteúdo conforme seu papel.</p></article>
      </div>
      <div className="panel" style={{ marginTop: 14 }}><strong>Atalhos importantes</strong><p style={{ marginBottom: 0 }}>✍️ Notícias · 🖼️ Mídia · 📊 Estatísticas · 👤 Meu perfil</p><small>Você também pode abrir o guia novamente pelo botão de ajuda do painel.</small></div>
      <div className="editor-actions"><button className="secondary-cta" onClick={onClose}>Entendi, começar</button></div>
    </section>
  </div>;
}

function formatSchedule(value?: string) {
  if (!value) return "horário não definido";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

function AccessSettings({ users, onRoleChange }: { users: AccessUser[]; onRoleChange: (openId: string, role: AccessUser["role"]) => void }) {
  return <div className="columnist-settings"><div className="admin-heading compact"><div><span className="admin-kicker">CONTROLE DE ACESSO</span><h1>Equipe<span>.</span></h1><p>As contas são autenticadas pelo PCH News com e-mail e senha, e os papéis ficam persistidos no banco.</p></div><span className="team-count"><Users size={16} /> {users.filter((person) => ["admin","editor","journalist","columnist","reviewer"].includes(person.role)).length} {users.filter((person) => ["admin","editor","journalist","columnist","reviewer"].includes(person.role)).length === 1 ? "membro editorial" : "membros editoriais"}</span></div><section className="panel team-panel"><div className="panel-heading"><div><span className="admin-kicker">USUÁRIOS AUTENTICADOS</span><h2>Equipe editorial</h2></div></div>{users.length === 0 ? <div className="media-empty"><Users size={28} /><strong>Nenhuma conta sincronizada ainda</strong><span>Quando alguém entrar no PCH News, aparecerá nesta lista.</span></div> : <div className="columnist-list">{users.map((person) => <div className="columnist-row" key={person.openId}><div className="columnist-avatar">{(person.name || person.email || "U").split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase()}</div><div className="columnist-copy"><strong>{person.name || "Sem nome"}</strong><small>{person.email || person.openId}</small><span>Último acesso: {new Date(person.lastSignedIn).toLocaleString("pt-BR")}</span></div><select className="role-select" value={person.role} onChange={(event) => onRoleChange(person.openId, event.target.value as AccessUser["role"])}><option value="user">Leitor</option><option value="editor">Editor</option><option value="journalist">Jornalista</option><option value="columnist">Colunista</option><option value="reviewer">Revisor</option><option value="admin">Administrador</option></select></div>)}</div>}<p className="editor-note">Leitor: sem acesso ao painel. Jornalista e colunista: atuam nas próprias publicações conforme as políticas editoriais. Editor e revisor: atuam no fluxo editorial conforme as permissões. Administrador: gerencia toda a redação e os acessos.</p></section><InvitePanel /></div>;
}
function ProfileCommercialAdmin({ profiles, onToggle }: { profiles: Record<string, ProfileData>; onToggle: (profile: ProfileData, approved: boolean) => void }) {
  const items = Object.values(profiles).filter((profile) => {
    try { const parsed = typeof profile.productsJson === "string" ? JSON.parse(profile.productsJson || "[]") : profile.productsJson; return Array.isArray(parsed) && parsed.length > 0; } catch { return false; }
  });
  return <section className="panel team-panel profile-commercial-admin"><div className="panel-heading"><div><span className="admin-kicker">DIVULGAÇÃO PROFISSIONAL</span><h2>Produtos e serviços dos perfis</h2></div></div>{items.length === 0 ? <p className="editor-note">Nenhum profissional cadastrou produto ou serviço ainda.</p> : <div className="columnist-list">{items.map((profile) => <div className="columnist-row" key={profile.slug}><div className="columnist-avatar">{getInitials(profile.name)}</div><div className="columnist-copy"><strong>{profile.name}</strong><small>{profile.beat}</small><span>{profile.commercialApproved ? "Divulgação aprovada para exibição pública." : "Aguardando aprovação do administrador."}</span></div><button className={profile.commercialApproved ? "secondary-cta" : "primary-cta"} onClick={() => onToggle(profile, !profile.commercialApproved)}>{profile.commercialApproved ? "Retirar aprovação" : "Aprovar divulgação"}</button></div>)}</div>}<p className="editor-note">A divulgação fica separada do conteúdo editorial e é identificada no perfil público.</p></section>;
}

function InvitePanel() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [lastUrl, setLastUrl] = useState("");
  const [inviteRole, setInviteRole] = useState<"columnist" | "journalist" | "editor" | "reviewer">("columnist");
  const [delivery, setDelivery] = useState("");
  const [editingInvite, setEditingInvite] = useState<any>(null);
  const { data: invites = [], refetch } = trpc.invites.list.useQuery(undefined, { refetchInterval: 10000 });
  const create = trpc.invites.create.useMutation({ onSuccess: (invite) => { refetch(); setEmail(""); setName(""); setLastUrl(`${window.location.origin}${invite.inviteUrl}`); setDelivery(invite.emailSent ? "E-mail enviado pelo SMTP." : invite.smtpConfigured ? "Convite criado, mas o SMTP não confirmou o envio." : "Convite criado. Use WhatsApp, e-mail ou copie o link abaixo."); } });
  const resend = trpc.invites.resend.useMutation({ onSuccess: (result) => { refetch(); setEditingInvite(null); setLastUrl(`${window.location.origin}${result.inviteUrl}`); setDelivery(result.emailSent ? "Convite reenviado pelo SMTP. A validade foi renovada por 7 dias." : result.smtpConfigured ? "Convite renovado, mas o SMTP não confirmou o envio." : "Convite renovado. Você pode enviar por WhatsApp, e-mail ou copiar o link."); }, onError: (error) => setDelivery(error.message) });
  const revoke = trpc.invites.revoke.useMutation({ onSuccess: () => refetch() });
  const release = trpc.invites.release.useMutation({ onSuccess: (result) => { refetch(); setDelivery(result.existingUser ? "Acesso liberado manualmente. A conta já existente recebeu a função do convite." : "Liberação manual registrada. O convite continua disponível para concluir o acesso."); }, onError: (error) => setDelivery(error.message) });
  const deleteInvite = trpc.invites.delete.useMutation({ onSuccess: () => { refetch(); setDelivery("Convite removido da lista administrativa."); } });
  const submit = (event: FormEvent) => { event.preventDefault(); create.mutate({ email, name, role: inviteRole }); };
  const messageFor = (invite: any, url: string) => `Olá, ${invite.name}! Você foi convidado(a) para fazer parte da equipe editorial do PCH News como ${invite.role === "columnist" ? "Colunista" : invite.role === "journalist" ? "Jornalista" : invite.role === "editor" ? "Editor" : "Revisor"}. Acesse este link para aceitar o convite: ${url}`;
  const shareWhatsApp = (invite: any, url = lastUrl) => { if (!url) return; window.open(`https://wa.me/?text=${encodeURIComponent(messageFor(invite, url))}`, "_blank", "noopener,noreferrer"); };
  const shareEmail = (invite: any, url = lastUrl) => { if (!url) return; window.location.href = `mailto:${encodeURIComponent(invite.email)}?subject=${encodeURIComponent("Convite para a equipe PCH News")}&body=${encodeURIComponent(messageFor(invite, url))}`; };
  const copyLink = async (url = lastUrl) => { if (!url) return; await navigator.clipboard?.writeText(url); setDelivery("Link do convite copiado."); };
  const resendInvite = (invite: any) => resend.mutate({ id: invite.id });
  const editAndResend = (invite: any) => {
    setEditingInvite(invite);
    setName(invite.name || "");
    setEmail(invite.email || "");
    setInviteRole((invite.role || (invite.id?.split("-")[1] as any) || "columnist") as typeof inviteRole);
  };
  const confirmEditAndResend = (event: FormEvent) => {
    event.preventDefault();
    if (!editingInvite) return;
    resend.mutate({ id: editingInvite.id, name, email, role: inviteRole });
  };
  const inviteRoleLabel = (role: string) => role === "columnist" ? "Colunista" : role === "journalist" ? "Jornalista" : role === "editor" ? "Editor" : "Revisor";
  return <section className="panel invite-panel">
    <div className="panel-heading"><div><span className="admin-kicker">NOVO ACESSO</span><h2>Convidar para a equipe</h2></div><Mail size={19} /></div>
    <p className="invite-intro">O convite é salvo com token protegido, expira em 7 dias e pode ser renovado sem cadastrar a pessoa novamente.</p>
    {!editingInvite ? <form className="invite-form" onSubmit={submit}>
      <label>Nome completo<input value={name} onChange={(event) => setName(event.target.value)} placeholder="Ex.: Ana Souza" required /></label>
      <label>Função<select value={inviteRole} onChange={(event) => setInviteRole(event.target.value as typeof inviteRole)}><option value="columnist">Colunista</option><option value="journalist">Jornalista</option><option value="editor">Editor</option><option value="reviewer">Revisor</option></select></label>
      <label>E-mail<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="ana@exemplo.com" required /></label>
      <button className="primary-cta" type="submit" disabled={create.isPending}><Mail size={15} /> {create.isPending ? "Enviando…" : "Enviar convite"}</button>
    </form> : <form className="invite-form invite-edit-form" onSubmit={confirmEditAndResend}>
      <div className="invite-edit-heading"><strong>Editar e reenviar convite</strong><button type="button" className="ghost-button" onClick={() => setEditingInvite(null)}>Cancelar</button></div>
      <label>Nome completo<input value={name} onChange={(event) => setName(event.target.value)} required /></label>
      <label>Função<select value={inviteRole} onChange={(event) => setInviteRole(event.target.value as typeof inviteRole)}><option value="columnist">Colunista</option><option value="journalist">Jornalista</option><option value="editor">Editor</option><option value="reviewer">Revisor</option></select></label>
      <label>E-mail<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
      <button className="primary-cta" type="submit" disabled={resend.isPending}><Mail size={15} /> {resend.isPending ? "Renovando…" : "Salvar e reenviar"}</button>
    </form>}
    {delivery && <p className="invite-delivery">{delivery}</p>}
    {lastUrl && <div className="invite-result"><span>Link de contingência</span><input readOnly value={lastUrl} /><button onClick={() => copyLink()}><Copy size={14} /> Copiar</button><button onClick={() => shareWhatsApp({ name: name || "Olá", email, role: inviteRole })}><MessageCircle size={14} /> WhatsApp</button><button onClick={() => shareEmail({ name: name || "Olá", email, role: inviteRole })}><Mail size={14} /> E-mail</button></div>}
    <div className="invite-list">{invites.slice(0, 12).map((invite: any) => {
      const role = invite.role || invite.id?.split("-")[1] || "columnist";
      const pending = !invite.acceptedAtMs && !invite.revokedAtMs && invite.expiresAtMs >= Date.now();
      const usable = !invite.acceptedAtMs;
      const url = lastUrl && lastUrl.includes("/convite/") && invite.id === editingInvite?.id ? lastUrl : "";
      return <div key={invite.id}>
        <span><strong>{invite.name}</strong><small>{invite.email}</small></span>
        <span className="invite-state">
          <em className={invite.acceptedAtMs ? "accepted" : invite.manualReleasedAtMs ? "accepted" : invite.openedAtMs ? "opened" : invite.revokedAtMs ? "revoked" : invite.expiresAtMs < Date.now() ? "expired" : "pending"}>{invite.acceptedAtMs ? "Aceito" : invite.manualReleasedAtMs ? "Liberado manualmente" : invite.openedAtMs ? "Link aberto — aguardando liberação" : invite.revokedAtMs ? "Revogado" : invite.expiresAtMs < Date.now() ? "Expirado" : "Enviado"}</em>
          {usable && !invite.acceptedAtMs && <button disabled={resend.isPending} onClick={() => editAndResend({ ...invite, role })}>Editar e reenviar</button>}
          {pending && <button disabled={resend.isPending} onClick={() => resendInvite({ ...invite, role })}>Reenviar</button>}
          {invite.openedAtMs && !invite.acceptedAtMs && !invite.manualReleasedAtMs && !invite.revokedAtMs && <button disabled={release.isPending} onClick={() => release.mutate({ id: invite.id })}><UserPlus size={13} /> {release.isPending ? "Liberando…" : "Liberar manualmente"}</button>}
          {pending && <button onClick={() => revoke.mutate({ id: invite.id })}>Revogar</button>}
          {!invite.acceptedAtMs && (invite.revokedAtMs || invite.expiresAtMs < Date.now()) && <button disabled={deleteInvite.isPending} onClick={() => { if (window.confirm("Excluir este convite da lista? O e-mail poderá ser convidado novamente no futuro.")) deleteInvite.mutate({ id: invite.id }); }}><Trash2 size={13} /> Apagar</button>}
          {lastUrl && invite.id === editingInvite?.id && <><button onClick={() => shareWhatsApp({ ...invite, role }, lastUrl)}><MessageCircle size={13} /> WhatsApp</button><button onClick={() => shareEmail({ ...invite, role }, lastUrl)}><Mail size={13} /> E-mail</button></>}
          {url && <button onClick={() => copyLink(url)}><Copy size={13} /> Copiar</button>}
        </span>
      </div>;
    })}</div>
  </section>;
}

function AdminAccountProfile({ user, roleLabel }: { user: ReturnType<typeof useAuth>["user"]; roleLabel: string }) { return <div className="profile-editor-page"><div className="admin-heading compact"><div><span className="admin-kicker">CONTA ADMINISTRATIVA</span><h1>Meu perfil<span>.</span></h1><p>Identidade da conta que está autenticada no painel editorial.</p></div><div className="profile-edit-preview"><div className="top-avatar">{getInitials(user?.name || user?.email || "PN")}</div><span>{user?.name || "PCH News"}</span></div></div><div className="profile-edit-layout"><section className="panel profile-edit-card"><div className="panel-heading"><div><span className="admin-kicker">CONTA</span><h2>Dados de acesso</h2></div></div><label>Nome<input value={user?.name || ""} readOnly /></label><label>E-mail<input value={user?.email || ""} readOnly /></label><label>Perfil de acesso<input value={roleLabel} readOnly /></label><p className="editor-note">Este painel administrativo não usa o perfil público de um colunista. Os dados editoriais públicos são mantidos separadamente em seus respectivos perfis.</p></section></div></div> }

function ProfileEditor({ profile, onSave, onUpload, notify }: { profile: ProfileData; onSave: (profile: ProfileData) => void; onUpload: (file: File, setUrl: (url: string) => void) => void; notify: (message: string) => void }) {
  const [draft, setDraft] = useState(profile);
  useEffect(() => setDraft(profile), [profile]);
  const update = (key: keyof ProfileData, value: string) => setDraft((current) => ({ ...current, [key]: value }));
  const upload = (event: React.ChangeEvent<HTMLInputElement>) => { const file = event.target.files?.[0]; if (!file || !file.type.startsWith("image/")) { notify("Escolha uma imagem válida."); return; } onUpload(file, (url) => update("photo", url)); };
  return <div className="profile-editor-page"><div className="admin-heading compact"><div><span className="admin-kicker">IDENTIDADE EDITORIAL</span><h1>Meu perfil<span>.</span></h1><p>Atualize como os leitores conhecem seu trabalho no PCH News.</p></div><div className="profile-edit-preview"><img src={draft.photo} alt="" /><span>{draft.name}</span></div></div><div className="profile-edit-layout"><section className="panel profile-edit-card"><div className="panel-heading"><div><span className="admin-kicker">APRESENTAÇÃO</span><h2>Informações públicas</h2></div></div><label>Nome<input value={draft.name} onChange={(e) => update("name", e.target.value)} /></label><label>Área de atuação<input value={draft.beat} onChange={(e) => update("beat", e.target.value)} /></label><label>Biografia<textarea value={draft.bio} onChange={(e) => update("bio", e.target.value)} rows={5} placeholder="Conte brevemente sobre seu trabalho" /></label><label>Foto de perfil<input type="file" accept="image/*" onChange={upload} /></label><button className="primary-cta" onClick={() => onSave(draft)}><Check size={15} /> Salvar perfil</button></section><section className="panel profile-edit-card"><div className="panel-heading"><div><span className="admin-kicker">CANAIS</span><h2>Redes sociais</h2></div></div><label>Instagram<input value={draft.instagram} onChange={(e) => update("instagram", e.target.value)} placeholder="@seuperfil" /></label><label>Facebook<input value={draft.facebook} onChange={(e) => update("facebook", e.target.value)} placeholder="seu.perfil" /></label><label>X / Twitter<input value={draft.x} onChange={(e) => update("x", e.target.value)} placeholder="@seuperfil" /></label><label>LinkedIn<input value={draft.linkedin} onChange={(e) => update("linkedin", e.target.value)} placeholder="seu-perfil" /></label><label>YouTube<input value={draft.youtube || ""} onChange={(e) => update("youtube", e.target.value)} placeholder="https://youtube.com/@seucanal" /></label><label>Site pessoal<input value={draft.website || ""} onChange={(e) => update("website", e.target.value)} placeholder="https://seusite.com.br" /></label><label>TikTok<input value={draft.tiktok || ""} onChange={(e) => update("tiktok", e.target.value)} placeholder="@seuperfil" /></label><p className="editor-note">Os links aparecem no seu perfil público e abrem em uma nova aba.</p></section><section className="panel profile-edit-card"><div className="panel-heading"><div><span className="admin-kicker">ESPAÇO PROFISSIONAL</span><h2>Produtos e serviços</h2></div></div><p className="editor-note">Você pode apresentar até 6 produtos ou serviços. A divulgação fica separada do conteúdo editorial e só aparece publicamente após aprovação.</p><label>Produtos e serviços<textarea rows={8} value={typeof draft.productsJson === "string" ? draft.productsJson : JSON.stringify(draft.productsJson || [], null, 2)} onChange={(e) => update("productsJson", e.target.value)} placeholder={'[{"title":"Meu produto","description":"Descrição curta","url":"https://...","ctaLabel":"Conheça","active":true}]'} /></label><p className="editor-note">Cada item pode ter nome, descrição, imagem, botão e link de venda. O administrador aprova a exibição pública.</p></section></div></div>;
}

function EditorialRequestsAdmin({ notify }: { notify: (message: string) => void }) {
  const query = trpc.editorialRequests.list.useQuery(undefined, { refetchInterval: 30000 });
  const update = trpc.editorialRequests.update.useMutation({ onSuccess: () => { query.refetch(); notify("Solicitação editorial atualizada."); } });
  const items = (query.data || []) as any[];
  return <div className="editorial-admin">
    <div className="admin-heading"><div><span className="admin-kicker">INTEGRIDADE EDITORIAL</span><h1>Correções e respostas<span>.</span></h1><p>Central de solicitações de correção, contexto, remoção e direito de resposta.</p></div><Link className="secondary-cta" href="/correcoes">Abrir canal público</Link></div>
    <div className="panel"><div className="panel-heading"><div><span className="admin-kicker">FILA DA REDAÇÃO</span><h2>{items.filter(x=>x.status==="pending"||x.status==="in_review").length} pendência(s)</h2></div></div>
      {query.isLoading ? <div className="media-empty compact-empty">Carregando solicitações…</div> : items.length === 0 ? <div className="media-empty compact-empty">Nenhuma solicitação registrada.</div> :
      <div className="editorial-request-admin-list">{items.map(item => <article key={item.id} className="editorial-request-admin-card"><div><span className="admin-kicker">{item.requestType === "right_of_reply" ? "DIREITO DE RESPOSTA" : item.requestType === "correction" ? "CORREÇÃO" : item.requestType === "context" ? "CONTEXTO" : "REMOÇÃO"}</span><h3>{item.articleId || "Solicitação sem matéria identificada"}</h3><p><strong>{item.name}</strong> · {item.email}{item.organization ? <> · {item.organization}</> : null}</p><p>{item.reason}</p><small>{new Intl.DateTimeFormat("pt-BR",{dateStyle:"short",timeStyle:"short"}).format(new Date(item.createdAtMs))}</small></div><div className="editorial-request-admin-actions"><select value={item.status} onChange={e=>update.mutate({id:item.id,status:e.target.value as any,responseText:item.responseText||undefined})}><option value="pending">Pendente</option><option value="in_review">Em análise</option><option value="accepted">Aceita</option><option value="rejected">Rejeitada</option><option value="published">Publicada</option></select><textarea defaultValue={item.responseText||""} placeholder="Resposta da redação…" onBlur={e=>{const v=e.currentTarget.value;if(v!== (item.responseText||"")) update.mutate({id:item.id,status:item.status,responseText:v||undefined})}} /></div></article>)}</div>}
    </div>
  </div>;
}

function MediaLibrary({ media, onUpload, onDelete, deletingId }: { media: MediaAsset[]; onUpload: (event: React.ChangeEvent<HTMLInputElement>) => void; onDelete: (id: string) => void; deletingId?: string | null }) {
  return <div className="media-library"><div className="admin-heading compact"><div><span className="admin-kicker">BIBLIOTECA DE MÍDIA</span><h1>Imagens<span>.</span></h1><p>Faça upload e reutilize imagens diretamente nas suas notícias.</p></div><label className="primary-cta upload-label"><Upload size={16} /> Adicionar imagem<input type="file" accept="image/*" onChange={onUpload} /></label></div>{media.length === 0 ? <div className="panel media-empty"><ImagePlus size={28} /><strong>Sua galeria está vazia</strong><span>Adicione a primeira imagem para usar no editor.</span></div> : <div className="media-grid">{media.map((asset) => <div className="media-card" key={asset.id}><button type="button" className="media-image-button" onClick={() => window.open(asset.src, "_blank", "noopener,noreferrer")} aria-label={`Abrir imagem ${asset.name}`} title="Abrir imagem em tamanho completo"><img src={asset.src} alt={asset.name} /></button><div className="media-card-info"><strong title={asset.name}>{asset.name}</strong><small>{asset.size} · {asset.createdAt}</small><button type="button" className="media-remove-button" disabled={deletingId === asset.id} onClick={() => onDelete(asset.id)}><Trash2 size={13} /> {deletingId === asset.id ? "Removendo…" : "Remover"}</button></div></div>)}</div>}</div>;
}

function MediaPickerModal({ media, mode, onUpload, onDelete, onClose, onSelect }: { media: MediaAsset[]; mode: "body" | "cover"; onUpload: (file: File) => Promise<MediaAsset | null>; onDelete: (id: string) => void; onClose: () => void; onSelect: (asset: MediaAsset) => void }) {
  const [busy, setBusy] = useState(false);
  const upload = async (event: React.ChangeEvent<HTMLInputElement>) => { const file = event.target.files?.[0]; event.target.value = ""; if (!file) return; setBusy(true); const asset = await onUpload(file); setBusy(false); if (asset) onSelect(asset); };
  return <div className="media-picker-overlay"><button className="overlay-dismiss" onClick={onClose} aria-label="Fechar galeria" /><section className="media-picker"><div className="editor-header"><div><span className="admin-kicker">GALERIA DE MÍDIA</span><h2>{mode === "cover" ? "Escolher imagem principal" : "Inserir imagem no texto"}</h2></div><button className="close-editor" onClick={onClose}><X size={18} /></button></div><label className="cover-upload-button picker-upload">{busy ? "Enviando..." : "Enviar nova imagem do computador"}<input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={upload} disabled={busy} hidden /></label>{media.length === 0 ? <div className="media-empty compact-empty"><ImagePlus size={23} /><span>Nenhuma imagem na galeria ainda. Envie uma acima.</span></div> : <div className="picker-grid">{media.map((asset) => <div className="picker-item" key={asset.id}><button type="button" className="picker-image-button" onClick={() => onSelect(asset)} title={`Selecionar ${asset.name}`}><img src={asset.src} alt={asset.name} /><span>{asset.name}</span></button><button type="button" className="picker-remove-button" disabled={deletingId === asset.id} onClick={(event) => { event.stopPropagation(); onDelete(asset.id); }} aria-label={`Remover ${asset.name}`} title="Remover da galeria"><Trash2 size={13} /> {deletingId === asset.id ? "…" : "Remover"}</button></div>)}</div>}</section></div>;
}

function HostingPressPanel() {
  return <section className="panel">
    <div className="panel-heading">
      <div>
        <span className="admin-kicker">INTEGRAÇÃO</span>
        <h2>HostingPress</h2>
        <p>Acesse o painel da HostingPress sem sair do fluxo de administração do PCH News.</p>
      </div>
    </div>
    <div className="panel-body" style={{ padding: 24 }}>
      <div style={{ display: "grid", gap: 16, maxWidth: 760 }}>
        <div style={{ border: "1px solid var(--border, #e5e7eb)", borderRadius: 16, padding: 22, background: "var(--card, #fff)" }}>
          <span className="admin-kicker">PAINEL HOSTINGPRESS</span>
          <h3 style={{ margin: "8px 0 8px" }}>Abrir HostingPress</h3>
          <p style={{ margin: "0 0 18px", lineHeight: 1.6 }}>
            O painel da HostingPress não permite carregamento dentro de outra página. Por isso, o acesso é aberto em uma nova aba, preservando a sessão e a segurança do serviço.
          </p>
          <a
            className="primary-cta"
            href="https://hostingpress.com.br/login"
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalLink size={16} /> Entrar na HostingPress
          </a>
        </div>
        <div style={{ borderRadius: 14, padding: 16, background: "var(--muted, #f8fafc)" }}>
          <strong>Próxima etapa</strong>
          <p style={{ margin: "6px 0 0", lineHeight: 1.5 }}>
            Depois de validarmos o acesso, podemos conectar a publicação do PCH News à HostingPress por integração oficial, sem depender de iframe.
          </p>
        </div>
      </div>
    </div>
  </section>;
}

function PlaceholderView({ icon: Icon, title, description, action, onAction }: { icon: typeof Settings; title: string; description: string; action: string; onAction: () => void }) {
  return <div className="placeholder-view"><div className="placeholder-icon"><Icon size={28} /></div><span className="admin-kicker">EM CONSTRUÇÃO</span><h1>{title}<span>.</span></h1><p>{description}</p><button className="primary-cta" onClick={onAction}><Plus size={17} /> {action}</button></div>;
}

