import { ArrowRight, LockKeyhole, ShieldCheck } from "lucide-react";
import { useEffect } from "react";
import { useLocation } from "wouter";
import { startLogin } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
const LOGO_URL = "/brand/logo.svg";
export default function Login() {
  const [, navigate] = useLocation(); const { user, loading } = useAuth();
  useEffect(() => { if (!loading && user) navigate("/admin"); }, [loading, user, navigate]);
  return <main className="login-shell"><div className="login-orbit login-orbit-one" /><div className="login-orbit login-orbit-two" /><section className="login-card"><div className="login-brand"><img src={LOGO_URL} alt="PCH News" /><span>STUDIO</span></div><div className="login-intro"><span className="admin-kicker">ACESSO OFICIAL</span><h1>Entre na sua<br /><em>redação.</em></h1><p>Use sua conta Google para acompanhar publicações, administrar a equipe e proteger o conteúdo do PCH News.</p></div><div className="official-login-card"><div className="official-login-icon"><LockKeyhole size={20} /></div><div><strong>Autenticação Supabase</strong><span>Login com Google e sessão gerenciada pelo Supabase.</span></div></div><button className="login-submit" type="button" onClick={() => startLogin()}><span>Entrar com Google</span><ArrowRight size={16} /></button><div className="login-security"><ShieldCheck size={16} /><span>Ambiente editorial protegido<br /><small>Administradores e colunistas recebem permissões diferentes.</small></span></div><div className="login-demo-note">Configure o provedor Google no Supabase antes do primeiro acesso.</div></section><footer className="login-footer">© 2026 PCH News · Notícias para libertar a mente.</footer></main>;
}
