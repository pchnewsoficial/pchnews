import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Home article state regression", () => {
  it("declares the article collection before any Home render derives from it", () => {
    const source = readFileSync(resolve(process.cwd(), "client/src/pages/Home.tsx"), "utf8");
    expect(source).toMatch(/export default function Home\(\)[\s\S]*const \[articles, setArticles\] = useState<NewsArticle\[\]>\(\[\]\);/);
  });
});
