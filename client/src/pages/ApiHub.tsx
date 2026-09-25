import { trpc } from "@/lib/trpc";

const statusLabel: Record<string, string> = { pronta: "Pronta", preparada: "Preparada", avaliar: "Avaliar" };
const healthLabel: Record<string, string> = { ok: "Operando", erro: "Com erro", "sem-chamadas": "Sem chamadas ainda" };
const fmt = (ms: number | null) => (ms ? new Date(ms).toLocaleString("pt-BR") : "—");

export default function ApiHub() {
  const { data, isLoading, isError, refetch, isFetching } = trpc.apiHub.status.useQuery(undefined, { refetchOnWindowFocus: false });
  const probe = trpc.apiHub.probe.useMutation({ onSettled: () => refetch() });
  return (
    <>
      <div className="admin-heading compact"><div><span className="admin-kicker">INTEGRAÇÕES</span><h1>API Hub<span>.</span></h1><p>Providers externos centralizados no servidor. Chaves nunca são exibidas.</p></div>
        <div className="heading-actions"><button className="secondary-cta" disabled={isFetching} onClick={() => refetch()}>Atualizar</button></div></div>
      {isLoading && <div className="panel">Carregando providers…</div>}
      {isError && <div className="panel">Não foi possível carregar o status. Verifique se você é administrador.</div>}
      {data && <div className="panel table-panel"><div className="news-table">
        <div className="table-head" style={{ gridTemplateColumns: "2fr 1fr 1fr 1fr 1.4fr 1fr" }}><span>PROVIDER</span><span>CATEGORIA</span><span>STATUS</span><span>CONFIGURAÇÃO</span><span>HEALTH</span><span /></div>
        {data.map((p) => <div className="table-row" key={p.id} style={{ gridTemplateColumns: "2fr 1fr 1fr 1fr 1.4fr 1fr" }}>
          <div><strong>{p.name}</strong><small style={{ display: "block" }}>{p.envVars.length ? p.envVars.join(", ") : "sem variáveis"}</small></div>
          <span className="category-cell">{p.category}</span>
          <span>{statusLabel[p.status]}</span>
          <span>{p.configured ? "Configurado" : p.requiresKey ? "Falta chave" : "Não configurado"}</span>
          <div><span>{healthLabel[p.health.state]}</span><small style={{ display: "block" }}>OK: {fmt(p.health.lastOkAt)} · falhas {p.health.failures}/{p.health.calls}</small>{p.health.lastError && <small style={{ display: "block" }}>Último erro: {p.health.lastError}</small>}</div>
          <div className="row-actions"><button disabled={!p.configured || probe.isPending} onClick={() => probe.mutate({ id: p.id })}>Testar</button><a href={p.docsUrl} target="_blank" rel="noreferrer">Docs</a></div>
        </div>)}
      </div></div>}
      {probe.data && <div className="panel"><small>Teste de {probe.data.id}: {probe.data.ok ? "sucesso" : `falhou — ${probe.data.error}`}</small></div>}
    </>
  );
}
