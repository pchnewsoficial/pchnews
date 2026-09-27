import { useMemo } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import officialLogoUrl from "@/assets/pch-news-official-current.svg";
import { LayoutDashboard, FileText, Users, Settings, ExternalLink, LogOut } from "lucide-react";

export default function AdminShell() {
  const { user, loading, error, logout } = useAuth();
  const [, navigate] = useLocation();
  const roleLabel = useMemo(() => {
    if (!user) return "";
    const labels: Record<string, string> = {
      admin: "Administrador",
      editor: "Editor",
      journalist: "Jornalista",
      columnist: "Colunista",
      reviewer: "Revisor",
    };
    return labels[user.role] || user.role;
  }, [user]);

  if (loading) return <div className="app-loading">Validando acesso seguro…</div>;

  if (error) {
    return (
      <main className="article-placeholder">
        <span className="admin-kicker">FALHA DE AUTENTICAÇÃO</span>
        <h1>Não foi possível validar sua sessão.</h1>
        <p>{error.message || "O servidor não conseguiu confirmar seu perfil editorial."}</p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <button className="primary-cta" onClick={() => window.location.reload()}>Tentar novamente</button>
          <button className="secondary-cta" onClick={() => navigate("/login")}>Voltar ao acesso</button>
        </div>
      </main>
    );
  }

  if (!user) return null;

  if (!["admin", "editor", "journalist", "columnist", "reviewer"].includes(user.role)) {
    return (
      <main className="article-placeholder">
        <span className="admin-kicker">ACESSO RESTRITO</span>
        <h1>Seu acesso ainda não foi liberado.</h1>
        <p>A conta foi autenticada, mas ainda não possui um papel editorial autorizado.</p>
        <button className="secondary-cta" onClick={() => navigate("/login")}>Voltar ao acesso</button>
      </main>
    );
  }

  return (
    <div className="admin-shell-page">
      <header className="admin-shell-header">
        <div className="admin-shell-brand">
          <img src={officialLogoUrl} alt="PCH News" />
          <div>
            <span className="admin-kicker">PAINEL EDITORIAL</span>
            <strong>PCH News</strong>
          </div>
        </div>
        <div className="admin-shell-user">
          <div><strong>{user.name || user.email || "Usuário"}</strong><span>{roleLabel}</span></div>
          <button className="ghost-button" onClick={async () => { await logout(); navigate("/login"); }} title="Sair"><LogOut size={16} /></button>
        </div>
      </header>

      <main className="admin-shell-main">
        <section className="admin-shell-welcome">
          <span className="admin-kicker">ACESSO CONFIRMADO</span>
          <h1>Olá, {(user.name || "Redação PCH News").split(" ")[0]}<span>.</span></h1>
          <p>O acesso administrativo está funcionando. O CMS completo é carregado somente quando você solicitar.</p>
          <button className="primary-cta" onClick={() => navigate("/admin?legacy=1")}>
            <LayoutDashboard size={17} /> Abrir CMS completo
          </button>
        </section>

        <section className="admin-shell-grid">
          <article className="panel admin-shell-card">
            <FileText size={22} />
            <span className="admin-kicker">CONTEÚDO</span>
            <strong>Conteúdo protegido</strong>
            <small>Carregado somente após entrar no CMS</small>
          </article>
          <article className="panel admin-shell-card">
            <Users size={22} />
            <span className="admin-kicker">ACESSO</span>
            <strong>{roleLabel}</strong>
            <small>{user.email || "Conta autenticada"}</small>
          </article>
          <article className="panel admin-shell-card">
            <Settings size={22} />
            <span className="admin-kicker">INFRAESTRUTURA</span>
            <strong>Supabase + Worker</strong>
            <small>Sessão validada pelo servidor</small>
          </article>
        </section>

        <nav className="admin-shell-links" aria-label="Acessos administrativos">
          <button onClick={() => navigate("/admin?legacy=1")}><LayoutDashboard size={16} /> CMS completo</button>
          <button onClick={() => navigate("/admin/integracoes")}><ExternalLink size={16} /> Integrações</button>
          <button onClick={() => navigate("/")}><ExternalLink size={16} /> Ver site público</button>
        </nav>
      </main>
    </div>
  );
}
