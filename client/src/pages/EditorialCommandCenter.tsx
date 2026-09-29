import { useMemo } from "react";
import { Activity, AlertTriangle, ArrowRight, Bot, CalendarClock, CheckCircle2, FileText, ListChecks, Megaphone, PenLine, Users } from "lucide-react";
import { trpc } from "@/lib/trpc";
import type { NewsArticle } from "@/lib/news";

export default function EditorialCommandCenter({ articles, isAdmin, onNavigate }: { articles: NewsArticle[]; isAdmin: boolean; onNavigate: (view: string) => void }) {
  const { data: pautas = [] } = trpc.pauta.list.useQuery(undefined, { enabled: Boolean(isAdmin), retry: false, refetchInterval: 10000 });
  const published = articles.filter((a) => ["published","updated"].includes(a.status)).length;
  const review = articles.filter((a) => a.status === "review").length;
  const scheduled = articles.filter((a) => a.status === "scheduled").length;
  const drafts = articles.filter((a) => a.status === "draft").length;
  const latePautas = (pautas as any[]).filter((p) => p.deadlineAtMs && p.deadlineAtMs < Date.now() && !["published","archived"].includes(p.status)).length;
  const activePautas = (pautas as any[]).filter((p) => !["published","archived"].includes(p.status)).length;
  const readyPautas = (pautas as any[]).filter((p) => p.status === "ready").length;
  const urgentPautas = (pautas as any[]).filter((p) => ["urgent","high"].includes(p.priority) && !["published","archived"].includes(p.status)).length;
  const queues = useMemo(() => [
    { label: "Pautas em andamento", value: activePautas, icon: ListChecks, view: "pauta", note: `${readyPautas} prontas para virar matéria` },
    { label: "Matérias em revisão", value: review, icon: Bot, view: "articles", note: "passar pelos agentes antes de aprovar" },
    { label: "Agendadas", value: scheduled, icon: CalendarClock, view: "articles", note: "aguardando publicação" },
    { label: "Rascunhos", value: drafts, icon: PenLine, view: "articles", note: "conteúdo ainda em produção" },
  ], [activePautas, readyPautas, review, scheduled, drafts]);
  return <div className="editorial-command-center">
    <section className="admin-heading"><div><span className="admin-kicker">CENTRO EDITORIAL</span><h1>Comando da redação<span>.</span></h1><p>Visão operacional do PCH News: pauta, produção, revisão, publicação e auditoria em um único lugar.</p></div><div className="command-live"><Activity size={15}/> Atualização automática</div></section>
    <section className="command-kpis"><div><FileText size={19}/><strong>{published}</strong><span>Publicadas</span></div><div><Bot size={19}/><strong>{review}</strong><span>Em revisão</span></div><div><CalendarClock size={19}/><strong>{scheduled}</strong><span>Agendadas</span></div><div><ListChecks size={19}/><strong>{activePautas}</strong><span>Pautas ativas</span></div></section>
    <section className="command-grid">{queues.map((q) => <button key={q.label} className="command-queue" onClick={() => onNavigate(q.view)}><q.icon size={20}/><div><strong>{q.label}</strong><span>{q.note}</span></div><b>{q.value}</b><ArrowRight size={17}/></button>)}</section>
    <section className="command-alerts"><div className={"command-alert " + (latePautas ? "warning" : "ok")}><AlertTriangle size={18}/><div><strong>{latePautas ? `${latePautas} pauta(s) atrasada(s)` : "Nenhuma pauta atrasada"}</strong><span>{latePautas ? "Abra a pauta e redistribua o prazo ou responsável." : "A fila de pauta está dentro dos prazos registrados."}</span></div></div><div className={"command-alert " + (urgentPautas ? "warning" : "ok")}><ListChecks size={18}/><div><strong>{urgentPautas ? `${urgentPautas} pauta(s) de alta prioridade` : "Sem pautas urgentes"}</strong><span>Prioridade é definida pelo editor; os agentes apenas organizam e sinalizam.</span></div></div></section>
    {isAdmin && <section className="command-next"><div><div className="admin-kicker">CONTROLE</div><h2>Próximas ações da redação</h2><p>Os agentes continuam sem autonomia de publicação. O administrador libera funções e a equipe executa dentro das permissões.</p></div><div className="command-actions"><button onClick={() => onNavigate("agents")}><Bot size={16}/> Agentes editoriais</button><button onClick={() => onNavigate("team")}><Users size={16}/> Equipe e permissões</button><button onClick={() => onNavigate("audit")}><CheckCircle2 size={16}/> Auditoria</button><button onClick={() => onNavigate("ads")}><Megaphone size={16}/> Comercial</button></div></section>}
  </div>;
}
