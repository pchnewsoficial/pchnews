import { useEffect } from "react";

type Props = { title: string; description: string; canonicalPath: string; imageUrl?: string; type?: "website" | "article" };

export default function PageMeta({ title, description, canonicalPath, imageUrl, type = "website" }: Props) {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = title;

    const set = (selector: string, attrs: Record<string, string>) => {
      const existing = document.head.querySelector(selector);
      const tagName = selector.startsWith("link") ? "link" : "meta";
      const el = existing ?? document.createElement(tagName);
      if (!existing) document.head.appendChild(el);
      Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, value));
    };

    set('meta[name="description"]', { name: "description", content: description });
    set('meta[name="author"]', { name: "author", content: "PCH News" });
    set('meta[property="og:site_name"]', { property: "og:site_name", content: "PCH News" });
    set('meta[property="og:title"]', { property: "og:title", content: title });
    set('meta[property="og:description"]', { property: "og:description", content: description });
    set('meta[property="og:type"]', { property: "og:type", content: type });
    const defaultImage = "https://wsrv.nl/?url=https%3A%2F%2Fpchnews.com.br%2Fbrand%2Fpch-news-official-current.svg&output=png&w=1200&h=630&fit=contain&bg=071a2d";
    set('meta[property="og:image"]', { property: "og:image", content: imageUrl || defaultImage });
    set('meta[property="og:image:type"]', { property: "og:image:type", content: "image/png" });

    const origin = "https://pchnews.com.br";
    const canonical = origin + canonicalPath;
    set('link[rel="canonical"]', { rel: "canonical", href: canonical });

    const structuredData = {
      "@context": "https://schema.org",
      "@type": type === "article" ? "NewsArticle" : "NewsMediaOrganization",
      "name": "PCH News",
      "url": canonical,
      "description": description,
      ...(type === "article"
        ? { "publisher": { "@type": "Organization", "name": "PCH News", "url": origin } }
        : { "alternateName": ["PCH News Portal", "PCH News Brasil"], "publishingPrinciples": origin + "/institucional" }),
    };

    let script = document.head.querySelector<HTMLScriptElement>('script[data-pch-news-schema="true"]');
    if (!script) {
      script = document.createElement("script");
      script.type = "application/ld+json";
      script.dataset.pchNewsSchema = "true";
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(structuredData);

    return () => {
      document.title = previousTitle;
    };
  }, [title, description, canonicalPath, imageUrl, type]);

  return null;
}
