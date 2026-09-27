import { useEffect } from "react";

type Props = { title: string; description: string; canonicalPath: string; imageUrl?: string; type?: "website" | "article" };

export default function PageMeta({ title, description, canonicalPath }: Props) {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = title;

    const set = (selector: string, attrs: Record<string, string>) => {
      const existing = document.head.querySelector(selector);
      const tagName = selector.startsWith("link") ? "link" : "meta";
      const el = existing ?? document.createElement(tagName);

      if (!existing) {
        document.head.appendChild(el);
      }

      Object.entries(attrs).forEach(([key, value]) => {
        el.setAttribute(key, value);
      });
    };

    set('meta[name="description"]', { name: "description", content: description });
    set('meta[property="og:title"]', { property: "og:title", content: title });
    set('meta[property="og:description"]', { property: "og:description", content: description });
    set('meta[property="og:image"]', { property: "og:image", content: "https://wsrv.nl/?url=https%3A%2F%2Fpch-news.pchnews-oficial.workers.dev%2Fbrand%2Fpch-news-official-current.svg&output=png&w=1200&h=630&fit=contain&bg=071a2d" });

    const origin = window.location.origin;
    set('link[rel="canonical"]', { rel: "canonical", href: origin + canonicalPath });

    return () => {
      document.title = previousTitle;
    };
  }, [title, description, canonicalPath]);

  return null;
}
