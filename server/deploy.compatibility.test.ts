import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

describe("deployment compatibility", () => {
  it("keeps the Lovable static build and canonical Node production build separate", () => {
    const root = process.cwd();
    const packageJson = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
    const serverEntry = fs.readFileSync(path.join(root, "server", "index.ts"), "utf8");

    expect(packageJson.scripts.build).toBe("vite build");
    expect(packageJson.scripts["build:full"]).toContain("dist/server");
    expect(packageJson.scripts["build:full"]).toContain("esbuild server/index.ts");
    expect(packageJson.scripts["start:production"]).toContain("dist/server/index.js");
    expect(serverEntry).toContain("./_core/index");
  });
});
