import { useEffect } from "react";

type Props = { title: string; description: string; canonicalPath: string };

export default function PageMeta({ title, description, canonicalPath }: Props) {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = title;
    const set = (selector: string, attrs: Record<string,string>) => {
      let el = document.head.querySelector(selector) as HTMLMetaElement | HTMLLinkElement | null;
      if (!el) { el = document.createElement(selector.startsWith("link") ? "link" : "meta") as any; document.head.appendChild(el); }
      Object.entries(attrs).forEach(([key,value]) => el!.setAttribute(key,value));
    };
    set('meta[name="description"]',{name:"description",content:description});
    set('meta[property="og:title"]',{property:"og:title",content:title});
    set('meta[property="og:description"]',{property:"og:description",content:description});
    const origin=window.location.origin;
    set('link[rel="canonical"]',{rel:"canonical",href:origin+canonicalPath});
    return () => { document.title=previousTitle; };
  },[title,description,canonicalPath]);
  return null;
}
