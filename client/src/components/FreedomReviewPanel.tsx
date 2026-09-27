import { CheckCircle2, AlertTriangle, Info } from "lucide-react";

type Check = { ruleId: string; label: string; severity: "ok" | "info" | "warning" | "block"; message: string; evidence: string[]; action?: string };
type Report = { rulesetVersion: string; mission: string; contentType: "fato" | "opinião"; score: number; checks: Check[]; autonomy: { question: string; answer: string; blockingRules: string[] } };

export function TolerajornalMark({ compact = false }: { compact?: boolean }) {
  return <div className={compact ? "tj-mark compact" : "tj-mark"}><strong>PCH News</strong><span>informação para pensar por si mesmo</span></div>;
}

export function FreedomReviewPanel({ report }: { report: Report }) {
  const order = { block: 0, warning: 1, info: 2, ok: 3 } as const;
  const checks = [...report.checks].sort((a, b) => order[a.severity] - order[b.severity]);
  return <section className="tj-panel" aria-label="Liberdade Editorial">
    <header>
      <span className="tj-kicker">LIBERDADE EDITORIAL — PCH News</span>
      <p className="tj-mission">“{report.mission}”</p>
      <div className="tj-meta"><span className={"tj-type " + (report.contentType === "fato" ? "fact" : "opinion")}>{report.contentType === "fato" ? "CONTEÚDO FACTUAL" : "OPINIÃO"}</span><span>Índice de autonomia: <b>{report.score}/100</b></span><span>Regras {report.rulesetVersion}</span></div>
    </header>
    <ul className="tj-list">
      {checks.map((c, i) => <li key={c.ruleId + i} className={"tj-item " + c.severity}>
        <span className="tj-icon">{c.severity === "ok" ? <CheckCircle2 size={16} /> : c.severity === "info" ? <Info size={16} /> : <AlertTriangle size={16} />}</span>
        <div>
          <strong>{c.severity === "ok" ? "✓" : "⚠"} {c.label}</strong> <code>{c.ruleId}</code>
          <p>{c.message}</p>
          {c.evidence.length > 0 && <details><summary>Evidência ({c.evidence.length})</summary><ul>{c.evidence.map((e, j) => <li key={j}>{e}</li>)}</ul></details>}
          {c.action && <small className="tj-action">Ação: {c.action}</small>}
        </div>
      </li>)}
    </ul>
    <footer className={"tj-autonomy " + report.autonomy.answer}>
      <strong>{report.autonomy.question}</strong>
      <span>Resposta: {report.autonomy.answer.toUpperCase()}{report.autonomy.blockingRules.length ? ` — regras pendentes: ${report.autonomy.blockingRules.join(", ")}` : ""}</span>
      <small>Este motor não avalia posições políticas nem favorece nenhum ator; verifica contexto, fontes, transparência e pluralidade.</small>
    </footer>
  </section>;
}
