import { describe, expect, it } from "vitest";
import { parseHostingPressRss } from "./hostingPressRssSync";

const item = (overrides: { link?: string; body?: string; date?: string; image?: string } = {}) => `
  <item>
    <title>Alesp &amp; transparência</title>
    <link>${overrides.link || "https://pchnews.hostingpress.com.br/materia/alesp"}</link>
    <guid isPermaLink="true">https://pchnews.hostingpress.com.br/materia/alesp</guid>
    <pubDate>${overrides.date || "Thu, 29 Oct 2026 15:14:41 -0300"}</pubDate>
    <category>Notícias</category>
    <dc:creator>Naja Press Redação</dc:creator>
    <enclosure url="${overrides.image || "https://hostingpress.com.br/uploads/materia.png"}" type="image/png" />
    <description><![CDATA[Resumo da matéria.]]></description>
    <content:encoded><![CDATA[${overrides.body || "<p>Texto <strong>integral</strong>.</p>"}]]></content:encoded>
  </item>`;

const feed = (...items: string[]) => `<rss version="2.0"><channel>${items.join("")}</channel></rss>`;

describe("parseHostingPressRss", () => {
  it("extracts full-text content and article metadata from the feed", () => {
    const [article] = parseHostingPressRss(feed(item()));
    expect(article.title).toBe("Alesp & transparência");
    expect(article.url).toBe("https://pchnews.hostingpress.com.br/materia/alesp");
    expect(article.category).toBe("Notícias");
    expect(article.author).toBe("Naja Press Redação");
    expect(article.summary).toBe("Resumo da matéria.");
    expect(article.bodyHtml).toContain("<strong>integral</strong>");
    expect(article.imageUrl).toBe("https://hostingpress.com.br/uploads/materia.png");
    expect(article.publishedAt.toISOString()).toBe("2026-10-29T18:14:41.000Z");
  });

  it("removes executable markup and unsafe links while retaining article text", () => {
    const [article] = parseHostingPressRss(feed(item({
      body: '<p>Seguro</p><script>alert(1)</script><a href="javascript:alert(2)">link</a><img src="https://evil.example/x.png" onerror="alert(3)">',
    })));
    expect(article.bodyHtml).toContain("Seguro");
    expect(article.bodyHtml).not.toContain("<script");
    expect(article.bodyHtml).not.toContain("javascript:");
    expect(article.bodyHtml).not.toContain("onerror");
    expect(article.bodyHtml).not.toContain("evil.example");
  });

  it("rejects article links outside the HostingPRESS PCH News origin", () => {
    expect(parseHostingPressRss(feed(item({ link: "https://evil.example/materia/fake" })))).toEqual([]);
  });

  it("ignores records with invalid publication dates", () => {
    expect(parseHostingPressRss(feed(item({ date: "not a real date" })))).toEqual([]);
  });

  it("rejects a non-RSS response instead of importing an HTML login page", () => {
    expect(() => parseHostingPressRss("<html><body>Login</body></html>")).toThrow("feed RSS válido");
  });
});
