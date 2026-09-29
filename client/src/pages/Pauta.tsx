import { useMemo, useState } from "react";
import { CalendarDays, Check, ChevronDown, CircleAlert, Edit3, Archive, ExternalLink, FilePlus2, Filter, ListChecks, Plus, Search, Target, UserRound, PanelLeft, PanelLeftClose, PanelRight, PanelRightClose, X, Sparkles } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { makeArticleId } from "@/lib/news";
import { EDITORIAL_AGENTS } from "./EditorialAgents";

type PautaStatus = "idea" | "planned" | "assigned" | "reporting" | "review" | "ready" | "published" | "archived";
type Priority = "low" | "normal" | "high" | "urgent";
type Source = { url: string; name: string; note: string; checked: boolean };
type ChecklistItem = { label: string; done: boolean };
type Pauta = {
  id: string; title: string; angle: string; briefing: string; category: string; priority: Priority; status: PautaStatus;
  assignedToOpenId: string | null; assignedToName: string | null; deadlineAtMs: number | null; plannedPublishAtMs: number | null;
  tags: string; sourcesJson: Source[]; checklistJson: ChecklistItem[]; articleId: string | null;
  createdByOpenId: string; createdByName: string | null; createdAtMs: number; updatedAtMs: number;
};
type AccessUser = { id: number; openId: string; name: string | null; email: string | null; role: "user" | "admin" | "editor" | "journalist" | "columnist" | "reviewer" };\ntype StudioNavGroup = { label: string; items: { id: string; label: string; icon: typeof FilePlus2 }[] };

const columns: Array<{ id: PautaStatus; label: string }> = [
  { id: "idea", label: "Ideias" }, { id: "planned", label: "Planejadas" }, { id: "assigned", label: "Atribuídas" },
  { id: "reporting", label: "Apuração" }, { id: "review", label: "Revisão" }, { id: "ready", label: "Prontas" }, { id: "published", label: "Publicadas" },
];
const priorityLabel: Record<Priority, string> = { low: "Baixa", normal: "Normal", high: "Alta", urgent: "Urgente" };
const statusLabel: Record<PautaStatus, string> = { idea: "Ideia", planned: "Planejada", assigned: "Atribuída", reporting: "Apuração", review: "Revisão", ready: "Pronta", published: "Publicada", archived: "Arquivada" };
const defaultChecklist: ChecklistItem[] = [
  { label: "Definir ângulo e lide", done: false }, { label: "Confirmar fonte primária", done: false },
  { label: "Conferir nomes, datas e números", done: false }, { label: "Contextualizar e buscar contraponto", done: false },
  { label: "Rodar revisão dos agentes editoriais", done: false },
];
const blank = { title: "", angle: "", briefing: "", category: "Brasil", priority: "normal" as Priority, status: "idea" as PautaStatus, assignedToOpenId: "", assignedToName: "", deadline: "", plannedPublish: "", tags: "", sourceUrl: "", sourceName: "", sourceNote: "", checklist: defaultChecklist };

function fmt(ms: number | null) {
  if (!ms) return "Sem prazo";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(ms));
}
function isLate(p: Pauta) { return Boolean(p.deadlineAtMs && p.deadlineAtMs < Date.now() && !["published", "archived"].includes(p.status)); }

