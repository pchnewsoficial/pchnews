import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const serverEntry = path.join(root, "dist", "server", "index.js");
const clientEntry = path.join(root, "dist", "index.html");

if (!fs.existsSync(serverEntry) || !fs.existsSync(clientEntry)) {
  console.log("[PCH Recovery] Production build missing; rebuilding before startup.");
  const npmExecPath = process.env.npm_execpath;
  const command = npmExecPath ? process.execPath : "npm";
  const args = npmExecPath
    ? [npmExecPath, "run", "build"]
    : ["run", "build"];
  const result = spawnSync(command, args, { cwd: root, stdio: "inherit", env: process.env });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

process.env.NODE_ENV = "production";
await import("../dist/server/index.js");
