import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig, type Plugin } from "vite";
import { copyFileSync, mkdirSync } from "node:fs";

const ROOT = process.cwd();

const spaDeepLinkPlugin: Plugin = {
  name: "pch-spa-deep-link-entrypoints",
  closeBundle() {
    const source = path.resolve(ROOT, "dist", "index.html");
    for (const route of ["admin", "admin/integracoes", "login", "perfil", "404", "colunista", "materia", "convite"]) {
      const targetDir = path.resolve(ROOT, "dist", route);
      mkdirSync(targetDir, { recursive: true });
      copyFileSync(source, path.join(targetDir, "index.html"));
    }
  },
};

export default defineConfig({
  plugins: [react(), tailwindcss(), spaDeepLinkPlugin],
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
    // Use the conventional Vite output directory so Lovable and other hosts
    // can detect and serve the frontend without custom output assumptions.
    outDir: path.resolve(ROOT, "dist"),
    emptyOutDir: true,
  },
  server: {
    host: true,
    proxy: {
      "/api": {
        target: process.env.PCH_PREVIEW_API_TARGET || "https://pch-news.pchnews-oficial.workers.dev",
        changeOrigin: true,
        secure: true,
      },
      "/manus-storage": {
        target: process.env.PCH_PREVIEW_API_TARGET || "https://pch-news.pchnews-oficial.workers.dev",
        changeOrigin: true,
        secure: true,
      },
      "/legacy-image": {
        target: process.env.PCH_PREVIEW_API_TARGET || "https://pch-news.pchnews-oficial.workers.dev",
        changeOrigin: true,
        secure: true,
      },
    },
  },
});
