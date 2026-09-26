import { ArrowDown, ArrowLeft, ArrowUp, Home as HomeIcon, Menu, Newspaper, Search, UserCircle, X } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Redirect, Route, Switch, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import Login from "./pages/Login";
import ErrorBoundary from "./components/ErrorBoundary";
import Admin from "./pages/Admin";
import Home from "./pages/Home";
import ArticlePage from "./pages/ArticlePage";
import ColumnistProfile from "./pages/ColumnistProfile";
import InviteAccept from "./pages/InviteAccept";
import Profile from "./pages/Profile";
import ApiHubAdminPage from "./pages/ApiHubAdminPage";
import NotFound from "./pages/NotFound";
import Institutional from "./pages/Institutional";
import PublicAds from "./pages/PublicAds";
import LawNews from "./pages/LawNews";
import PrivacyConsent from "./components/PrivacyConsent";
import { PrivacyPage, TermsPage, CookiesPage, PartnersPage } from "./pages/LegalPages";
import EditorialDataBridge from "./components/EditorialDataBridge";
import { useEffect } from "react";
import { clarityEvent } from "./lib/clarity";
function ProtectedAdmin() { const { user, loading, error } = useAuth(); if (loading) return <div className="app-loading">Carregando acesso seguro…</div>; if (!user) return <Login />; if (error) return <div className="article-placeholder"><span className="admin-kicker">FALHA DE AUTENTICAÇÃO</span><h1>Não foi possível validar sua sessão.</h1><p>O acesso ao painel está disponível, mas a sessão ainda não pôde ser confirmada pelo servidor.</p><button className="primary-cta" onClick={() => window.location.reload()}>Tentar novamente</button></div>; if (!("admin" === user.role || "columnist" === user.role)) return <div className="article-placeholder"><span className="admin-kicker">ACESSO RESTRITO</span><h1>Seu acesso ainda não foi liberado.</h1><p>Peça ao administrador do PCH News para transformar sua conta em colunista.</p><button className="primary-cta" onClick={() => window.location.assign("/login")}>Voltar ao acesso</button></div>; return <Admin />; }
function NavigationEnhancements() {
  const [location, navigate] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const hash = window.location.hash;
    const timer = window.setTimeout(() => {
      if (hash) document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: "smooth", block: "start" });
      else window.scrollTo({ top: 0, behavior: "auto" });
    }, 30);
    return () => window.clearTimeout(timer);
  }, [location]);

  const goHome = () => {
    setMenuOpen(false);
    navigate("/");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const goBack = () => {
    setMenuOpen(false);
    if (window.history.length > 1) window.history.back();
    else goHome();
  };

  return <>
    <div className="page-float-actions" aria-label="Navegação rápida">
      <button type="button" onClick={goBack} aria-label="Voltar"><ArrowLeft size={17} /></button>
      <button type="button" onClick={goHome} aria-label="Ir para o início"><HomeIcon size={17} /></button>
      <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} aria-label="Subir"><ArrowUp size={17} /></button>
      <button type="button" onClick={() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "smooth" })} aria-label="Descer"><ArrowDown size={17} /></button>
    </div>
    <nav className="mobile-quick-bar" aria-label="Acesso rápido">
      <button type="button" onClick={goHome}><HomeIcon size={19}/><span>Início</span></button>
      <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}><ArrowUp size={19}/><span>Topo</span></button>
      <button type="button" onClick={goBack}><ArrowLeft size={19}/><span>Voltar</span></button>
      <button type="button" onClick={() => setMenuOpen((open) => !open)}><Menu size={19}/><span>Mais</span></button>
    </nav>
    {menuOpen && <div className="mobile-quick-menu" role="dialog" aria-label="Mais acessos">
      <button type="button" onClick={() => { setMenuOpen(false); navigate("/#ultimas"); }}><Newspaper size={18}/> Últimas notícias</button>
      <button type="button" onClick={() => { setMenuOpen(false); navigate("/#colunistas"); }}><UserCircle size={18}/> Colunistas</button>
      <button type="button" onClick={() => { setMenuOpen(false); navigate("/#busca"); }}><Search size={18}/> Busca</button>
      <button type="button" onClick={() => setMenuOpen(false)}><X size={18}/> Fechar</button>
    </div>}
  </>;
}

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
    <Route path="/perfil" component={Profile} /><Route path="/perfil/" component={Profile} /><Route path="/admin" component={ProtectedAdmin} /><Route path="/admin/" component={ProtectedAdmin} /><Route path="/admin/integracoes" component={ApiHubAdminPage} /><Route path="/admin/integracoes/" component={ApiHubAdminPage} /><Route path="/materia/:slug" component={ArticlePage} /><Route path="/colunista/:slug" component={ColumnistProfile} /><Route path="/convite/:token" component={InviteAccept} /><Route path="/institucional" component={Institutional} /><Route path="/institucional/" component={Institutional} /><Route path="/anuncie" component={PublicAds} /><Route path="/anuncie/" component={PublicAds} /><Route path="/lei" component={LawNews} /><Route path="/lei/" component={LawNews} />
    <Route path="/privacidade" component={PrivacyPage} /><Route path="/privacidade/" component={PrivacyPage} />
    <Route path="/termos" component={TermsPage} /><Route path="/termos/" component={TermsPage} />
    <Route path="/cookies" component={CookiesPage} /><Route path="/cookies/" component={CookiesPage} />
    <Route path="/parceiros" component={PartnersPage} /><Route path="/parceiros/" component={PartnersPage} /><Route path="/404" component={NotFound} /><Route component={NotFound} /></Switch>; }
export default function App() { return <ErrorBoundary><EditorialDataBridge /><ClarityRouteTracker /><NavigationEnhancements /><TooltipProvider><Toaster /><PrivacyConsent /><Router /></TooltipProvider></ErrorBoundary>; }
