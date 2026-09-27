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
import InviteAccept from "./pages/InviteAccept";
import Profile from "./pages/Profile";
import ApiHubAdminPage from "./pages/ApiHubAdminPage";
import NotFound from "./pages/NotFound";
import Institutional from "./pages/Institutional";
import PublicAds from "./pages/PublicAds";
import KnowledgePage from "./pages/KnowledgePage";
import LawNews from "./pages/LawNews";
import { PrivacyPage, TermsPage, CookiesPage, PartnersPage } from "./pages/LegalPages";
import EditorialRequests from "./pages/EditorialRequests";
import EditorialDataBridge from "./components/EditorialDataBridge";
import PrivacyConsent from "./components/PrivacyConsent";
import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";
import { clarityEvent } from "./lib/clarity";
function AuthenticatedAdmin() { const { user, loading, error } = useAuth(); if (loading) return <div className="app-loading">Validando acesso seguro…</div>; if (error) return <div className="article-placeholder"><span className="admin-kicker">FALHA DE AUTENTICAÇÃO</span><h1>Não foi possível validar sua sessão.</h1><p>A sessão do Supabase foi encontrada, mas o servidor não conseguiu confirmar seu perfil. Verifique a configuração da API e tente novamente.</p><button className="primary-cta" onClick={() => window.location.reload()}>Tentar novamente</button></div>; if (!user) return <Login />; if (!(user.role === "admin" || ["editor", "journalist", "columnist", "reviewer"].includes(user.role))) return <div className="article-placeholder"><span className="admin-kicker">ACESSO RESTRITO</span><h1>Seu acesso ainda não foi liberado.</h1><p>Peça ao administrador do PCH News para liberar o papel editorial adequado à sua conta.</p><button className="primary-cta" onClick={() => window.location.assign("/login")}>Voltar ao acesso</button></div>; return <Admin />; }
function ProtectedAdmin() { const [checkingSession, setCheckingSession] = useState(true); const [hasSession, setHasSession] = useState(false); useEffect(() => { let active = true; void supabase.auth.getSession().then(({ data }) => { if (!active) return; setHasSession(Boolean(data.session)); setCheckingSession(false); }); const { data } = supabase.auth.onAuthStateChange((event, session) => { if (!active) return; if (event === "SIGNED_OUT") setHasSession(false); else if (session) setHasSession(true); }); return () => { active = false; data.subscription.unsubscribe(); }; }, []); if (checkingSession) return <div className="app-loading">Abrindo acesso seguro…</div>; if (!hasSession) return <Login />; return <AuthenticatedAdmin />; }
function ClarityRouteTracker() {
  const [location] = useLocation();
  useEffect(() => { clarityEvent("page_view"); }, [location]);
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

  if (normalizedPath === "/admin") return <ProtectedAdmin />;
  if (normalizedPath === "/admin/integracoes") return <ProtectedAdmin />;
  if (normalizedPath === "/eventos") return <EventsAgenda />;
  if (normalizedPath.startsWith("/eventos/")) return <EventDetail />;

  return <Switch><Route path="/" component={HomeOrAdmin} /><Route path="/login" component={Login} />
    <Route path="/perfil" component={Profile} /><Route path="/perfil/" component={Profile} /><Route path="/admin/integracoes/" component={ProtectedAdmin} /><Route path="/materia/:slug" component={ArticlePage} /><Route path="/colunista/:slug" component={ColumnistProfile} /><Route path="/convite/:token" component={InviteAccept} /><Route path="/institucional" component={Institutional} /><Route path="/institucional/" component={Institutional} /><Route path="/anuncie" component={PublicAds} /><Route path="/anuncie/" component={PublicAds} /><Route path="/conhecimento-pch" component={KnowledgePage} /><Route path="/conhecimento-pch/" component={KnowledgePage} /><Route path="/lei" component={LawNews} /><Route path="/lei/" component={LawNews} />
    <Route path="/privacidade" component={PrivacyPage} /><Route path="/privacidade/" component={PrivacyPage} />
    <Route path="/termos" component={TermsPage} /><Route path="/termos/" component={TermsPage} />
    <Route path="/cookies" component={CookiesPage} /><Route path="/cookies/" component={CookiesPage} />
    <Route path="/parceiros" component={PartnersPage} /><Route path="/parceiros/" component={PartnersPage} /><Route path="/correcoes" component={EditorialRequests} /><Route path="/correcoes/" component={EditorialRequests} /><Route path="/404" component={NotFound} /><Route component={NotFound} /></Switch>;
}
export default function App() { return <ErrorBoundary><EditorialDataBridge /><ClarityRouteTracker /><TooltipProvider><Toaster /><Router /></TooltipProvider><PrivacyConsent /></ErrorBoundary>; }
