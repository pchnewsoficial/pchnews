#!/usr/bin/env node
/**
 * PCH News — Codex recovery audit
 *
 * Safe repository-level validation for Lovable/Vite/Cloudflare deployment.
 * It is intentionally read-only except for generating dist during --build.
 *
 * Usage:
 *   node scripts/codex-pch-news-audit.mjs
 *   node scripts/codex-pch-news-audit.mjs --build
 *   node scripts/codex-pch-news-audit.mjs --build --smoke
 */

import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";

const root = process.cwd();
const failures = [];
const warnings = [];
const checks = [];

const requiredFiles = [
  "client/index.html",
  "client/src/main.tsx",
  "client/src/App.tsx",
  "client/src/pages/Home.tsx",
  "client/src/pages/Admin.tsx",
  "client/public/brand/logo.svg",
  "client/public/brand/favicon.svg",
  "client/public/site.webmanifest",
  "vite.config.ts",
  "package.json",
];

const routes = ["/", "/login", "/admin", "/admin/integracoes", "/perfil", "/404"];

const exists = (file) => fs.existsSync(path.join(root, file));
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const pass = (name, detail = "") => checks.push({ name, status: "PASS", detail });
const fail = (name, detail) => {
  failures.push({ name, detail });
  checks.push({ name, status: "FAIL", detail });
};
const warn = (name, detail) => {
  warnings.push({ name, detail });
  checks.push({ name, status: "WARN", detail });
};

function run(command, args, options = {}) {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd: root,
      env: { ...process.env, ...options.env },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => (stdout += chunk));
    child.stderr.on("data", (chunk) => (stderr += chunk));
    child.on("error", (error) => resolve({ code: 1, stdout, stderr: String(error) }));
    child.on("close", (code) => resolve({ code: code ?? 1, stdout, stderr }));
  });
}

for (const file of requiredFiles) {
  if (!exists(file)) fail("required-file", `missing ${file}`);
}
if (!failures.length) pass("required-files");

if (exists("client/index.html")) {
  const html = read("client/index.html");
  if (!html.includes('<div id="root"></div>')) fail("react-root", "client/index.html has no #root");
  else pass("react-root");

  if (!html.includes('/src/main.tsx')) fail("entrypoint", "client/index.html does not load /src/main.tsx");
  else pass("entrypoint");

  if (!html.includes('/brand/logo.svg')) fail("logo-reference", "official logo is not referenced from index.html");
  else pass("logo-reference");
}

if (exists("package.json")) {
  const pkg = JSON.parse(read("package.json"));
  if (pkg.scripts?.build !== "vite build") {
    fail("build-script", "package.json build must be exactly vite build");
  } else pass("build-script");

  if (!pkg.scripts?.check?.includes("tsc --noEmit")) {
    fail("typecheck-script", "package.json check script must run tsc --noEmit");
  } else pass("typecheck-script");

  if (!pkg.scripts?.test) warn("test-script", "no test script configured");
  else pass("test-script");
}

if (exists("vite.config.ts")) {
  const vite = read("vite.config.ts");
  if (!vite.includes('outDir: path.resolve(ROOT, "dist")')) {
    fail("vite-output", "Vite output is not ROOT/dist");
  } else pass("vite-output");

  if (!vite.includes('publicDir: path.resolve(ROOT, "client", "public")')) {
    fail("vite-public-dir", "Vite publicDir is not client/public");
  } else pass("vite-public-dir");

  for (const route of routes.filter((r) => r !== "/")) {
    const routePath = route.replace(/^\//, "");
    if (!vite.includes(`"${routePath}"`)) {
      warn("spa-route", `build does not explicitly materialize ${route}`);
    }
  }
}

if (exists("server/_core/index.ts")) {
  const server = read("server/_core/index.ts");
  if (!server.includes('server.listen(port, "0.0.0.0"')) {
    fail("server-bind", "production server is not bound to 0.0.0.0");
  } else pass("server-bind");
  if (!server.includes("process.env.PORT")) {
    warn("server-port", "server does not visibly read process.env.PORT");
  }
}

if (process.argv.includes("--build")) {
  const build = await run("pnpm", ["run", "build"]);
  if (build.code !== 0) {
    fail("vite-build", build.stderr || build.stdout);
  } else pass("vite-build");
}

if (exists("dist/index.html")) {
  const html = read("dist/index.html");
  if (!html.includes('<div id="root"></div>')) fail("dist-root", "dist/index.html has no #root");
  else pass("dist-root");

  const assets = [...html.matchAll(/(?:src|href)="([^"]+)"/g)]
    .map((m) => m[1])
    .filter((asset) => asset.startsWith("/") && !asset.startsWith("//"));

  for (const asset of assets) {
    const relative = asset.split("?")[0].split("#")[0].replace(/^\//, "");
    if (/^(api|manus-storage|legacy-image)\//.test(relative)) continue;
    if (!fs.existsSync(path.join(root, "dist", relative))) {
      fail("dist-asset", `missing built asset ${asset}`);
    }
  }
  if (!failures.some((f) => f.name === "dist-asset")) pass("dist-assets");
}

async function smokeTest() {
  if (!exists("dist/index.html")) {
    fail("smoke", "dist does not exist; run with --build");
    return;
  }

  const port = 4173;
  const server = spawn("pnpm", ["exec", "vite", "preview", "--host", "127.0.0.1", "--port", String(port)], {
    cwd: root,
    env: process.env,
    stdio: ["ignore", "pipe", "pipe"],
  });

  let ready = false;
  const started = Date.now();
  while (Date.now() - started < 15000) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/`);
      if (response.ok) {
        ready = true;
        break;
      }
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  if (!ready) {
    server.kill("SIGTERM");
    fail("smoke-server", "Vite preview did not become reachable");
    return;
  }

  for (const route of routes) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}${route}`);
      const body = await response.text();
      if (!response.ok) fail("route-smoke", `${route} returned HTTP ${response.status}`);
      else if (!body.includes('<div id="root"></div>')) fail("route-smoke", `${route} did not return the React shell`);
      else pass("route-smoke", `${route} -> ${response.status}`);
    } catch (error) {
      fail("route-smoke", `${route}: ${error.message}`);
    }
  }

  server.kill("SIGTERM");
}

if (process.argv.includes("--smoke")) await smokeTest();

const report = {
  agent: "codex-pch-news-recovery-audit",
  timestamp: new Date().toISOString(),
  status: failures.length ? "FAIL" : "PASS",
  checks,
  failures,
  warnings,
  sourceOfTruth: "pchnewsoficial/pch-news@main",
  routes,
};

console.log(JSON.stringify(report, null, 2));
process.exit(failures.length ? 1 : 0);
