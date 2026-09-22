import { Link } from "@tanstack/react-router";

import { Brand } from "@/components/site/Brand";
import { categories, columnists } from "@/data/content";

export function SiteFooter() {
  return (
    <footer className="mt-16 bg-ink text-ink-foreground/70">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <Brand />
          <p className="mt-4 max-w-[34ch] text-sm leading-relaxed">
            Jornalismo independente em português do Brasil. Apuração própria em política, economia,
            tecnologia, cultura e esporte, com opinião assinada e separada da notícia.
          </p>
        </div>

        <nav aria-label="Editorias no rodapé">
          <h2 className="kicker">Editorias</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {categories.map((category) => (
              <li key={category.slug}>
                <Link
                  to="/categoria/$slug"
                  params={{ slug: category.slug }}
                  className="transition-colors hover:text-ink-foreground"
                >
                  {category.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Colunistas no rodapé">
          <h2 className="kicker">Colunistas</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {columnists.map((columnist) => (
              <li key={columnist.slug}>
                <Link
                  to="/colunistas/$slug"
                  params={{ slug: columnist.slug }}
                  className="transition-colors hover:text-ink-foreground"
                >
                  {columnist.name}
                </Link>
              </li>
            ))}
            <li>
              <Link to="/colunistas" className="transition-colors hover:text-ink-foreground">
                Ver todos
              </Link>
            </li>
          </ul>
        </nav>

        <div>
          <h2 className="kicker">Institucional</h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link to="/categorias" className="transition-colors hover:text-ink-foreground">
                Todas as editorias
              </Link>
            </li>
            <li>
              <Link to="/login" className="transition-colors hover:text-ink-foreground">
                Acesso da redação
              </Link>
            </li>
            <li>
              <a
                href="mailto:redacao@pchnews.com.br"
                className="transition-colors hover:text-ink-foreground"
              >
                redacao@pchnews.com.br
              </a>
            </li>
          </ul>
          <p className="mt-4 text-xs leading-relaxed text-ink-foreground/50">
            Correções e réplicas são publicadas na própria matéria, com registro de data e hora.
          </p>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-2 px-4 py-4 font-mono text-[11px] text-ink-foreground/45 sm:flex-row sm:items-center">
          <span>© 2026 PCH News · Todos os direitos reservados</span>
          <span>Notícias para libertar a mente</span>
        </div>
      </div>
    </footer>
  );
}
