import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Redirect, Route, Switch, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import Login from "./pages/Login";
import ErrorBoundary from "./components/ErrorBoundary";
import Admin from "./pages/Admin";
import Home from "./pages/Home";
import EventsAgenda from "./pages/EventsAgenda";
import EventDetail from "./pages/EventDetail";
import ArticlePage from "./pages/ArticlePage";
import ColumnistProfile from "./pages/ColumnistProfile";
import TeamPage from "./pages/TeamPage";
import InviteAccept from "./pages/InviteAccept";
import Profile from "./pages/Profile";
import ApiHubAdminPage from "./pages/ApiHubAdminPage";
import NotFound from "./pages/NotFound";
import Institutional from "./pages/Institutional";
import PublicAds from "./pages/PublicAds";
import KnowledgePage from "./pages/KnowledgePage";
import EditorialPrinciplesPage from "./pages/EditorialPrinciplesPage";
import LawNews from "./pages/LawNews";
import { PrivacyPage, TermsPage, CookiesPage, PartnersPage } from "./pages/LegalPages";
import EditorialRequests from "./pages/EditorialRequests";
import EditorialDataBridge from "./components/EditorialDataBridge";
import PrivacyConsent from "./components/PrivacyConsent";
import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import { supabase } from "./lib/supabase";
import { clarityEvent } from "./lib/clarity";
function AuthenticatedAdmin() { const { user, loading, error } = useAuth(); if (loading) return <div className="app-loading">Validando acesso seguro…</div>; if (error) return <div className="article-placeholder"><span className="admin-kicker">FALHA DE AUTENTICAÇÃO</span><h1>Não foi possível validar sua sessão.</h1><p>A sessão do Supabase foi encontrada, mas o servidor não conseguiu confirmar seu perfil. Verifique a configuração da API e tente novamente.</p><button className="primary-cta" onClick={() => window.location.reload()}>Tentar novamente</button></div>; if (!user) return <Login />; if (!(user.role === "admin" || ["editor", "journalist", "columnist", "reviewer"].includes(user.role))) return <div className="article-placeholder"><span className="admin-kicker">ACESSO RESTRITO</span><h1>Seu acesso ainda não foi liberado.</h1><p>Peça ao administrador do PCH News para liberar o papel editorial adequado à sua conta.</p><button className="primary-cta" onClick={() => window.location.assign("/login")}>Voltar ao acesso</button></div>; return <Admin />; }
function ProtectedAdmin() { const [checkingSession, setCheckingSession] = useState(true); const [hasSession, setHasSession] = useState(false); useEffect(() => { let active = true; void supabase.auth.getSession().then(({ data }) => { if (!active) return; setHasSession(Boolean(data.session)); setCheckingSession(false); }); const { data } = supabase.auth.onAuthStateChange((event, session) => { if (!active) return; if (event === "SIGNED_OUT") setHasSession(false); else if (session) setHasSession(true); }); return () => { active = false; data.subscription.unsubscribe(); }; }, []); if (checkingSession) return <div className="app-loading">Abrindo acesso seguro…</div>; if (!hasSession) return <Login />; return <AuthenticatedAdmin />; }
function ScrollDirectionButton() {
  const [showTop, setShowTop] = useState(false);
  const [showBottom, setShowBottom] = useState(true);

  useEffect(() => {
    const update = () => {
      const doc = document.documentElement;
      const maxScroll = Math.max(0, doc.scrollHeight - window.innerHeight);
      const y = window.scrollY;
      setShowTop(y > 160);
      setShowBottom(maxScroll > 160 && y < maxScroll - 160);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  const goTop = () => window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  const goBottom = () => window.scrollTo({ top: document.documentElement.scrollHeight, left: 0, behavior: "smooth" });

  return (
    <div className="scroll-navigation" aria-label="Navegação rápida da página">
      {showTop && <button type="button" className="scroll-navigation-button scroll-navigation-top" onClick={goTop} aria-label="Voltar ao topo" title="Voltar ao topo"><ArrowUp size={18} aria-hidden="true" /></button>}
      {showBottom && <button type="button" className="scroll-navigation-button scroll-navigation-bottom" onClick={goBottom} aria-label="Ir para o final da página" title="Ir para o final da página"><ArrowDown size={18} aria-hidden="true" /></button>}
    </div>
  );
}
function ClarityRouteTracker() {
  const [location] = useLocation();
  useEffect(() => {
    clarityEvent("page_view");
  }, [location]);
  return null;
}

function ContentScrollController() {
  const [location] = useLocation();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if ("scrollRestoration" in window.history) window.history.scrollRestoration = "manual";
    if (window.location.hash) return;

    const frame = window.requestAnimationFrame(() => {
      // Internal navigation always starts at the beginning of the actual content,
      // rather than preserving an arbitrary scroll position from the previous page.
      const content = document.querySelector("main, article, [role='main']");
      if (content instanceof HTMLElement) {
        content.scrollIntoView({ behavior: "instant", block: "start" });
      } else {
        window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      }
    });

    return () => window.cancelAnimationFrame(frame);
  }, [location]);

  return null;
}
function HomeOrAdmin() { return <Home />; }
function Router() {
  const [location] = useLocation();
  // Use the browser pathname as the canonical route identity. Wouter remains the
  // navigation layer, but protected/public route families are separated explicitly
  // so /admin can never fall through to the Agenda route.
  const browserPath = typeof window !== "undefined" ? window.location.pathname : location;
  const normalizedPath = browserPath.replace(/\/+$/, "") || "/";

  // Invite login round-trip: OAuth / magic link always land on /admin. If the
  // callback carries a fresh session and an invite is pending, resume the
  // invite page (forwarding the auth params so Supabase can finish sign-in).
  if (normalizedPath === "/admin" && typeof window !== "undefined") {
    let pending = "";
    let startedAt = 0;
    try { pending = localStorage.getItem("pch_pending_invite") || ""; startedAt = Number(localStorage.getItem("pch_invite_login_started") || 0); } catch { /* ignore */ }
    if (pending && Date.now() - startedAt < 60 * 60 * 1000) {
      try { localStorage.removeItem("pch_invite_login_started"); } catch { /* ignore */ }
      window.location.replace(`/convite/${encodeURIComponent(pending)}${window.location.search}${window.location.hash}`);
      return <div className="app-loading">Retomando seu convite…</div>;
    }
  }
  if (normalizedPath === "/admin") return <ProtectedAdmin />;
  if (normalizedPath === "/admin/integracoes") return <ProtectedAdmin />;
  if (normalizedPath === "/eventos" || normalizedPath === "/agenda") return <EventsAgenda />;
  if (normalizedPath.startsWith("/eventos/") || normalizedPath.startsWith("/agenda/")) { const eventId = normalizedPath.split("/")[2] || ""; return <EventDetail eventId={decodeURIComponent(eventId)} />; }

  return <Switch><Route path="/" component={HomeOrAdmin} /><Route path="/login" component={Login} />
    <Route path="/equipe" component={TeamPage} /><Route path="/equipe/" component={TeamPage} /><Route path="/perfil" component={Profile} /><Route path="/perfil/" component={Profile} /><Route path="/admin/integracoes/" component={ProtectedAdmin} /><Route path="/materia/:slug" component={ArticlePage} /><Route path="/colunista/:slug" component={ColumnistProfile} /><Route path="/convite/:token" component={InviteAccept} /><Route path="/institucional" component={Institutional} /><Route path="/institucional/" component={Institutional} /><Route path="/anuncie" component={PublicAds} /><Route path="/anuncie/" component={PublicAds} /><Route path="/conhecimento-pch" component={KnowledgePage} /><Route path="/conhecimento-pch/" component={KnowledgePage} /><Route path="/principios-editoriais" component={EditorialPrinciplesPage} /><Route path="/principios-editoriais/" component={EditorialPrinciplesPage} /><Route path="/lei" component={LawNews} /><Route path="/lei/" component={LawNews} />
    <Route path="/privacidade" component={PrivacyPage} /><Route path="/privacidade/" component={PrivacyPage} />
    <Route path="/termos" component={TermsPage} /><Route path="/termos/" component={TermsPage} />
    <Route path="/cookies" component={CookiesPage} /><Route path="/cookies/" component={CookiesPage} />
    <Route path="/parceiros" component={PartnersPage} /><Route path="/parceiros/" component={PartnersPage} /><Route path="/correcoes" component={EditorialRequests} /><Route path="/correcoes/" component={EditorialRequests} /><Route path="/404" component={NotFound} /><Route component={NotFound} /></Switch>;
}
export default function App() { return <ErrorBoundary><EditorialDataBridge /><ClarityRouteTracker /><ContentScrollController /><TooltipProvider><Toaster /><Router /></TooltipProvider><PrivacyConsent /><ScrollDirectionButton /></ErrorBoundary>; }
