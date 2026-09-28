import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig } from "vite";
const ROOT = process.cwd();

export default defineConfig({
  plugins: [react(), tailwindcss(), {
    // Static hosts may not provide an SPA fallback: emit index.html copies for client-side routes.
    name: "pch-spa-fallback",
    apply: "build",
    async closeBundle() {
      const fs = await import("node:fs");
      const out = path.resolve(ROOT, "dist");
      const index = path.join(out, "index.html");
      if (!fs.existsSync(index)) return;
      const html = fs.readFileSync(index);
      fs.writeFileSync(path.join(out, "404.html"), html);
      for (const r of ["login", "admin", "admin/integracoes", "perfil", "institucional", "anuncie", "conhecimento-pch", "eventos", "lei", "privacidade", "termos", "cookies", "parceiros", "correcoes"]) {
        fs.mkdirSync(path.join(out, r), { recursive: true });
        fs.writeFileSync(path.join(out, r, "index.html"), html);
      }
    },
  }],
  resolve: {
    alias: {
      "@": path.resolve(ROOT, "client", "src"),
      "@shared": path.resolve(ROOT, "shared"),
      "@assets": path.resolve(ROOT, "attached_assets"),
    },
  },
  envDir: ROOT,
  root: path.resolve(ROOT, "client"),
  publicDir: path.resolve(ROOT, "client", "public"),
  build: {
    // Use the conventional Vite output directory so static hosts can detect
    // and serve the frontend without custom output assumptions.
    outDir: path.resolve(ROOT, "dist"),
    emptyOutDir: true,
  },
  server: {
    host: true,
    proxy: {
      "/api": {
        target: process.env.PCH_PREVIEW_API_TARGET || "https://pchnews.pchnews-oficial.workers.dev",
        changeOrigin: true,
        secure: true,
      },
      "/manus-storage": {
        target: process.env.PCH_PREVIEW_API_TARGET || "https://pchnews.pchnews-oficial.workers.dev",
        changeOrigin: true,
        secure: true,
      },
      "/legacy-image": {
        target: process.env.PCH_PREVIEW_API_TARGET || "https://pchnews.pchnews-oficial.workers.dev",
        changeOrigin: true,
        secure: true,
      },
    },
  },
});
