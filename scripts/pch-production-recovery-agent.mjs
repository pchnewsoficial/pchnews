#!/usr/bin/env node
/**
 * PCH News Production Recovery Agent
 *
 * Deterministic recovery/audit agent for the PCH News deployment.
 * It does not redesign the application and does not replace the source-of-truth.
 * It verifies the exact production path used by Lovable/Vite and fails loudly
 * when a blank-page condition is detectable from the repository/build artifact.
 */

import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";

const root = process.cwd();
const failures = [];
const warnings = [];

function read(file) {
  return fs.readFileSync(path.join(root, file), "utf8");
}
function exists(file) {
  return fs.existsSync(path.join(root, file));
}
function fail(message) { failures.push(message); }
function warn(message) { warnings.push(message); }

const required = [
  "client/index.html",
  "client/src/main.tsx",
  "client/src/App.tsx",
  "client/src/pages/Home.tsx",
  "client/src/index.css",
  "client/public/brand/logo.svg",
  "client/public/brand/favicon.svg",
  "vite.config.ts",
  "package.json",
];

for (const file of required) {
  if (!exists(file)) fail(`missing required file: ${file}`);
}

if (exists("client/index.html")) {
  const html = read("client/index.html");
  if (!html.includes('<div id="root"></div>')) fail("client/index.html has no React root");
  if (!html.includes('/src/main.tsx')) fail("client/index.html does not load /src/main.tsx");
}

if (exists("package.json")) {
  const pkg = JSON.parse(read("package.json"));
  if (!pkg.scripts?.build?.includes("vite build")) fail("build script does not run vite build");
  const startScript = String(pkg.scripts?.start || "");
  const startHelper = exists("scripts/start-production.mjs") ? read("scripts/start-production.mjs") : "";
  if (!startScript.includes("dist/server/index.js") && !startHelper.includes("dist/server/index.js")) {
    fail("production start path does not execute dist/server/index.js");
  }
}

if (exists("vite.config.ts")) {
  const vite = read("vite.config.ts");
  if (!vite.includes('outDir: path.resolve(ROOT, "dist")') && !vite.includes('outDir: path.resolve(import.meta.dirname, "dist")')) {
    fail("Vite output is not the standard dist directory");
  }
  if (!vite.includes('publicDir: path.resolve(ROOT, "client", "public")') && !vite.includes('publicDir: path.resolve(import.meta.dirname, "client", "public")')) {
    fail("Vite publicDir is not client/public");
  }
}

if (exists("server/_core/vite.ts")) {
  const serverVite = read("server/_core/vite.ts");
  if (!serverVite.includes('path.resolve(process.cwd(), "dist")')) {
    fail("production server is not serving the Vite dist directory");
  }
}

if (exists("server/_core/index.ts")) {
  const server = read("server/_core/index.ts");
  if (!server.includes('server.listen(port, "0.0.0.0"')) {
    fail("production server is not explicitly bound to 0.0.0.0");
  }
  if (!server.includes("process.env.PORT")) {
    warn("server does not visibly reference process.env.PORT");
  }
}

async function command(cmd, args, options = {}) {
  return await new Promise((resolve) => {
    const child = spawn(cmd, args, {
      cwd: root,
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env, ...options.env },
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (d) => { stdout += d; });
    child.stderr.on("data", (d) => { stderr += d; });
    child.on("close", (code) => resolve({ code: code ?? 1, stdout, stderr }));
    child.on("error", (error) => resolve({ code: 1, stdout, stderr: String(error) }));
  });
}

if (process.argv.includes("--build")) {
  const build = await command("pnpm", ["run", "build"]);
  if (build.code !== 0) {
    fail("production build failed");
    process.stdout.write(build.stdout);
    process.stderr.write(build.stderr);
  }
}

if (exists("dist/index.html")) {
  const builtHtml = read("dist/index.html");
  if (!builtHtml.includes('<div id="root"></div>')) fail("dist/index.html has no React root");
  const assetMatches = [...builtHtml.matchAll(/(?:src|href)="([^"]+)"/g)].map((m) => m[1]);
  for (const asset of assetMatches) {
    if (!asset.startsWith("/") || asset.startsWith("//")) continue;
    const assetPath = asset.split("?")[0].split("#")[0];
    const target = path.join(root, "dist", assetPath.replace(/^\\/+/, ""));
    if (!fs.existsSync(target) && !asset.startsWith("/http")) {
      fail(`built asset missing: ${asset}`);
    }
  }
} else if (process.argv.includes("--build")) {
  fail("dist/index.html was not generated");
}

const report = {
  agent: "pch-production-recovery",
  timestamp: new Date().toISOString(),
  status: failures.length ? "FAIL" : "PASS",
  failures,
  warnings,
  sourceOfTruth: "pchnews.oficial -> pch-news main",
};

console.log(JSON.stringify(report, null, 2));
process.exit(failures.length ? 1 : 0);
