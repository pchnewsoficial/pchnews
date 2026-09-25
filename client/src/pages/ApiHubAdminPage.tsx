import { Redirect } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import ApiHubPanel from "@/components/ApiHubPanel";

export default function ApiHubAdminPage() {
  const { user, loading } = useAuth();

  if (loading) return <div className="app-loading">Carregando acesso seguro…</div>;
  if (!user) return <Redirect to="/login" />;
  if (user.role !== "admin") return <Redirect to="/admin" />;

  return <ApiHubPanel isAdmin />;
}
