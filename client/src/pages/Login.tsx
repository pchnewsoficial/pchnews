import { ArrowLeft, ArrowRight, KeyRound, LockKeyhole, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { supabase } from "@/lib/supabase";

const LOGO_URL = "/brand/pch-news-official-20260926.svg?v=20260927";
const OWNER_EMAIL = "pchnews.oficial@gmail.com";

export default function Login() {
  const [, navigate] = useLocation();
  const { user, loading, error: authError } = useAuth();
  const [email, setEmail] = useState(OWNER_EMAIL);
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [resetMode, setResetMode] = useState(false);
  const [resetPasswordMode, setResetPasswordMode] = useState(() =>
    typeof window !== "undefined" && new URLSearchParams(window.location.search).get("reset") === "1",
  );
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!loading && user && !resetPasswordMode) window.location.assign("/?admin=1");
  }, [loading, user, resetPasswordMode, navigate]);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setResetMode(false);
        setResetPasswordMode(true);
        setMessage("");
      }
    });

    return () => data.subscription.unsubscribe();
  }, []);

  const handlePasswordLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    const normalized = email.trim().toLowerCase();
    if (!normalized || !password) return;
    setSending(true);
    setMessage("");

    if (normalized !== OWNER_EMAIL) {
      setSending(false);
      setMessage("Este acesso por e-mail é exclusivo da conta administrativa. Colunistas entram pelo convite individual.");
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email: normalized, password });
    setSending(false);
    if (error) {
      setMessage(
        error.message === "Invalid login credentials"
          ? "E-mail ou senha incorretos. Se você não lembrar da senha, use “Esqueci minha senha”."
          : "Não foi possível entrar. Verifique o e-mail e tente novamente.",
      );
      return;
    }
    window.location.assign("/?admin=1");
  };

  const handleForgotPassword = async () => {
    const normalized = email.trim().toLowerCase();
    if (normalized !== OWNER_EMAIL) { setMessage("Use o e-mail administrativo cadastrado no PCH News."); return; }
    setSending(true); setMessage("");
    const redirectTo = typeof window !== "undefined" ? window.location.origin + "/login?reset=1" : undefined;
    const { error } = await supabase.auth.resetPasswordForEmail(normalized, redirectTo ? { redirectTo } : undefined);
    setSending(false);
    setMessage(error ? "Não foi possível enviar o e-mail de recuperação." : "E-mail de recuperação enviado. Abra o link recebido para definir uma nova senha.");
  };

  const handleSetNewPassword = async (event: React.FormEvent) => {
    event.preventDefault();
    if (newPassword.length < 8) { setMessage("A nova senha precisa ter pelo menos 8 caracteres."); return; }
    setSending(true); setMessage("");
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSending(false);
    if (error) { setMessage("Não foi possível alterar a senha. Solicite um novo link de recuperação."); return; }
    setMessage("Senha alterada com sucesso. Entrando no painel editorial…");
    window.setTimeout(() => window.location.assign("/admin"), 700);
  };

  const returnToLogin = () => {
    setResetMode(false); setResetPasswordMode(false); setMessage(""); setNewPassword("");
    window.history.replaceState({}, "", "/login");
    setEmail(OWNER_EMAIL);
    setPassword("");
  };

  const handleMagicLink = async () => {
    const normalized = email.trim().toLowerCase();
    if (normalized !== OWNER_EMAIL) return;
    setSending(true);
    setMessage("");

    // Keep the magic-link callback on the exact host where the login started.
    // This avoids sending production users to the Lovable preview/published host.
    const redirectTo = typeof window !== "undefined"
      ? window.location.origin + "/?admin=1"
      : undefined;
    const { error } = await supabase.auth.signInWithOtp({
      email: normalized,
      options: {
        shouldCreateUser: false,
        ...(redirectTo ? { emailRedirectTo: redirectTo } : {}),
      },
    });
    setSending(false);
    setMessage(
      error
        ? error.message
        : "Link de acesso enviado. Abra o e-mail no mesmo navegador e você será levado diretamente ao painel administrativo.",
    );
  };

  if (loading && !user && !resetPasswordMode) {
    return (
      <main className="login-shell" aria-busy="true">
        <section className="login-card login-loading-card">
          <div className="login-brand"><img src={LOGO_URL} alt="PCH News" /><span>STUDIO</span></div>
          <div className="login-loading-mark" />
          <p>Verificando sua sessão segura…</p>
        </section>
      </main>
    );
  }

  return (
    <main className="login-shell">
      <div className="login-glow login-glow-one" aria-hidden="true" />
      <div className="login-glow login-glow-two" aria-hidden="true" />

      <section className="login-card" aria-labelledby="login-title">
        <div className="login-topline">
          <div className="login-brand">
            <img src={LOGO_URL} alt="PCH News" />
            <div><strong>PCH NEWS</strong><span>STUDIO EDITORIAL</span></div>
          </div>
          <span className="login-status"><i /> SEGURO</span>
        </div>

        <div className="login-intro">
          <span className="admin-kicker">ÁREA ADMINISTRATIVA</span>
          <h1 id="login-title">Bem-vindo à<br /><em>{resetPasswordMode ? "nova senha." : resetMode ? "recuperação." : "redação."}</em></h1>
          <p>{resetPasswordMode ? "Defina uma nova senha para recuperar o acesso ao painel editorial." : resetMode ? "Informe o e-mail administrativo para receber o link de recuperação." : "Acesse o painel para publicar, revisar e administrar o PCH News."}</p>
        </div>

        {resetPasswordMode ? (
          <form className="login-form" onSubmit={handleSetNewPassword}>
            <label><span>NOVA SENHA</span><div className="login-input"><KeyRound size={16} aria-hidden="true" /><input aria-label="Nova senha" type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} autoComplete="new-password" minLength={8} autoFocus required /></div></label>
            <button className="login-submit" type="submit" disabled={sending}><span>{sending ? "Salvando…" : "Salvar nova senha"}</span><ArrowRight size={16} /></button>
            <button className="login-back-button" type="button" onClick={returnToLogin}><ArrowLeft size={15} /> Voltar para o acesso</button>
          </form>
        ) : resetMode ? (
          <form className="login-form" onSubmit={(event) => { event.preventDefault(); handleForgotPassword(); }}>
            <label><span>E-MAIL ADMINISTRATIVO</span><div className="login-input"><LockKeyhole size={16} aria-hidden="true" /><input aria-label="E-mail administrativo" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" autoFocus required /></div></label>
            <button className="login-submit" type="submit" disabled={sending}><span>{sending ? "Enviando…" : "Enviar recuperação"}</span><ArrowRight size={16} /></button>
            <button className="login-back-button" type="button" onClick={returnToLogin}><ArrowLeft size={15} /> Voltar para o acesso</button>
          </form>
        ) : (
          <>
            <form className="login-form" onSubmit={handlePasswordLogin}>
              <label>
                <span>E-MAIL ADMINISTRATIVO</span>
                <div className="login-input"><LockKeyhole size={16} aria-hidden="true" />
                  <input aria-label="E-mail administrativo" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="seu e-mail" autoComplete="email" autoFocus required />
                </div>
              </label>
              <label>
                <span>SENHA</span>
                <div className="login-input"><LockKeyhole size={16} aria-hidden="true" />
                  <input aria-label="Senha administrativa" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required />
                </div>
              </label>
              <button className="login-submit" type="submit" disabled={sending}><span>{sending ? "Entrando…" : "Entrar no painel editorial"}</span><ArrowRight size={16} /></button>
            </form>
            <div className="login-actions">
              <button className="login-forgot-button" type="button" onClick={() => { setResetMode(true); setMessage(""); }}>Esqueci minha senha</button>
            </div>
            <div className="login-divider"><span>ou acesso por link seguro</span></div>
            <button className="login-magic-button" type="button" onClick={handleMagicLink} disabled={sending}>Enviar link seguro de acesso</button>
          </>
        )}

        {authError && (
          <div className="login-error" role="alert">{authError.message}</div>
        )}
        {message && <div className="login-message" role="status">{message}</div>}

        <div className="login-security">
          <ShieldCheck size={17} />
          <span><strong>Ambiente editorial protegido</strong><small>Permissões administradas pelo Supabase. Nenhuma senha é armazenada nesta aplicação.</small></span>
        </div>

        <p className="login-support">Conta administrativa: {OWNER_EMAIL}. Altere a senha provisória depois do primeiro acesso.</p>
      </section>

      <footer className="login-footer">© 2026 PCH News · Notícias para libertar a mente.</footer>
    </main>
  );
}
