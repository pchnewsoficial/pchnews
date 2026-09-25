import { copyFile, mkdir } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const source = path.join(root, "dist", "index.html");

// Lovable's published static host currently resolves the site root but may
// request deep SPA routes as real files. Materialize directory index files for
// the protected entry points so /admin and /login remain directly addressable.
// Cloudflare already has SPA fallback, so this is additive and harmless there.
const routes = [
  "admin",
  "admin/integracoes",
  "login",
  "perfil",
  "404",
  "colunista",
  "materia",
  "convite",
];

for (const route of routes) {
  const targetDir = path.join(root, "dist", route);
  await mkdir(targetDir, { recursive: true });
  await copyFile(source, path.join(targetDir, "index.html"));
}

console.log(`SPA deep-link entrypoints prepared: ${routes.length}`);
