import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

import { type Article, getCategory } from "@/data/content";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Carrossel de notícias com navegação anterior/próxima e indicadores.
 * Mostra 1 card no celular, 2 no tablet e 3 no desktop.
 */
export function NewsCarousel({ articles }: { articles: Article[] }) {
  const [index, setIndex] = useState(0);
  const total = articles.length;

  if (total === 0) return null;

  const go = (next: number) => setIndex(((next % total) + total) % total);

  return (
    <div>
      <div className="rule-strong mb-5 flex items-end justify-between gap-4 pb-2">
        <h2 className="font-display text-2xl font-black sm:text-3xl">Em destaque</h2>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => go(index - 1)}
            aria-label="Notícia anterior"
            className="grid size-9 place-items-center rounded-sm border border-input transition-colors hover:bg-ink hover:text-ink-foreground"
          >
            <ChevronLeft size={16} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => go(index + 1)}
            aria-label="Próxima notícia"
            className="grid size-9 place-items-center rounded-sm border border-input transition-colors hover:bg-ink hover:text-ink-foreground"
          >
            <ChevronRight size={16} aria-hidden="true" />
          </button>
        </div>
      </div>

      <div
        className="overflow-hidden"
        role="group"
        aria-roledescription="carrossel"
        aria-label="Notícias em destaque"
      >
        <ul
          className="flex transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
          style={{ transform: `translateX(calc(-${index} * (100% / var(--per-view, 1))))` }}
        >
          {articles.map((article, position) => {
            const category = getCategory(article.category);
            return (
              <li
                key={article.slug}
                aria-hidden={position < index || position > index + 2}
                className="w-full shrink-0 px-2 first:pl-0 last:pr-0 sm:w-1/2 lg:w-1/3"
              >
                <article className="group">
                  <Link
                    to="/noticia/$slug"
                    params={{ slug: article.slug }}
                    className="block overflow-hidden rounded-sm bg-muted"
                  >
                    <img
                      src={article.image}
                      alt=""
                      width={1200}
                      height={752}
                      loading="lazy"
                      decoding="async"
                      className="aspect-[16/10] w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                    />
                  </Link>
                  <p className="kicker mt-3">{category?.name}</p>
                  <h3 className="mt-1 font-display text-lg font-bold leading-snug">
                    <Link
                      to="/noticia/$slug"
                      params={{ slug: article.slug }}
                      className="headline-link"
                    >
                      {article.title}
                    </Link>
                  </h3>
                  <p className="meta mt-2">{formatDate(article.publishedAt)}</p>
                </article>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="mt-5 flex justify-center gap-2">
        {articles.map((article, position) => (
          <button
            key={article.slug}
            type="button"
            onClick={() => go(position)}
            aria-label={`Ir para a notícia ${position + 1} de ${total}`}
            aria-current={position === index}
            className={cn(
              "h-1.5 rounded-full transition-all",
              position === index ? "w-6 bg-primary" : "w-1.5 bg-ink/25 hover:bg-ink/45",
            )}
          />
        ))}
      </div>

      <style>{`
        @media (min-width: 640px) { ul[class*="flex transition-transform"] { --per-view: 2; } }
      `}</style>
    </div>
  );
}
