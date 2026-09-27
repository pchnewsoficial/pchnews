import { useMemo, useState } from "react";
import { CheckCircle2, CircleAlert, ShieldCheck, SearchCheck, Sparkles, Wand2, Share2, FileCheck2 } from "lucide-react";
import { FreedomReviewPanel } from "@/components/FreedomReviewPanel";
import { trpc } from "@/lib/trpc";
import type { NewsArticle } from "@/lib/news";

type Agent = {
  id: "journalism-master-orchestrator" | "story-editor" | "fact-checker" | "seo-optimization-specialist" | "ethics-advisor" | "liberdade-editorial" | "publication-readiness" | "multi-platform-distributor";
  name: string;
  description: string;
  icon: typeof Sparkles;
};

const AGENTS: Agent[] = [
  { id: "journalism-master-orchestrator", name: "Orquestrador da redação", description: "Executa o fluxo completo de revisão antes da publicação.", icon: Sparkles },
  { id: "story-editor", name: "Story Editor", description: "Revisa clareza, estrutura, concisão e problemas de texto.", icon: Wand2 },
  { id: "fact-checker", name: "Fact Checker", description: "Localiza datas, números, citações e pontos que pedem fonte.", icon: SearchCheck },
  { id: "seo-optimization-specialist", name: "SEO", description: "Analisa título, resumo, tags e sugere slug/meta.", icon: Sparkles },
  { id: "ethics-advisor", name: "Ethics Advisor", description: "Sinaliza linguagem acusatória, absoluta ou sensacionalista.", icon: ShieldCheck },
  { id: "liberdade-editorial", name: "Liberdade Editorial", description: "Tolerajornal: fato x opinião, contexto, fontes, contraponto e lide completo.", icon: ShieldCheck },
  { id: "publication-readiness", name: "Publication Readiness", description: "Confere se a matéria está completa para ir ao ar.", icon: FileCheck2 },
  { id: "multi-platform-distributor", name: "Distribuição", description: "Prepara versões para Instagram, Facebook, X, WhatsApp e YouTube.", icon: Share2 },
];

