import { ArrowRight, Eye, EyeOff, LockKeyhole, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { startLogin } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { supabase } from "@/lib/supabase";

const LOGO_URL = "/brand/logo.jpg?v=5";
const OWNER_EMAIL = "pchnews.oficial@gmail.com";

export default function Login() {
  const [, navigate] = useLocation();
  const { user, loading, error: authError } = useAuth();
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [googleError, setGoogleError] = useState("");
  const [message, setMessage] = useState("");
  const [showEmail, setShowEmail] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate("/admin");
  }, [loading, user, navigate]);

  const handleGoogle = async () => {
    setGoogleError("");
    const error = await startLogin();
    if (error) setGoogleError(error.message);
  };

  const handleMagicLink = async (event: React.FormEvent) => {
    event.preventDefault();
    const normalized = email.trim().toLowerCase();
    if (!normalized) return;
    setSending(true);
    setMessage("");
    setGoogleError("");

    if (normalized !== OWNER_EMAIL) {
      setSending(false);
      setMessage("Este acesso por e-mail é exclusivo da conta administrativa. Colunistas entram pelo convite individual.");
      return;
    }

    const { error } = await supabase.auth.signInWithOtp({
      email: normalized,
      options: { shouldCreateUser: false },
    });
    setSending(false);
    setMessage(error ? error.message : "Link de acesso enviado. Confira seu e-mail para continuar.");
  };

  if (loading && !user) {
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
          <h1 id="login-title">Bem-vindo à<br /><em>redação.</em></h1>
          <p>Acesse o painel para publicar, revisar e administrar o PCH News.</p>
        </div>

        <button className="login-google" type="button" onClick={handleGoogle}>
          <span className="google-mark" aria-hidden="true">G</span>
          <span>Entrar com Google</span>
          <ArrowRight size={17} />
        </button>

        <div className="login-divider"><span>ou acesso por e-mail</span></div>

        {!showEmail ? (
          <button className="login-email-toggle" type="button" onClick={() => setShowEmail(true)}>
            <span>Usar link seguro por e-mail</span><ArrowRight size={15} />
          </button>
        ) : (
          <form className="login-form" onSubmit={handleMagicLink}>
            <label>
              <span>E-MAIL ADMINISTRATIVO</span>
              <div className="login-input">
                <LockKeyhole size={16} aria-hidden="true" />
                <input
                  aria-label="E-mail administrativo"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="seu e-mail"
                  autoComplete="email"
                  autoFocus
                  required
                />
                <button type="button" aria-label="Fechar acesso por e-mail" onClick={() => setShowEmail(false)}>×</button>
              </div>
            </label>
            <button className="login-submit" type="submit" disabled={sending}>
              <span>{sending ? "Enviando link…" : "Enviar link de acesso"}</span>
              <ArrowRight size={16} />
            </button>
          </form>
        )}

        {(googleError || authError) && (
          <div className="login-error" role="alert">{googleError || authError?.message}</div>
        )}
        {message && <div className="login-message" role="status">{message}</div>}

        <div className="login-security">
          <ShieldCheck size={17} />
          <span><strong>Ambiente editorial protegido</strong><small>Permissões administradas pelo Supabase. Nenhuma senha é armazenada nesta aplicação.</small></span>
        </div>

        <p className="login-support">Problemas para entrar? Use a conta administrativa autorizada ou o convite enviado pela redação.</p>
      </section>

      <footer className="login-footer">© 2026 PCH News · Notícias para libertar a mente.</footer>
    </main>
  );
}
