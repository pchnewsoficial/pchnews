import { LogOut, ShieldCheck, UserCircle, ArrowRight, KeyRound } from "lucide-react";
import officialLogoUrl from "@/assets/pch-news-official-current.svg";
import { Link, useLocation } from "wouter";
import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { supabase } from "@/lib/supabase";

const LOGO_URL = officialLogoUrl;

export default function Profile() {
  const [, navigate] = useLocation();
  const { user, loading, logout } = useAuth();
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

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
  const roleLabel = user.role === "admin" ? "Administrador editorial" : user.role === "editor" ? "Editor" : user.role === "journalist" ? "Jornalista" : user.role === "columnist" ? "Colunista" : user.role === "reviewer" ? "Revisor" : "Leitor";

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
          {["admin", "editor", "journalist", "columnist", "reviewer"].includes(user.role) && (
            <a className="primary-cta" href="/admin">Painel editorial <ArrowRight size={16} /></a>
          )}
          <button className="secondary-cta" type="button" onClick={() => { setChangePasswordOpen((open) => !open); setPasswordMessage(""); }}><KeyRound size={16} /> {changePasswordOpen ? "Fechar troca de senha" : "Trocar senha"}</button>
          <button className="secondary-cta" type="button" onClick={handleLogout}><LogOut size={16} /> Sair</button>
        </div>

        {changePasswordOpen && (
          <form className="profile-password-panel" onSubmit={async (event) => {
            event.preventDefault();
            setPasswordMessage("");
            if (newPassword.length < 8) { setPasswordMessage("A nova senha precisa ter pelo menos 8 caracteres."); return; }
            if (newPassword !== confirmPassword) { setPasswordMessage("As senhas não coincidem."); return; }
            setSavingPassword(true);
            const { error } = await supabase.auth.updateUser({ password: newPassword });
            setSavingPassword(false);
            if (error) { setPasswordMessage("Não foi possível alterar a senha agora. Tente novamente."); return; }
            setNewPassword(""); setConfirmPassword(""); setPasswordMessage("Senha alterada com sucesso.");
          }}>
            <strong>Alterar senha</strong>
            <p>Defina uma nova senha para o seu acesso editorial. Você continuará conectado.</p>
            <label><span>NOVA SENHA</span><input type="password" minLength={8} autoComplete="new-password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} required /></label>
            <label><span>CONFIRME A NOVA SENHA</span><input type="password" minLength={8} autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required /></label>
            <button className="primary-cta" type="submit" disabled={savingPassword}>{savingPassword ? "Salvando…" : "Salvar nova senha"} <ArrowRight size={16} /></button>
            {passwordMessage && <small role="status">{passwordMessage}</small>}
          </form>
        )}
      </section>
    </main>
  );
}
