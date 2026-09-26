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
function AuthenticatedAdmin() { const { user, loading, error } = useAuth(); if (loading) return <div className="app-loading">Validando acesso seguro…</div>; if (!user) return <Login />; if (error) return <div className="article-placeholder"><span className="admin-kicker">FALHA DE AUTENTICAÇÃO</span><h1>Não foi possível validar sua sessão.</h1><p>O acesso ao painel está disponível, mas a sessão ainda não pôde ser confirmada pelo servidor.</p><button className="primary-cta" onClick={() => window.location.reload()}>Tentar novamente</button></div>; if (!("admin" === user.role || "columnist" === user.role)) return <div className="article-placeholder"><span className="admin-kicker">ACESSO RESTRITO</span><h1>Seu acesso ainda não foi liberado.</h1><p>Peça ao administrador do PCH News para transformar sua conta em colunista.</p><button className="primary-cta" onClick={() => window.location.assign("/login")}>Voltar ao acesso</button></div>; return <Admin />; }
function ProtectedAdmin() { const [checkingSession, setCheckingSession] = useState(true); const [hasSession, setHasSession] = useState(false); useEffect(() => { let active = true; void supabase.auth.getSession().then(({ data }) => { if (!active) return; setHasSession(Boolean(data.session)); setCheckingSession(false); }); const { data } = supabase.auth.onAuthStateChange((event, session) => { if (!active) return; if (event === "SIGNED_OUT") setHasSession(false); else if (session) setHasSession(true); }); return () => { active = false; data.subscription.unsubscribe(); }; }, []); if (checkingSession) return <div className="app-loading">Abrindo acesso seguro…</div>; if (!hasSession) return <Login />; return <AuthenticatedAdmin />; }
function ClarityRouteTracker() {
  const [location] = useLocation();
  useEffect(() => { clarityEvent("page_view"); }, [location]);
  return null;
}
function HomeOrAdmin() {
  if (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("admin") === "1") return <ProtectedAdmin />;
  return <Home />;
}
function Router() { return <Switch><Route path="/" component={HomeOrAdmin} /><Route path="/login" component={Login} />
    <Route path="/perfil" component={Profile} /><Route path="/perfil/" component={Profile} /><Route path="/admin" component={() => <Redirect to="/painel-editorial" />} /><Route path="/painel-editorial" component={ProtectedAdmin} /><Route path="/painel-editorial/" component={ProtectedAdmin} /><Route path="/admin/" component={ProtectedAdmin} /><Route path="/admin/integracoes" component={ApiHubAdminPage} /><Route path="/admin/integracoes/" component={ApiHubAdminPage} /><Route path="/materia/:slug" component={ArticlePage} /><Route path="/colunista/:slug" component={ColumnistProfile} /><Route path="/convite/:token" component={InviteAccept} /><Route path="/institucional" component={Institutional} /><Route path="/institucional/" component={Institutional} /><Route path="/anuncie" component={PublicAds} /><Route path="/anuncie/" component={PublicAds} /><Route path="/conhecimento-pch" component={KnowledgePage} /><Route path="/conhecimento-pch/" component={KnowledgePage} /><Route path="/eventos/:id" component={EventDetail} /><Route path="/eventos" component={EventsAgenda} /><Route path="/eventos/" component={EventsAgenda} /><Route path="/lei" component={LawNews} /><Route path="/lei/" component={LawNews} />
    <Route path="/privacidade" component={PrivacyPage} /><Route path="/privacidade/" component={PrivacyPage} />
    <Route path="/termos" component={TermsPage} /><Route path="/termos/" component={TermsPage} />
    <Route path="/cookies" component={CookiesPage} /><Route path="/cookies/" component={CookiesPage} />
    <Route path="/parceiros" component={PartnersPage} /><Route path="/parceiros/" component={PartnersPage} /><Route path="/correcoes" component={EditorialRequests} /><Route path="/correcoes/" component={EditorialRequests} /><Route path="/404" component={NotFound} /><Route component={NotFound} /></Switch>; }
export default function App() { return <ErrorBoundary><EditorialDataBridge /><ClarityRouteTracker /><TooltipProvider><Toaster /><Router /></TooltipProvider><PrivacyConsent /></ErrorBoundary>; }
