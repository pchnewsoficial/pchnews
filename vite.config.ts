import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig } from "vite";

const ROOT = process.cwd();

export default defineConfig({
  plugins: [react(), tailwindcss()],
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