export default function EditorialAgents({ articles, isAdmin, currentAuthor, notify }: { articles: NewsArticle[]; isAdmin: boolean; currentAuthor: string; notify: (message: string) => void }) {
  const visible = useMemo(() => articles.filter((article) => isAdmin || article.author === currentAuthor), [articles, isAdmin, currentAuthor]);
  const [articleId, setArticleId] = useState(visible[0]?.id || "");
  const [selectedAgent, setSelectedAgent] = useState<Agent["id"]>("journalism-master-orchestrator");
  const [result, setResult] = useState<any>(null);
  const decision = trpc.editorialAgents.decideFinding.useMutation();
  const [decisions, setDecisions] = useState<Record<string, "pending" | "accepted" | "rejected">>({});
  const run = trpc.editorialAgents.run.useMutation({ onSuccess: (data) => { setResult(data); notify("Agente executado e resultado registrado no histórico editorial."); }, onError: (error) => notify(error.message) });
  const article = visible.find((item) => item.id === articleId) || visible[0];

  const execute = (agentId: Agent["id"]) => {
    if (!article) return;
    setSelectedAgent(agentId);
    run.mutate({
      articleId: article.id,
      agentId,
      article: {
        id: article.id,
        title: article.title,
        category: article.category,
        author: article.author,
        summary: article.summary,
        bodyHtml: article.bodyHtml || "",
        image: article.image || "",
        tags: JSON.stringify(article.tags || []),
        status: article.status,
        scheduledAt: article.scheduledAt ? new Date(article.scheduledAt).getTime() : null,
        region: article.region || null,
        state: article.state || null,
        country: article.country || null
      }
    });
  };

  if (!article) return <div className="placeholder-view"><div className="placeholder-icon"><Sparkles size={28} /></div><span className="admin-kicker">AGENTES EDITORIAIS</span><h1>Nenhuma matéria disponível<span>.</span></h1><p>Crie uma notícia para ativar o fluxo de revisão assistida.</p></div>;

  return <div className="editorial-agents-page">
    <div className="admin-heading compact">
      <div><span className="admin-kicker">NEWSROOM AI</span><h1>Agentes editoriais<span>.</span></h1><p>Skills especializadas para editar, revisar, checar e preparar uma matéria. A decisão final continua humana.</p></div>
      <div className="agent-gate"><ShieldCheck size={16} /> Publicação não é automática</div>
    </div>
    <section className="panel agent-control-panel">
      <div className="panel-heading"><div><span className="admin-kicker">MATÉRIA EM ANÁLISE</span><h2>Escolha a publicação</h2></div></div>
      <select className="agent-article-select" value={article.id} onChange={(event) => { setArticleId(event.target.value); setResult(null); }}>
        {visible.map((item) => <option key={item.id} value={item.id}>{item.title} — {statusLabels[item.status] || item.status}</option>)}
      </select>
      <div className="agent-grid">
        {AGENTS.map((agent) => { const Icon = agent.icon; return <button type="button" key={agent.id} className={selectedAgent === agent.id ? "agent-card active" : "agent-card"} onClick={() => execute(agent.id)} disabled={run.isPending}>
          <span className="agent-card-icon"><Icon size={18} /></span><strong>{agent.name}</strong><small>{agent.description}</small><em>{run.isPending && selectedAgent === agent.id ? "Executando…" : "Executar"}</em>
        </button>; })}
      </div>
    </section>
    {result && <section className="panel agent-result-panel">
      <div className="panel-heading"><div><span className="admin-kicker">{result.agentName}</span><h2>Resultado da análise</h2></div><AgentStatus status={result.status} /></div>
      <div className="agent-findings">{(result.findings || []).length === 0 ? <div className="agent-empty"><CheckCircle2 size={20} /><span>Nenhum alerta encontrado nesta execução.</span></div> : result.findings.map((finding: any, index: number) => { const code = finding.code || finding.ruleId || `finding-${index}`; const decisionState = decisions[code] || "pending"; return <div className={"agent-finding " + finding.severity} key={code + index}><span>{finding.severity === "block" ? <CircleAlert size={17} /> : finding.severity === "warning" ? <CircleAlert size={17} /> : <CheckCircle2 size={17} />}</span><div><strong>{finding.message}</strong>{finding.suggestion && <small>{finding.suggestion}</small>}<div className="finding-decision-actions"><button type="button" className={decisionState === "accepted" ? "active" : ""} onClick={() => { if (!result.runId || !article) return; decision.mutate({ id: `${result.runId}-${code}-${article.id}`, articleId: article.id, agentRunId: result.runId, findingCode: code, decision: "accepted" }, { onSuccess: () => setDecisions((d) => ({ ...d, [code]: "accepted" })) }); }}>Aceitar</button><button type="button" className={decisionState === "rejected" ? "active" : ""} onClick={() => { if (!result.runId || !article) return; decision.mutate({ id: `${result.runId}-${code}-${article.id}`, articleId: article.id, agentRunId: result.runId, findingCode: code, decision: "rejected" }, { onSuccess: () => setDecisions((d) => ({ ...d, [code]: "rejected" })) }); }}>Rejeitar</button><span>{decisionState === "pending" ? "Pendente" : decisionState === "accepted" ? "Aceito" : "Rejeitado"}</span></div></div></div>; })}</div>
      {result.output?.researchContext && <div className="editor-review-result review"><strong>Contexto de pesquisa do API HUB</strong><div className="editor-review-item"><b>FONTES</b><span>{result.output.researchContext.sources?.length || 0} fonte(s) externas para conferência.</span></div><div className="editor-review-item"><b>DADOS</b><span>{result.output.researchContext.economic?.length || 0} série(s) econômica(s) · {result.output.researchContext.chamber?.length || 0} registro(s) da Câmara · {result.output.researchContext.weather ? "clima disponível" : "sem clima"}.</span></div></div>}{(() => { const fr = result.agentId === "liberdade-editorial" ? result : (result.output?.agents || []).find((a: any) => a.agentId === "liberdade-editorial"); return fr ? <FreedomReviewPanel report={fr.output} /> : null; })()}<pre className="agent-output">{JSON.stringify(result.output, null, 2)}</pre>
    </section>}
  </div>;
}

function AgentStatus({ status }: { status: "pass" | "review" | "block" }) {
  const label = status === "pass" ? "APROVADO PELO AGENTE" : status === "review" ? "REVISÃO HUMANA" : "BLOQUEADO";
  return <span className={"agent-status " + status}>{label}</span>;
}
