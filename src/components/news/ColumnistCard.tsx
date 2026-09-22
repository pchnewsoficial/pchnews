import { Link } from "@tanstack/react-router";

import { type Article, type Columnist } from "@/data/content";

export function ColumnistCard({
  columnist,
  latest,
  tone = "dark",
}: {
  columnist: Columnist;
  latest?: Article;
  tone?: "dark" | "light";
}) {
  const isDark = tone === "dark";

  return (
    <article
      className={
        isDark
          ? "rounded-sm border border-white/12 bg-white/[0.04] p-5"
          : "rounded-sm border border-border bg-card p-5 shadow-card"
      }
    >
      <div className="flex items-center gap-3">
        <img
          src={columnist.photo}
          alt={`Foto de ${columnist.name}`}
          width={816}
          height={816}
          loading="lazy"
          decoding="async"
          className="size-14 shrink-0 rounded-full object-cover"
        />
        <div className="min-w-0">
          <h3 className="truncate font-display text-lg font-bold">
            <Link
              to="/colunistas/$slug"
              params={{ slug: columnist.slug }}
              className="headline-link"
            >
              {columnist.name}
            </Link>
          </h3>
          <p className="kicker">{columnist.beat}</p>
        </div>
      </div>

      {latest ? (
        <div className="mt-4">
          <h4 className="font-display text-base font-bold leading-snug">
            <Link to="/noticia/$slug" params={{ slug: latest.slug }} className="headline-link">
              {latest.title}
            </Link>
          </h4>
          <p
            className={
              isDark
                ? "mt-1.5 text-sm leading-relaxed text-ink-foreground/60"
                : "mt-1.5 text-sm leading-relaxed text-muted-foreground"
            }
          >
            {latest.excerpt}
          </p>
        </div>
      ) : (
        <p
          className={
            isDark
              ? "mt-4 text-sm text-ink-foreground/60"
              : "mt-4 text-sm text-muted-foreground"
          }
        >
          {columnist.shortBio}
        </p>
      )}
    </article>
  );
}
