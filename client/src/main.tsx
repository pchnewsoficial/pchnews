import { trpc } from "@/lib/trpc";
import { UNAUTHED_ERR_MSG } from "@shared/const";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import App from "./App";
import { supabase } from "./lib/supabase";
import "./index.css";
import { initClarity, applyClarityConsent } from "./lib/clarity";
import { readPrivacyConsent } from "./lib/privacyConsent";

const privacyConsent = readPrivacyConsent();
initClarity(privacyConsent?.analytics ?? false, privacyConsent?.advertising ?? false);
applyClarityConsent(privacyConsent?.analytics ?? false, privacyConsent?.advertising ?? false);

const queryClient = new QueryClient();

const redirectToLoginIfUnauthorized = (error: unknown) => {
  if (!(error instanceof TRPCClientError)) return;
  if (typeof window === "undefined") return;
  if (error.message === UNAUTHED_ERR_MSG) window.location.href = "/login";
};

queryClient.getQueryCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") redirectToLoginIfUnauthorized(event.query.state.error);
});
queryClient.getMutationCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") redirectToLoginIfUnauthorized(event.mutation.state.error);
});

const apiBaseUrl = (() => {
  const configured = import.meta.env.VITE_API_BASE_URL?.trim().replace(/\/$/, "");
  if (configured) return configured;
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    // Production builds may be served by Lovable, Cloudflare Pages, or the
    // Worker itself. All public/editorial API traffic must use the PCH News
    // Worker instead of accidentally targeting a static host's /api path.
    if (host.endsWith(".lovable.app") || host.endsWith(".pages.dev") || host === "pchnews.com.br" || host === "www.pchnews.com.br") {
      return "https://pch-news.pchnews-oficial.workers.dev";
    }
    if (host === "pch-news.pchnews-oficial.workers.dev") return "";
  }
  return "";
})();

const trpcClient = trpc.createClient({
  links: [httpBatchLink({
    url: `${apiBaseUrl}/api/trpc`,
    transformer: superjson,
    async headers() {
      const { data } = await supabase.auth.getSession();
      return data.session?.access_token ? { Authorization: `Bearer ${data.session.access_token}` } : {};
    },
    fetch(input, init) {
      return globalThis.fetch(input, { ...(init ?? {}), credentials: "include" });
    },
  })],
});

createRoot(document.getElementById("root")!).render(
  <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}><App /></QueryClientProvider>
  </trpc.Provider>
);
