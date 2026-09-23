import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

describe("deployment compatibility", () => {
  it("keeps both the canonical server entry and the Lovable-compatible entry in the build contract", () => {
    const root = process.cwd();
    const packageJson = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
    const serverEntry = fs.readFileSync(path.join(root, "server", "index.ts"), "utf8");

    expect(packageJson.scripts.build).toContain("dist/server");
    expect(packageJson.scripts.build).toContain("esbuild server/index.ts");
    expect(serverEntry).toContain('./_core/index');
  });
});