export default function Pauta({ isAdmin, currentAuthor, accessUsers, notify, onOpenEditor, studioNavGroups, onStudioNavigate }: { isAdmin: boolean; currentAuthor: string; accessUsers: AccessUser[]; notify: (message: string) => void; onOpenEditor?: (articleId: string, pauta: Pauta) => void; studioNavGroups?: StudioNavGroup[]; onStudioNavigate?: (view: string) => void }) {
  const { user } = useAuth();
  const { data: remote = [], refetch } = trpc.pauta.list.useQuery(undefined, { enabled: Boolean(user), retry: false });
  const create = trpc.pauta.create.useMutation({ onSuccess: () => { refetch(); setModal(false); notify("Pauta criada e salva no banco."); } });
  const update = trpc.pauta.update.useMutation({ onSuccess: () => { refetch(); notify("Pauta atualizada."); } });
  const saveArticle = trpc.editorial.saveArticle.useMutation();
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Pauta | null>(null);
  const [draft, setDraft] = useState(blank);
  const [query, setQuery] = useState("");
  const [priority, setPriority] = useState<Priority | "all">("all");
  const [studioLeftOpen, setStudioLeftOpen] = useState(true);
  const [skillsOpen, setSkillsOpen] = useState(true);
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);\n  const [skillResult, setSkillResult] = useState<any>(null);\n  const { data: agentAccess } = trpc.editorialAgents.access.useQuery(undefined, { enabled: Boolean(user), retry: false });\n  const runSkill = trpc.editorialAgents.run.useMutation({ onSuccess: (data) => { setSkillResult(data); notify(data.agentName ? data.agentName + " executado na pauta." : "Skill executado na pauta."); }, onError: (error) => notify(error.message) });

  const pautas = (remote as any[]).map((p) => ({ ...p, sourcesJson: Array.isArray(p.sourcesJson) ? p.sourcesJson : [], checklistJson: Array.isArray(p.checklistJson) ? p.checklistJson : [] })) as Pauta[];
  const filtered = useMemo(() => pautas.filter(p => {
    const q = query.trim().toLowerCase();
    return (!q || [p.title, p.angle, p.briefing, p.category, p.assignedToName, p.tags].join(" ").toLowerCase().includes(q)) && (priority === "all" || p.priority === priority);
  }), [pautas, query, priority]);
  const metrics = {
    late: pautas.filter(isLate).length,
    reporting: pautas.filter(p => p.status === "reporting").length,
    ready: pautas.filter(p => p.status === "ready").length,
    published: pautas.filter(p => p.status === "published").length,
  };

  const openNew = () => { setEditing(null); setDraft({ ...blank }); setModal(true); };
  const openEdit = (p: Pauta) => {
    setEditing(p);
    const first = p.sourcesJson[0];
    setDraft({
      title: p.title, angle: p.angle, briefing: p.briefing, category: p.category, priority: p.priority, status: p.status,
      assignedToOpenId: p.assignedToOpenId || "", assignedToName: p.assignedToName || "", deadline: p.deadlineAtMs ? new Date(p.deadlineAtMs).toISOString().slice(0,16) : "",
      plannedPublish: p.plannedPublishAtMs ? new Date(p.plannedPublishAtMs).toISOString().slice(0,16) : "",
      tags: p.tags || "", sourceUrl: first?.url || "", sourceName: first?.name || "", sourceNote: first?.note || "", checklist: p.checklistJson?.length ? p.checklistJson : defaultChecklist,
    });
    setModal(true);
  };
  const savePauta = (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft.title.trim() || !draft.angle.trim()) { notify("Informe o título e o ângulo da pauta."); return; }
    const source = draft.sourceUrl.trim() ? [{ url: draft.sourceUrl.trim(), name: draft.sourceName.trim() || "Fonte principal", note: draft.sourceNote.trim(), checked: false }] : [];
    const payload = {
      id: editing?.id || `pauta-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
      title: draft.title.trim(), angle: draft.angle.trim(), briefing: draft.briefing.trim(), category: draft.category, priority: draft.priority, status: draft.status,
      assignedToOpenId: draft.assignedToOpenId || null, assignedToName: draft.assignedToName || null,
      deadlineAtMs: draft.deadline ? new Date(draft.deadline).getTime() : null, plannedPublishAtMs: draft.plannedPublish ? new Date(draft.plannedPublish).getTime() : null,
      tags: draft.tags.trim(), sourcesJson: source, checklistJson: draft.checklist?.length ? draft.checklist : defaultChecklist,
      articleId: editing?.articleId || null,
    };
    if (editing) update.mutate(payload as any); else create.mutate(payload as any);
    setModal(false);
  };

  const changeStatus = (p: Pauta, status: PautaStatus) => update.mutate({ ...p, status } as any);
  const toggleCheck = (p: Pauta, index: number) => {
    const checklist = p.checklistJson.map((item, i) => i === index ? { ...item, done: !item.done } : item);
    update.mutate({ ...p, checklistJson: checklist } as any);
  };

  const buildDraftArticle = async (p: Pauta) => {
    if (p.articleId) { notify("Esta pauta já está vinculada a uma notícia."); return; }
    try {
      const id = makeArticleId();
      await saveArticle.mutateAsync({
        id, title: p.title, category: p.category, author: p.assignedToName || currentAuthor, authorOpenId: p.assignedToOpenId || user?.openId || null,
        summary: p.briefing || p.angle, date: new Date().toLocaleDateString("pt-BR"), updated: "criada a partir da pauta", status: "draft", views: 0,
        image: "", bodyHtml: "<p>Rascunho criado a partir da pauta. Desenvolva a apuração e a narrativa antes de publicar.</p>",
        scheduledAt: null, tags: JSON.stringify((p.tags || "").split(",").map(x => x.trim()).filter(Boolean)), youtubeUrl: null, socialLinks: JSON.stringify({}),
        scope: "national", region: null, state: null, country: "Brasil", language: "pt-BR", featured: false, sourceUrl: p.sourcesJson[0]?.url || null, sourceName: p.sourcesJson[0]?.name || null,
        slug: null, seoTitle: p.title, metaDescription: p.briefing || p.angle, canonicalUrl: null, focusKeyword: null, ogTitle: p.title, ogDescription: p.briefing || p.angle, imageAlt: p.title, noindex: false,
      });
      await update.mutateAsync({ ...p, articleId: id, status: "reporting" } as any);
      notify("Rascunho criado e vinculado à pauta.");
      refetch();
      onOpenEditor?.(id, { ...p, articleId: id, status: "reporting" });
    } catch (e) { notify(e instanceof Error ? e.message : "Não foi possível criar o rascunho."); }
  };

  return <div className="pauta-page">
    <div className="admin-heading compact">
      <div><span className="admin-kicker">NEWSROOM DESK</span><h1>Pauta<span>.</span></h1><p>Do primeiro insight à publicação: organize apuração, responsáveis, fontes e prazos sem sair do PCH News.</p></div>
      <button className="primary-cta" onClick={openNew}><Plus size={17}/> Nova pauta</button>
    </div>
    <div className="pauta-metrics">
      <div className="pauta-metric"><CircleAlert size={17}/><strong>{metrics.late}</strong><span>Atrasadas</span></div>
      <div className="pauta-metric"><Target size={17}/><strong>{metrics.reporting}</strong><span>Em apuração</span></div>
      <div className="pauta-metric"><Check size={17}/><strong>{metrics.ready}</strong><span>Prontas</span></div>
      <div className="pauta-metric"><FilePlus2 size={17}/><strong>{metrics.published}</strong><span>Publicadas</span></div>
    </div>
    <div className="pauta-toolbar">
      <div className="admin-search"><Search size={17}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar pauta, ângulo, editoria ou responsável"/></div>
      <select className="category-filter" value={priority} onChange={e => setPriority(e.target.value as Priority | "all")}><option value="all">Todas as prioridades</option>{Object.entries(priorityLabel).map(([k,v]) => <option key={k} value={k}>{v}</option>)}</select>
      <div className="pauta-count"><ListChecks size={15}/> {filtered.length} pautas</div>
    </div>
    <div className="pauta-board">
      {columns.map(column => <section className="pauta-column" key={column.id}>
        <div className="pauta-column-head"><div><span>{column.label}</span><b>{filtered.filter(p => p.status === column.id).length}</b></div></div>
        <div className="pauta-column-body">
          {filtered.filter(p => p.status === column.id).map(p => <article className={`pauta-card ${isLate(p) ? "is-late" : ""}`} key={p.id}>
            <div className="pauta-card-top"><span className={`pauta-priority ${p.priority}`}>{priorityLabel[p.priority]}</span><button aria-label="Editar pauta" title="Editar pauta" onClick={() => openEdit(p)}><Edit3 size={15}/></button></div>
            <h3>{p.title}</h3><p>{p.angle}</p>
            <div className="pauta-meta"><span><UserRound size={13}/>{p.assignedToName || "Sem responsável"}</span><span><CalendarDays size={13}/>{fmt(p.deadlineAtMs)}</span></div>
            <div className="pauta-progress"><span><ListChecks size={13}/> {p.checklistJson.filter(x=>x.done).length}/{p.checklistJson.length}</span>{isLate(p) && <em>Atrasada</em>}</div>
            <div className="pauta-card-actions">
              <select value={p.status} onChange={e => changeStatus(p, e.target.value as PautaStatus)}><option value={p.status}>{statusLabel[p.status]}</option>{columns.filter(c=>c.id!==p.status).map(c=><option key={c.id} value={c.id}>{c.label}</option>)}</select>
              {!p.articleId && <button onClick={() => buildDraftArticle(p)} disabled={saveArticle.isPending}><FilePlus2 size={14}/> Criar notícia</button>}
              {p.articleId && <button type="button" onClick={() => onOpenEditor?.(p.articleId as string, p)}><Edit3 size={14}/> Abrir no editor</button>}{p.status !== "archived" && <button onClick={() => { if (window.confirm(`Arquivar “${p.title}”?`)) changeStatus(p, "archived"); }}><Archive size={14}/> Arquivar</button>}
            </div>
          </article>)}
          {filtered.filter(p => p.status === column.id).length === 0 && <div className="pauta-empty">Nenhuma pauta aqui.</div>}
        </div>
      </section>)}
    </div>

    {modal && <div className={`pauta-studio-overlay ${studioLeftOpen ? "pauta-studio-left-open" : "pauta-studio-left-closed"} ${skillsOpen ? "pauta-studio-skills-open" : "pauta-studio-skills-closed"}`}>
      <button className="pauta-studio-backdrop" onClick={() => setModal(false)} aria-label="Fechar estúdio" />
      <aside className="pauta-studio-left">
        <div className="pauta-studio-brand"><span className="admin-kicker">ESTÚDIO</span><strong>PCH News</strong></div>
        <div className="pauta-studio-nav">
          <span className="pauta-studio-nav-title">REDAÇÃO</span>
          <button className="active"><FilePlus2 size={16}/> Pauta</button>
          <button type="button"><Search size={16}/> Apuração</button>
          <button type="button"><Check size={16}/> Revisão</button>
          <button type="button"><ExternalLink size={16}/> Publicação</button>
        </div>
        <div className="pauta-studio-left-foot"><span>Workspace editorial</span><small>documento salvo no banco</small></div>
      </aside>

      <button type="button" className="pauta-studio-toggle pauta-studio-toggle-left" onClick={() => setStudioLeftOpen(v => !v)} aria-label={studioLeftOpen ? "Fechar painel do estúdio" : "Abrir painel do estúdio"} title={studioLeftOpen ? "Fechar estúdio" : "Abrir estúdio"}>
        {studioLeftOpen ? <PanelLeftClose size={17}/> : <PanelLeft size={17}/>}
      </button>

      <main className="pauta-studio-main">
        <form className="pauta-studio-paper" onSubmit={savePauta}>
          <header className="pauta-studio-header">
            <div>
              <span className="admin-kicker">{editing ? "EDITAR PAUTA" : "NOVA PAUTA"}</span>
              <h2>{editing ? "Refinar pauta" : "Abrir pauta"}</h2>
            </div>
            <button type="button" className="pauta-studio-close" onClick={() => setModal(false)} aria-label="Fechar"><X size={18}/></button>
          </header>

          <div className="pauta-studio-status"><span className="pauta-studio-dot"/> Rascunho de pauta · salvo após criar</div>

          <label className="pauta-studio-field pauta-studio-title">Título da pauta
            <input value={draft.title} onChange={e=>setDraft({...draft,title:e.target.value})} placeholder="Escreva o título da pauta..." autoFocus/>
          </label>
          <label className="pauta-studio-field">Ângulo editorial
            <input value={draft.angle} onChange={e=>setDraft({...draft,angle:e.target.value})} placeholder="Qual é a pergunta central que a matéria precisa responder?"/>
          </label>
          <label className="pauta-studio-field pauta-studio-briefing">Briefing
            <textarea rows={5} value={draft.briefing} onChange={e=>setDraft({...draft,briefing:e.target.value})} placeholder="Contexto, perguntas, personagens, dados e próximos passos."/>
          </label>

          <section className="pauta-studio-section">
            <div className="pauta-studio-section-title">DIRETRIZES DA PAUTA</div>
            <div className="pauta-studio-grid">
              <label> Editoria<select value={draft.category} onChange={e=>setDraft({...draft,category:e.target.value})}><option>Brasil</option><option>Política</option><option>Economia</option><option>Cidade</option><option>Cultura</option><option>Saúde</option><option>Esportes</option><option>Tecnologia</option><option>Opinião</option></select></label>
              <label> Prioridade<select value={draft.priority} onChange={e=>setDraft({...draft,priority:e.target.value as Priority})}>{Object.entries(priorityLabel).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></label>
              <label> Responsável<select value={draft.assignedToOpenId} onChange={e=>{const u=accessUsers.find(x=>x.openId===e.target.value);setDraft({...draft,assignedToOpenId:e.target.value,assignedToName:u?.name||u?.email||""})}} disabled={!isAdmin}><option value="">Sem responsável</option>{accessUsers.filter(u=>u.role==="columnist"||u.role==="admin").map(u=><option key={u.openId} value={u.openId}>{u.name||u.email}</option>)}</select></label>
              <label> Prazo<input type="datetime-local" value={draft.deadline} onChange={e=>setDraft({...draft,deadline:e.target.value})}/></label>
              <label> Publicação planejada<input type="datetime-local" value={draft.plannedPublish} onChange={e=>setDraft({...draft,plannedPublish:e.target.value})}/></label>
              <label> Tags <input value={draft.tags} onChange={e=>setDraft({...draft,tags:e.target.value})} placeholder="mobilidade, centro, entrevista"/></label>
            </div>
          </section>

          <section className="pauta-studio-section">
            <div className="pauta-studio-section-title">DOSSIÊ DE APURAÇÃO</div>
            <div className="pauta-studio-grid">
              <label>URL da fonte principal<input type="url" value={draft.sourceUrl} onChange={e=>setDraft({...draft,sourceUrl:e.target.value})} placeholder="https://..."/></label>
              <label>Nome da fonte<input value={draft.sourceName} onChange={e=>setDraft({...draft,sourceName:e.target.value})} placeholder="Ex.: Prefeitura"/></label>
            </div>
            <label className="pauta-studio-field">Observação da fonte<textarea rows={3} value={draft.sourceNote} onChange={e=>setDraft({...draft,sourceNote:e.target.value})} placeholder="O que esta fonte confirma ou ainda precisa ser verificado?"/></label>
          </section>

          <section className="pauta-studio-checklist">
            <div><span className="pauta-studio-section-title">CHECKLIST EDITORIAL</span><small>marque conforme a apuração avança</small></div>
            {(draft.checklist || defaultChecklist).map((item,i)=><button type="button" key={i} onClick={()=>setDraft({...draft,checklist:(draft.checklist || defaultChecklist).map((x,j)=>j===i?{...x,done:!x.done}:x)})}><span className={item.done ? "check-done" : "check-empty"}>{item.done && <Check size={11}/>}</span>{item.label}</button>)}
          </section>

          <footer className="pauta-studio-actions">
            <button type="button" className="secondary-cta" onClick={() => setModal(false)}>Cancelar</button>
            <button className="primary-cta" type="submit"><Check size={16}/> {editing ? "Salvar pauta" : "Criar pauta"}</button>
          </footer>
        </form>
      </main>

      <button type="button" className="pauta-studio-toggle pauta-studio-toggle-right" onClick={() => setSkillsOpen(v => !v)} aria-label={skillsOpen ? "Fechar skills" : "Abrir skills"} title={skillsOpen ? "Fechar skills" : "Abrir skills"}>
        {skillsOpen ? <PanelRightClose size={17}/> : <PanelRight size={17}/>}
      </button>

      <aside className="pauta-studio-skills">
        <div className="pauta-skills-head"><span className="pauta-skills-orb"><Sparkles size={15}/></span><strong>SKILLS</strong><button type="button" onClick={() => setSkillsOpen(false)} aria-label="Fechar skills"><PanelRightClose size={15}/></button></div>
        <div className="pauta-skills-list">
          {EDITORIAL_AGENTS.map(agent => {
            const Icon = agent.icon;
            return <button type="button" key={agent.id} className={selectedSkill === agent.id ? "active" : ""} title={agent.description} aria-label={agent.name} onClick={() => void executeSkill(agent)} disabled={!isAdmin && !agentAccess?.enabled || runSkill.isPending}>
              <Icon size={17}/><span>{agent.name}</span><small>{runSkill.isPending && selectedSkill === agent.id ? "Executando…" : (isAdmin || agentAccess?.enabled) ? "Executar" : "Não liberado"}</small>
            </button>;
          })}
        </div>
        {skillResult && <div className="pauta-skill-result"><strong>{skillResult.agentName}</strong><span>{skillResult.status === "pass" ? "Sem bloqueios" : skillResult.status === "block" ? "Atenção necessária" : "Revisão humana"}</span><small>{skillResult.findings?.length || 0} apontamento(s) registrados.</small></div>}<div className="pauta-skills-hint">Os nomes ficam visíveis quando o painel abre. Clique para executar o skill no contexto desta pauta.</div>
      </aside>
    </div>}
  </div>;
}
