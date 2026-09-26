import { LogOut, ShieldCheck, UserCircle, ArrowRight } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { supabase } from "@/lib/supabase";

const LOGO_URL = "/brand/pch-news-official-current.svg?v=20260927";

export default function Profile() {
  const [, navigate] = useLocation();
  const { user, loading, logout } = useAuth();

  if (loading) {
    return <main className="profile-page"><div className="profile-card">Carregando seu perfil…</div></main>;
  }

  if (!user) {
    return (
      <main className="profile-page">
        <section className="profile-card">
          <img className="profile-page-logo" src={LOGO_URL} alt="PCH News" />
          <span className="admin-kicker">ÁREA DO LEITOR</span>
          <h1>Entre no PCH News</h1>
          <p>Faça login para acessar seu perfil e, quando autorizado, o painel editorial.</p>
          <Link className="primary-cta" href="/login">Entrar na plataforma <ArrowRight size={16} /></Link>
        </section>
      </main>
    );
  }

  const displayName = user.name || user.email || "Usuário PCH News";
  const roleLabel = user.role === "admin" ? "Administrador editorial" : user.role === "columnist" ? "Colunista" : "Leitor";

  const handleLogout = async () => {
    await logout();
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <main className="profile-page">
      <section className="profile-card">
        <img className="profile-page-logo" src={LOGO_URL} alt="PCH News" />
        <div className="profile-avatar"><UserCircle size={54} /></div>
        <span className="admin-kicker">MEU PERFIL</span>
        <h1>{displayName}</h1>
        <p>{user.email || "Conta PCH News"}</p>
        <div className="profile-role"><ShieldCheck size={16} /> {roleLabel}</div>
        <div className="profile-actions">
          {(user.role === "admin" || user.role === "columnist") && (
            <a className="primary-cta" href="/?admin=1">Painel editorial <ArrowRight size={16} /></a>
          )}
          <button className="secondary-cta" type="button" onClick={handleLogout}><LogOut size={16} /> Sair</button>
        </div>
      </section>
    </main>
  );
}
