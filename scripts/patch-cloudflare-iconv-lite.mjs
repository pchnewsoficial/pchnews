import fs from "node:fs";
import path from "node:path";

const pnpmDir = path.join(process.cwd(), "node_modules", ".pnpm");

if (!fs.existsSync(pnpmDir)) process.exit(0);

let patched = 0;

for (const entry of fs.readdirSync(pnpmDir)) {
  if (!entry.startsWith("iconv-lite@")) continue;

  const pkgPath = path.join(
    pnpmDir,
    entry,
    "node_modules",
    "iconv-lite",
    "package.json",
  );

  if (!fs.existsSync(pkgPath)) continue;

  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));

  if (pkg.browser && typeof pkg.browser === "object") {
    delete pkg.browser;
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
    patched++;
    console.log(`[cloudflare] Removed iconv-lite browser mappings from ${pkgPath}`);
  }
}

console.log(`[cloudflare] iconv-lite compatibility patch applied to ${patched} package(s).`);
