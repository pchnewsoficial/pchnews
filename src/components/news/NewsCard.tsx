import { Link } from "@tanstack/react-router";

import { type Article, EDITION_NOW, getCategory, getColumnistName } from "@/data/content";
import { formatDate, timeAgo } from "@/lib/format";

function CategoryTag({ slug }: { slug: string }) {
  const category = getCategory(slug);
  if (!category) return null;
  return (
    <Link
      to="/categoria/$slug"
      params={{ slug: category.slug }}
      className="kicker transition-colors hover:text-foreground"
    >
      {category.name}
    </Link>
  );
}

/** Card padrão: imagem, editoria, título, resumo e data. */
export function NewsCard({ article, priority = false }: { article: Article; priority?: boolean }) {
  return (
    <article className="group flex flex-col">
      <Link
        to="/noticia/$slug"
        params={{ slug: article.slug }}
        tabIndex={-1}
        aria-hidden="true"
        className="block overflow-hidden rounded-sm bg-muted"
      >
        <img
          src={article.image}
          alt=""
          width={1200}
          height={752}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          className="aspect-[16/10] w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
        />
      </Link>
      <div className="mt-3 flex flex-1 flex-col">
        <CategoryTag slug={article.category} />
        <h3 className="mt-1.5 font-display text-xl font-bold leading-snug">
          <Link to="/noticia/$slug" params={{ slug: article.slug }} className="headline-link">
            {article.title}
          </Link>
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{article.excerpt}</p>
        <p className="meta mt-3 pt-1">
          {getColumnistName(article.authorSlug)} · {formatDate(article.publishedAt)} ·{" "}
          {timeAgo(article.publishedAt, EDITION_NOW)}
        </p>
      </div>
    </article>
  );
}

/** Item de lista compacto usado em categorias e páginas de colunista. */
export function NewsListItem({ article }: { article: Article }) {
  return (
    <article className="group flex gap-4 border-b border-border pb-5">
      <Link
        to="/noticia/$slug"
        params={{ slug: article.slug }}
        tabIndex={-1}
        aria-hidden="true"
        className="hidden w-32 shrink-0 overflow-hidden rounded-sm bg-muted sm:block"
      >
        <img
          src={article.image}
          alt=""
          width={1200}
          height={752}
          loading="lazy"
          decoding="async"
          className="aspect-square w-full object-cover"
        />
      </Link>
      <div className="min-w-0">
        <CategoryTag slug={article.category} />
        <h3 className="mt-1 font-display text-lg font-bold leading-snug">
          <Link to="/noticia/$slug" params={{ slug: article.slug }} className="headline-link">
            {article.title}
          </Link>
        </h3>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{article.excerpt}</p>
        <p className="meta mt-2">
          {getColumnistName(article.authorSlug)} · {formatDate(article.publishedAt)}
        </p>
      </div>
    </article>
  );
}

/** Chamada apenas com texto, para colunas laterais. */
export function NewsTeaser({ article }: { article: Article }) {
  return (
    <article>
      <CategoryTag slug={article.category} />
      <h3 className="mt-1 font-display text-lg font-bold leading-snug">
        <Link to="/noticia/$slug" params={{ slug: article.slug }} className="headline-link">
          {article.title}
        </Link>
      </h3>
      <p className="mt-1 text-sm leading-snug text-muted-foreground">{article.excerpt}</p>
      <p className="meta mt-2">{timeAgo(article.publishedAt, EDITION_NOW)}</p>
    </article>
  );
}
