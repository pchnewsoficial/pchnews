import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { articles, columnists, categories, EDITION_NOW } from "@/data/content";
import { formatDate, timeAgo } from "@/lib/format";
import { SiteShell } from "@/components/site/SiteShell";
import { NewsCarousel } from "@/components/news/NewsCarousel";
import { NewsCard } from "@/components/news/NewsCard";
import { ColumnistCard } from "@/components/news/ColumnistCard";
import { SectionHeading } from "@/components/news/SectionHeading";
export const Route=createFileRoute("/")({component:Home});
function Home(){
 const published=articles.filter(a=>a.status==="publicado");
 const headline=published.find(a=>a.isHeadline)||published[0];
 const latest=published.filter(a=>a.slug!==headline.slug).slice(0,6);
 const carousel=published.filter(a=>a.inCarousel);
 return <SiteShell><div className="mx-auto max-w-6xl px-4 py-7 sm:py-10">
  <section className="rule-strong pb-7"><div className="grid gap-7 lg:grid-cols-[1.55fr_.75fr]"><article><Link to="/noticia/$slug" params={{slug:headline.slug}} className="group block"><div className="overflow-hidden rounded-sm bg-muted"><img src={headline.image} alt="" width={1600} height={900} className="aspect-[16/9] w-full object-cover transition-transform duration-500 group-hover:scale-[1.015]"/></div><p className="kicker mt-4">{categories.find(c=>c.slug===headline.category)?.name}</p><h1 className="mt-2 font-display text-4xl font-black leading-[1.02] tracking-tight sm:text-5xl lg:text-6xl">{headline.title}</h1><p className="mt-3 max-w-3xl text-base leading-7 text-muted-foreground sm:text-lg">{headline.subtitle}</p><p className="meta mt-4">{headline.authorSlug} · {formatDate(headline.publishedAt)} · {headline.readingMinutes} min de leitura</p></Link></article>
  <aside className="grid content-start gap-5">{published.slice(1,4).map(a=><article key={a.slug} className="border-b border-border pb-5 last:border-0"><p className="kicker">{categories.find(c=>c.slug===a.category)?.name}</p><h2 className="mt-1 font-display text-xl font-bold leading-tight"><Link to="/noticia/$slug" params={{slug:a.slug}} className="headline-link">{a.title}</Link></h2><p className="mt-1 text-sm leading-6 text-muted-foreground">{a.excerpt}</p><p className="meta mt-2">{timeAgo(a.publishedAt,EDITION_NOW)}</p></article>)}</aside></div></section>
  <section className="py-8"><NewsCarousel articles={carousel}/></section>
  <section className="py-5"><SectionHeading title="Últimas notícias" linkText="Ver todas" linkTo="/categoria/politica"/><div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{latest.map(a=><NewsCard key={a.slug} article={a}/>)}</div></section>
  <section className="mt-12 border-t border-border pt-8"><SectionHeading title="Editorias"/><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{categories.map(c=><Link key={c.slug} to="/categoria/$slug" params={{slug:c.slug}} className="group rounded-sm border bg-card p-5 hover:shadow-card"><span className="kicker">{c.name}</span><p className="mt-2 text-sm leading-6 text-muted-foreground">{c.description}</p><span className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-primary">Entrar na editoria <ArrowRight size={13}/></span></Link>)}</div></section>
  <section className="mt-12 border-t border-border pt-8"><SectionHeading title="Colunistas" linkText="Ver todos" linkTo="/colunistas"/><div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">{columnists.map(c=><ColumnistCard key={c.slug} columnist={c} tone="light"/>)}</div></section>
  <section className="mt-12 bg-ink px-6 py-8 text-ink-foreground sm:px-9"><p className="kicker">Tolerajornal</p><h2 className="mt-2 max-w-3xl font-display text-3xl font-bold">Informar para que o leitor possa pensar por si mesmo.</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-ink-foreground/65">Notícia, análise e opinião precisam estar identificadas. O newsroom do PCH usa regras explícitas e auditáveis para revisar o material antes da publicação.</p></section>
 </div></SiteShell>
}