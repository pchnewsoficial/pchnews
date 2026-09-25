import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Redirect, Route, Switch, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
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
import EditorialDataBridge from "./components/EditorialDataBridge";
import { useEffect } from "react";
import { clarityEvent } from "./lib/clarity";
function ProtectedAdmin() { const { user, loading, error } = useAuth(); if (loading) return <div className="app-loading">Carregando acesso seguro…</div>; if (!user) return <Login />; if (error) return <div className="article-placeholder"><span className="admin-kicker">FALHA DE AUTENTICAÇÃO</span><h1>Não foi possível validar sua sessão.</h1><p>O acesso ao painel está disponível, mas a sessão ainda não pôde ser confirmada pelo servidor.</p><button className="primary-cta" onClick={() => window.location.reload()}>Tentar novamente</button></div>; if (!("admin" === user.role || "columnist" === user.role)) return <div className="article-placeholder"><span className="admin-kicker">ACESSO RESTRITO</span><h1>Seu acesso ainda não foi liberado.</h1><p>Peça ao administrador do PCH News para transformar sua conta em colunista.</p><button className="primary-cta" onClick={() => startLogin()}>Atualizar sessão</button></div>; return <Admin />; }
function ClarityRouteTracker() {
  const [location] = useLocation();
  useEffect(() => { clarityEvent("page_view"); }, [location]);
  return null;
}
function Router() { return <Switch><Route path="/" component={Home} /><Route path="/login" component={Login} />
    <Route path="/perfil" component={Profile} /><Route path="/admin" component={ProtectedAdmin} /><Route path="/admin/integracoes" component={ApiHubAdminPage} /><Route path="/materia/:slug" component={ArticlePage} /><Route path="/colunista/:slug" component={ColumnistProfile} /><Route path="/convite/:token" component={InviteAccept} /><Route path="/404" component={NotFound} /><Route component={NotFound} /></Switch>; }
export default function App() { return <ErrorBoundary><EditorialDataBridge /><ClarityRouteTracker /><TooltipProvider><Toaster /><Router /></TooltipProvider></ErrorBoundary>; }
