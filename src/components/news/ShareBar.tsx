import { Check, Link2, Share2 } from "lucide-react";
import { useState } from "react";

export function ShareBar({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);

  const currentUrl = () => (typeof window === "undefined" ? "" : window.location.href);

  const shareLinks = [
    {
      label: "WhatsApp",
      href: () => `https://wa.me/?text=${encodeURIComponent(`${title} ${currentUrl()}`)}`,
    },
    {
      label: "Facebook",
      href: () => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl())}`,
    },
    {
      label: "LinkedIn",
      href: () =>
        `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(currentUrl())}`,
    },
  ];

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl());
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2 border-y border-border py-4">
      <span className="kicker mr-1 flex items-center gap-1.5">
        <Share2 size={13} aria-hidden="true" /> Compartilhar
      </span>
      {shareLinks.map((item) => (
        <a
          key={item.label}
          href={item.href()}
          target="_blank"
          rel="noreferrer noopener"
          className="rounded-sm border border-input px-3 py-1.5 text-xs font-medium transition-colors hover:bg-ink hover:text-ink-foreground"
        >
          {item.label}
        </a>
      ))}
      <button
        type="button"
        onClick={copy}
        className="flex items-center gap-1.5 rounded-sm border border-input px-3 py-1.5 text-xs font-medium transition-colors hover:bg-ink hover:text-ink-foreground"
      >
        {copied ? <Check size={13} aria-hidden="true" /> : <Link2 size={13} aria-hidden="true" />}
        {copied ? "Link copiado" : "Copiar link"}
      </button>
    </div>
  );
}
