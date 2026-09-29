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
  const { data: invite, isLoading } = trpc.invites.preview.useQuery({ token }, { enabled: token.length >= 3, retry: false });
  const directAccess = trpc.invites.accessLink.useQuery({ token }, { enabled: token.length === 32 && Boolean(invite?.valid && invite?.manuallyReleased) && !user && !loading, retry: false });
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
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const invitedEmail = invite?.valid && invite.email ? invite.email : "";
  const roleLabel = ROLE_LABELS[(invite as { role?: string } | undefined)?.role || "columnist"] || "colunista";

  useEffect(() => {
    if (directAccess.data?.actionLink && !user) {
      window.location.replace(directAccess.data.actionLink);
    }
  }, [directAccess.data?.actionLink, user]);

  // Remember the invite across the login round-trip (OAuth / magic link land on /admin).
  useEffect(() => {
    if (token.length >= 3) { try { localStorage.setItem(PENDING_INVITE_KEY, token); } catch { /* ignore */ } }
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

  if (!user) return <main className="invite-shell"><section className="invite-card invite-card-premium invite-card-preauth">
    <div className="invite-brand"><img src={LOGO_URL} alt="PCH News" /></div>
    <div className="invite-hero"><span className="invite-kicker">UM CONVITE ESPECIAL</span><h1>Você foi convidado para fazer parte do PCH News.</h1><p className="invite-lead">Não é um convite aberto. É um convite pessoal para participar de um projeto editorial que valoriza informação, contexto e liberdade da mente.</p></div>
    <div className="invite-from"><div className="invite-avatar">PCH</div><div><strong>Um convite pessoal do PCH News</strong><span>Seu espaço na construção da nossa redação.</span></div></div>
    <div className="invite-highlight"><strong>Por que você?</strong><p>Este convite é pessoal e foi enviado porque o PCH News acredita que sua contribuição pode fazer parte da construção desta redação.</p><p>Ao aceitar, você terá um espaço editorial compatível com seu papel e acesso às ferramentas do fluxo editorial do PCH News.</p></div>
    <div className="invite-values"><div><b>Informação</b><span>Fato antes de opinião.</span></div><div><b>Contexto</b><span>Mais compreensão para o leitor.</span></div><div><b>Liberdade da mente</b><span>O leitor pensa por si.</span></div></div>
    <div className="invite-access"><span className="admin-kicker">SEU CONVITE</span><p><strong>{invitedEmail}</strong> · acesso como <strong>{roleLabel}</strong></p></div>
    <div className="invite-login-box"><div className="invite-icon"><Mail size={22} /></div><strong>{invite.manuallyReleased ? "Preparando seu acesso…" : "Para continuar, confirme seu acesso"}</strong><span>{invite.manuallyReleased ? "Seu convite já foi liberado pelo administrador. O acesso será aberto neste mesmo link." : "Use exatamente o e-mail que recebeu o convite."}</span>{!invite.manuallyReleased && <><button className="primary-cta" disabled={sending} onClick={sendMagicLink}>{sending ? "Enviando…" : "Receber link de acesso por e-mail"} <ArrowRight size={16} /></button><button className="secondary-cta" onClick={() => { markLoginStarted(); void startLogin(); }}>Entrar com Google</button></>}{message && <small role="status">{message}</small>}{directAccess.error && <small role="alert">Não foi possível abrir o acesso automaticamente. Solicite ao administrador uma nova liberação.</small>}</div>
    <small className="invite-footer-note">Este convite é individual e deve ser aceito com o e-mail indicado acima.</small>
  </section></main>;

  if (user.email?.toLowerCase() !== invitedEmail.toLowerCase()) return <main className="invite-shell"><section className="invite-card"><ShieldCheck size={25} /><span className="admin-kicker">E-MAIL DIFERENTE</span><h1>Entre com a conta convidada.</h1><p>O convite foi enviado para <strong>{invitedEmail}</strong>, mas sua sessão está em <strong>{user.email}</strong>.</p><button className="secondary-cta" onClick={async () => { await supabase.auth.signOut(); if (logout) await logout().catch(() => undefined); window.location.reload(); }}>Sair e entrar com {invitedEmail}</button>{message && <small>{message}</small>}</section></main>;

  const finishAcceptance = async () => {
    if (!responsibilityAccepted || !termsAccepted) { setMessage("Aceite os termos para continuar."); return; }
    if (password.length < 8) { setMessage("Crie uma senha com pelo menos 8 caracteres."); return; }
    if (password !== passwordConfirm) { setMessage("As senhas não coincidem."); return; }
    setPasswordSaving(true); setMessage("");
    const { error } = await supabase.auth.updateUser({ password });
    if (error) { setPasswordSaving(false); setMessage(`Não foi possível definir a senha: ${error.message}`); return; }
    accept.mutate({ token, responsibilityAccepted: true, responsibilityVersion: EDITORIAL_RESPONSIBILITY_VERSION, partnershipAccepted: true, partnershipVersion: PCH_EDITORIAL_TERMS_VERSION, confidentialityAccepted: true, confidentialityVersion: PCH_EDITORIAL_TERMS_VERSION, termsId: PCH_EDITORIAL_TERMS_ID }, { onSettled: () => setPasswordSaving(false) });
  };

  const invitationReason = "Este convite é pessoal e foi enviado porque o PCH News acredita que sua contribuição pode fazer parte da construção desta redação.";
  return <main className="invite-shell"><section className="invite-card invite-card-premium">
    <div className="invite-brand"><img src={LOGO_URL} alt="PCH News" /></div>
    <div className="invite-hero"><span className="invite-kicker">UM CONVITE ESPECIAL</span><h1>Você foi convidado para fazer parte do PCH News.</h1><p className="invite-lead">Não é um convite aberto. É um convite pessoal para participar de um projeto editorial que valoriza informação, contexto e liberdade da mente.</p></div>
    <div className="invite-from"><div className="invite-avatar">PCH</div><div><strong>Um convite pessoal do PCH News</strong><span>Seu espaço na construção da nossa redação.</span></div></div>
    <div className="invite-highlight"><strong>Por que você?</strong><p>{invitationReason}</p><p>Ao aceitar, você terá um espaço editorial compatível com seu papel, ferramentas para construir seu conteúdo e apoio do fluxo editorial do PCH News.</p></div>
    <div className="invite-values"><div><b>Informação</b><span>Fato antes de opinião.</span></div><div><b>Contexto</b><span>Mais compreensão para o leitor.</span></div><div><b>Liberdade da mente</b><span>O leitor pensa por si.</span></div></div>
    <div className="invite-access"><span className="admin-kicker">SEU CONVITE</span><p><strong>{invitedEmail}</strong> · acesso como <strong>{roleLabel}</strong></p></div>
    <div className="invite-agreement-summary">
      <div><ShieldCheck size={17} /><span><strong>Confidencialidade</strong><small>Proteção de pautas, informações internas, materiais não publicados e acessos.</small></span></div>
      <div><CheckCircle2 size={17} /><span><strong>Participação e parceria editorial</strong><small>Compromisso com os princípios editoriais e a responsabilidade pelo material enviado.</small></span></div>
      <p>Os termos completos ficam disponíveis no próprio convite. A confirmação será registrada com a versão dos documentos no momento do aceite.</p>
    </div>
    <EditorialResponsibility onAccepted={setResponsibilityAccepted} /><EditorialTermsAcceptance onAccepted={setTermsAccepted} />
    <label className="invite-password-field">Crie sua senha<input type="password" autoComplete="new-password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo de 8 caracteres" /></label>
    <label className="invite-password-field">Confirme a senha<input type="password" autoComplete="new-password" minLength={8} value={passwordConfirm} onChange={(e) => setPasswordConfirm(e.target.value)} placeholder="Repita a senha" /></label>
    <button className="primary-cta" disabled={!responsibilityAccepted || !termsAccepted || accept.isPending || passwordSaving} onClick={finishAcceptance}>{accept.isPending || passwordSaving ? "Preparando seu acesso…" : "Aceitar convite e entrar"} <ArrowRight size={16} /></button>
    {(accept.error || message) && <small>{accept.error?.message || message}</small>}
    <small className="invite-footer-note">Este convite é individual e deve ser aceito com o e-mail indicado acima.</small>
  </section></main>;
}
