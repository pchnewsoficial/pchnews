import { handleAsNodeRequest } from "cloudflare:node";
import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "../server/_core/oauth";
import { registerStorageProxy } from "../server/_core/storageProxy";
import { appRouter } from "../server/routers";
import { createContext } from "../server/_core/context";

const app = express();

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

app.get("/healthz", (_req, res) => {
  res.status(200).json({ ok: true, service: "pch-news", runtime: "cloudflare-workers" });
});

registerStorageProxy(app);
registerOAuthRoutes(app);

app.use(
  "/api/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext,
  }),
);

app.listen(3000);

export default {
  async fetch(request: Request, env: { ASSETS: Fetcher }) {
    const url = new URL(request.url);

    // Backend routes stay on the Node/Express Worker.
    if (
      url.pathname === "/healthz" ||
      url.pathname.startsWith("/api/") ||
      url.pathname.startsWith("/manus-storage/")
    ) {
      return handleAsNodeRequest(3000, request);
    }

    // The React/Vite production build is published through Cloudflare Assets.
    // not_found_handling=single-page-application in wrangler.jsonc makes
    // client-side routes (e.g. /admin and /materia/:slug) resolve to index.html.
    return env.ASSETS.fetch(request);
  },
};
