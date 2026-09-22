import { Link } from "@tanstack/react-router";
import { Menu, UserRound, X } from "lucide-react";
import { useState } from "react";

import { Brand } from "@/components/site/Brand";
import { Button } from "@/components/ui/button";
import { categories, EDITION_NOW, EDITION_NUMBER } from "@/data/content";
import { formatLongDate } from "@/lib/format";

const navLinkClass =
  "shrink-0 py-3 text-[13px] font-semibold text-ink-foreground/70 transition-colors hover:text-ink-foreground";
const activeNavClass = "text-primary";

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="bg-ink text-ink-foreground">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-1.5">
        <p className="truncate font-mono text-[11px] tracking-wide text-ink-foreground/55">
          {formatLongDate(EDITION_NOW)}
        </p>
        <p className="shrink-0 font-mono text-[11px] tracking-wide text-ink-foreground/55">
          Edição nº {EDITION_NUMBER}
        </p>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 py-3">
          <Brand />
          <div className="flex shrink-0 items-center gap-2">
            <Link to="/login" className="hidden sm:block">
              <Button variant="onDark" size="sm">
                <UserRound aria-hidden="true" size={14} /> Entrar
              </Button>
            </Link>
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-expanded={menuOpen}
              aria-controls="menu-mobile"
              aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
              className="grid size-9 place-items-center rounded-sm border border-white/25 lg:hidden"
            >
              {menuOpen ? <X size={16} aria-hidden="true" /> : <Menu size={16} aria-hidden="true" />}
            </button>
          </div>
        </div>
      </div>

      <nav aria-label="Editorias" className="hidden border-t border-white/10 lg:block">
        <div className="mx-auto flex max-w-6xl items-center gap-6 px-4">
          <Link to="/" activeOptions={{ exact: true }} className={navLinkClass} activeProps={{ className: activeNavClass }}>
            Início
          </Link>
          {categories.map((category) => (
            <Link
              key={category.slug}
              to="/categoria/$slug"
              params={{ slug: category.slug }}
              className={navLinkClass}
              activeProps={{ className: activeNavClass }}
            >
              {category.name}
            </Link>
          ))}
          <Link to="/colunistas" className={navLinkClass} activeProps={{ className: activeNavClass }}>
            Colunistas
          </Link>
        </div>
      </nav>

      {menuOpen ? (
        <nav
          id="menu-mobile"
          aria-label="Menu principal"
          className="border-t border-white/10 lg:hidden"
        >
          <ul className="mx-auto max-w-6xl divide-y divide-white/10 px-4">
            <li>
              <Link
                to="/"
                onClick={() => setMenuOpen(false)}
                className="block py-3 text-sm font-semibold text-ink-foreground/80"
              >
                Início
              </Link>
            </li>
            {categories.map((category) => (
              <li key={category.slug}>
                <Link
                  to="/categoria/$slug"
                  params={{ slug: category.slug }}
                  onClick={() => setMenuOpen(false)}
                  className="block py-3 text-sm font-semibold text-ink-foreground/80"
                >
                  {category.name}
                </Link>
              </li>
            ))}
            <li>
              <Link
                to="/colunistas"
                onClick={() => setMenuOpen(false)}
                className="block py-3 text-sm font-semibold text-ink-foreground/80"
              >
                Colunistas
              </Link>
            </li>
            <li>
              <Link
                to="/login"
                onClick={() => setMenuOpen(false)}
                className="block py-3 text-sm font-semibold text-primary"
              >
                Entrar na redação
              </Link>
            </li>
          </ul>
        </nav>
      ) : null}
    </header>
  );
}
