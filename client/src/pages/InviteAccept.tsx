import { useEffect, useState } from "react";
import { ArrowRight, CheckCircle2, Mail, ShieldCheck } from "lucide-react";
import { useLocation, useRoute } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { supabase } from "@/lib/supabase";
import { trpc } from "@/lib/trpc";
import EditorialResponsibility, { EDITORIAL_RESPONSIBILITY_VERSION } from "@/components/EditorialResponsibility";
import EditorialTermsAcceptance, { PCH_EDITORIAL_TERMS_ID, PCH_EDITORIAL_TERMS_VERSION } from "@/components/EditorialTermsAcceptance";
import officialLogoUrl from "@/assets/pch-news-official-current.svg";

const LOGO_URL = officialLogoUrl;
export const PENDING_INVITE_KEY = "pch_pending_invite";
const ROLE_LABELS: Record<string, string> = { columnist: "colunista", journalist: "jornalista", editor: "editor", reviewer: "revisor" };

function markLoginStarted() { try { localStorage.setItem("pch_invite_login_started", String(Date.now())); } catch { /* ignore */ } }

export default function InviteAccept() {
  const [, params] = useRoute("/convite/:token");
  const [, navigate] = useLocation();
  const { user, loading, refresh, logout } = useAuth() as ReturnType<typeof useAuth> & { logout?: () => Promise<void> };
  const token = params?.token || (typeof window !== "undefined" ? window.location.pathname.split("/")[2] || "" : "");
  const { data: invite, isLoading } = trpc.invites.preview.useQuery({ token }, { enabled: token.length >= 20, retry: false });
  const accept = trpc.invites.accept.useMutation({
    onSuccess: async () => {
      try { localStorage.removeItem(PENDING_INVITE_KEY); } catch { /* ignore */ }
      await refresh();
      navigate("/admin");
    },
  });
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [responsibilityAccepted, setResponsibilityAccepted] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const invitedEmail = invite?.valid && invite.email ? invite.email : "";
  const roleLabel = ROLE_LABELS[(invite as { role?: string } | undefined)?.role || "columnist"] || "colunista";

  // Remember the invite across the login round-trip (OAuth / magic link land on /admin).
  useEffect(() => {
    if (token.length >= 20) { try { localStorage.setItem(PENDING_INVITE_KEY, token); } catch { /* ignore */ } }
  }, [token]);

  const sendMagicLink = async () => {
    if (!invitedEmail) return;
    markLoginStarted();
    setSending(true); setMessage("");
    const { error } = await supabase.auth.signInWithOtp({
      email: invitedEmail,
      options: { shouldCreateUser: true, emailRedirectTo: `${window.location.origin}/convite/${encodeURIComponent(token)}` },
    });
    setSending(false);
    setMessage(error ? `Não foi possível enviar o link: ${error.message}` : `Link de acesso enviado para ${invitedEmail}. Abra o e-mail neste mesmo navegador; ele retornará ao convite para liberar diretamente o Admin Editorial.`);
  };

  if (isLoading || loading) return <main className="invite-shell"><section className="invite-card">Validando convite…</section></main>;

  if (!invite?.valid) { try { if (localStorage.getItem(PENDING_INVITE_KEY) === token) localStorage.removeItem(PENDING_INVITE_KEY); } catch { /* ignore */ } }
  if (!invite?.valid) return <main className="invite-shell"><section className="invite-card"><img src={LOGO_URL} alt="PCH News" /><span className="admin-kicker">CONVITE INDISPONÍVEL</span><h1>Este link não está mais disponível.</h1><p>O convite expirou, foi revogado ou já foi aceito. Peça ao administrador um novo convite.</p></section></main>;

  if (!user) return <main className="invite-shell"><section className="invite-card"><img src={LOGO_URL} alt="PCH News" /><div className="invite-icon"><Mail size={22} /></div><span className="admin-kicker">CONVITE PCH NEWS</span><h1>Você foi convidado.</h1><p>O convite para <strong>{invitedEmail}</strong> libera o acesso como <strong>{roleLabel}</strong>.</p><button className="primary-cta" disabled={sending} onClick={sendMagicLink}>{sending ? "Enviando…" : "Receber link de acesso por e-mail"} <ArrowRight size={16} /></button><button className="secondary-cta" onClick={() => { markLoginStarted(); void startLogin(); }}>Entrar com Google</button><small>Use exatamente o e-mail que recebeu o convite.</small>{message && <small role="status">{message}</small>}</section></main>;

  if (user.email?.toLowerCase() !== invitedEmail.toLowerCase()) return <main className="invite-shell"><section className="invite-card"><ShieldCheck size={25} /><span className="admin-kicker">E-MAIL DIFERENTE</span><h1>Entre com a conta convidada.</h1><p>O convite foi enviado para <strong>{invitedEmail}</strong>, mas sua sessão está em <strong>{user.email}</strong>.</p><button className="secondary-cta" onClick={async () => { await supabase.auth.signOut(); if (logout) await logout().catch(() => undefined); window.location.reload(); }}>Sair e entrar com {invitedEmail}</button>{message && <small>{message}</small>}</section></main>;

  return <main className="invite-shell"><section className="invite-card"><CheckCircle2 size={28} /><span className="admin-kicker">ACEITE NECESSÁRIO</span><h1>Confirme sua responsabilidade editorial.</h1><p>Antes de liberar o acesso de {roleLabel}, o PCH News precisa registrar sua declaração sobre o material que você enviar.</p><EditorialResponsibility onAccepted={setResponsibilityAccepted} /><EditorialTermsAcceptance onAccepted={setTermsAccepted} /><button className="primary-cta" disabled={!responsibilityAccepted || !termsAccepted || accept.isPending} onClick={() => accept.mutate({ token, responsibilityAccepted: true, responsibilityVersion: EDITORIAL_RESPONSIBILITY_VERSION, partnershipAccepted: true, partnershipVersion: PCH_EDITORIAL_TERMS_VERSION, confidentialityAccepted: true, confidentialityVersion: PCH_EDITORIAL_TERMS_VERSION, termsId: PCH_EDITORIAL_TERMS_ID })}>{accept.isPending ? "Registrando…" : "Aceitar e liberar acesso"} <ArrowRight size={16} /></button>{accept.error && <small>{accept.error.message}</small>}</section></main>;
}
