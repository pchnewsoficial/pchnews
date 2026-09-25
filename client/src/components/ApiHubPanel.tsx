import { useState } from "react";
import { CheckCircle2, CircleAlert, ExternalLink, RefreshCw } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function ApiHubPanel({ isAdmin }: { isAdmin: boolean }) {
  const { data, isLoading, refetch, isFetching } = trpc.apiHub.health.useQuery(undefined, {
    enabled: isAdmin,
    retry: false,
  });
  const [message, setMessage] = useState("");

  if (!isAdmin) return null;

  const providers = data?.providers ?? [];
  const ready = providers.filter((provider) => provider.configured).length;

  const refresh = async () => {
    setMessage("");
    try {
      await refetch();
      setMessage("Status das integrações atualizado.");
    } catch {
      setMessage("Não foi possível atualizar o status agora.");
    }
  };

  return (
    <div>
      <div className="admin-heading compact">
        <div>
          <span className="admin-kicker">INFRAESTRUTURA EDITORIAL</span>
          <h1>API HUB<span>.</span></h1>
          <p>Integrações externas centralizadas no servidor, sem expor chaves ao navegador.</p>
        </div>
        <button className="secondary-cta" onClick={refresh} disabled={isFetching}>
          <RefreshCw size={16} />
          {isFetching ? "Atualizando…" : "Atualizar status"}
        </button>
      </div>

      <section className="metrics-grid">
        <div className="panel" style={{ padding: 20 }}>
          <span className="admin-kicker">PROVIDERS</span>
          <strong style={{ display: "block", fontSize: 28, marginTop: 8 }}>{providers.length}</strong>
          <small>integrações cadastradas no HUB</small>
        </div>
        <div className="panel" style={{ padding: 20 }}>
          <span className="admin-kicker">CONFIGURADOS</span>
          <strong style={{ display: "block", fontSize: 28, marginTop: 8 }}>{ready}</strong>
          <small>prontos para uso no servidor</small>
        </div>
        <div className="panel" style={{ padding: 20 }}>
          <span className="admin-kicker">SEGURANÇA</span>
          <strong style={{ display: "block", fontSize: 18, marginTop: 12 }}>Chaves server-only</strong>
          <small>segredos não são enviados ao frontend</small>
        </div>
      </section>

      <section className="panel" style={{ marginTop: 20, overflow: "hidden" }}>
        <div className="panel-heading" style={{ padding: "20px 22px", margin: 0 }}>
          <div>
            <span className="admin-kicker">CATÁLOGO</span>
            <h2>Integrações do PCH News</h2>
          </div>
          <span className="progress-label">{ready}/{providers.length || 0} prontas</span>
        </div>
        {isLoading ? (
          <div style={{ padding: 28 }}>Consultando status seguro das integrações…</div>
        ) : (
          <div style={{ display: "grid", gap: 0 }}>
            {providers.map((provider) => (
              <div key={provider.id} style={{ display: "grid", gridTemplateColumns: "minmax(180px, 1.3fr) minmax(130px, .8fr) minmax(120px, .7fr) auto", gap: 16, alignItems: "center", padding: "16px 22px", borderTop: "1px solid var(--border, #e5e7eb)" }}>
                <div>
                  <strong>{provider.name}</strong>
                  <small style={{ display: "block", opacity: .7, marginTop: 3 }}>{provider.category}</small>
                </div>
                <span>{provider.requiresApiKey ? "Chave necessária" : "Sem chave"}</span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  {provider.configured ? <CheckCircle2 size={16} /> : <CircleAlert size={16} />}
                  {provider.configured ? "Configurada" : "Pendente"}
                </span>
                <a href={provider.baseUrl} target="_blank" rel="noreferrer" aria-label={"Abrir " + provider.name} style={{ display: "inline-flex", justifyContent: "center" }}>
                  <ExternalLink size={15} />
                </a>
              </div>
            ))}
          </div>
        )}
      </section>

      {message && <p className="editor-note" style={{ marginTop: 12 }}>{message}</p>}

      <section className="panel" style={{ marginTop: 20, padding: 22 }}>
        <div className="panel-heading" style={{ marginBottom: 8 }}>
          <div>
            <span className="admin-kicker">MICROSOFT CLARITY</span>
            <h2>Telemetria editorial</h2>
          </div>
          <CheckCircle2 size={19} />
        </div>
        <p style={{ margin: 0, lineHeight: 1.6 }}>
          O código de integração já está preparado para SPA e eventos de navegação. O Project ID é configurado no build por <code>VITE_CLARITY_PROJECT_ID</code>; ele não é uma chave privada.
        </p>
      </section>
    </div>
  );
}
