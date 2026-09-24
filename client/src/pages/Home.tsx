import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Bookmark, ChevronDown, Clock3, Eye, Menu, Search, UserRound, X } from "lucide-react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { EDITORIAL_CATEGORIES, NewsArticle, readStoredArticles } from "@/lib/news";
import "@/pch-redesign.css";

const LOGO_URL = "/brand/logo.svg?v=20260924";
const imageUrl = (article: NewsArticle) => article.sourceUrl ? `/legacy-image/${encodeURIComponent(article.sourceUrl)}` : article.image || LOGO_URL;
const categories = ["Todas", ...EDITORIAL_CATEGORIES];

function Meta({ article }: { article: NewsArticle }) {
  return (
    <div className="story-meta">
      <span>Por {article.author}</span>
      <span className="meta-dot">•</span>
      <span>{article.date}</span>
    </div>
  );
}

function slugify(value: string) {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export default function Home() {
  const [articles, setArticles] = useState<NewsArticle[]>(() => readStoredArticles());
  const { data: remoteEditorial } = trpc.editorial.bootstrap.useQuery(undefined, { retry: false });
  const [activeCategory, setActiveCategory] = useState("Todas");
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const remoteArticles = Array.isArray(remoteEditorial?.articles) ? remoteEditorial.articles : [];
    // Do not blank the public homepage while the production database is empty.
    // Once migrated articles exist, the database becomes the source of truth.
    if (remoteArticles.length === 0) return;
    const normalized: NewsArticle[] = remoteArticles.map((article: any) => ({ ...article, tags: typeof article.tags === "string" ? (() => { try { return JSON.parse(article.tags || "[]"); } catch { return []; } })() : article.tags || [], socialLinks: typeof article.socialLinks === "string" ? (() => { try { return JSON.parse(article.socialLinks || "{}"); } catch { return {}; } })() : article.socialLinks || {}, scheduledAt: article.scheduledAt ? new Date(Number(article.scheduledAt)).toISOString().slice(0, 16) : undefined }));
    setArticles(normalized);
  }, [remoteEditorial]);

  const published = useMemo(() => articles.filter((article) => {
    if (article.status !== "published") return false;
    if (!article.scheduledAt) return true;
    return new Date(article.scheduledAt).getTime() <= Date.now();
  }), [articles]);
  const visible = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return published.filter((article) => {
      const categoryMatches = activeCategory === "Todas" || (activeCategory === "Colunas" ? article.author !== "Redação PCH News" : article.category === activeCategory);
      const queryMatches = !normalized || `${article.title} ${article.category} ${article.author} ${(article.tags || []).join(" ")}`.toLowerCase().includes(normalized);
      return categoryMatches && queryMatches;
    });
  }, [activeCategory, published, query]);

  const mostRead = useMemo(() => [...published].sort((a, b) => b.views - a.views).slice(0, 5), [published]);
  const editorialOrder = (a: NewsArticle, b: NewsArticle) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)) || b.views - a.views;
  const carouselStories = visible.length ? [...visible].sort(editorialOrder).slice(0, 5) : [...mostRead].sort(editorialOrder);
  const safeSlide = carouselStories.length ? activeSlide % carouselStories.length : 0;
  const lead = carouselStories[safeSlide] || published[0];
  const sideStories = published.filter((article) => article.id !== lead?.id).sort((a, b) => b.views - a.views).slice(0, 3);

  const columnists = useMemo(() => {
    const map = new Map<string, NewsArticle>();
    published.filter((article) => article.author !== "Redação PCH News").forEach((article) => {
      const current = map.get(article.author);
      if (!current || article.views > current.views) map.set(article.author, article);
    });
    return Array.from(map.values()).sort((a, b) => b.views - a.views).slice(0, 6);
  }, [published]);

  useEffect(() => setActiveSlide(0), [activeCategory, query]);

  useEffect(() => {
    if (carouselStories.length < 2) return;
    const timer = window.setInterval(() => setActiveSlide((current) => (current + 1) % carouselStories.length), 6500);
    return () => window.clearInterval(timer);
  }, [carouselStories.length, activeCategory, query]);

  const goToSlide = (direction: number) => {
    if (!carouselStories.length) return;
    setActiveSlide((current) => (current + direction + carouselStories.length) % carouselStories.length);
  };

  const gridStories = [...visible].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime() || b.views - a.views).filter((article) => article.id !== lead?.id).slice(0, 6);

  return (
    <div className="site-shell">
      <div className="breaking-bar">
        <div className="container breaking-inner">
          <span className="breaking-label"><span className="breaking-dot" /> PCH NEWS · BRASIL</span>
          <div className="ticker-track"><span>Jornalismo para o Brasil</span><span>•</span><span>Informação, contexto e opinião</span><span>•</span><span>PCH News</span></div>
          <span className="breaking-date">{(() => { const p = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "America/Sao_Paulo" }).formatToParts(new Date()); const day = p.find((x) => x.type === "day")?.value ?? ""; const month = p.find((x) => x.type === "month")?.value ?? ""; const year = p.find((x) => x.type === "year")?.value ?? ""; const labels = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"]; return `${day} ${labels[Math.max(0, Math.min(11, Number(month) - 1))]} ${year}`; })()}</span>
        </div>
      </div>

      <header className="site-header">
        <div className="container header-main">
          <button className="icon-button mobile-only" aria-label="Abrir menu" onClick={() => setMenuOpen((open) => !open)}>{menuOpen ? <X size={20} /> : <Menu size={20} />}</button>
          <Link className="brand-lockup" href="/">
            <img className="official-logo" src={LOGO_URL} alt="PCH News" />
            <span className="brand-caption">Informação para<br /><strong>libertar a mente.</strong></span>
          </Link>
          <div className="header-motto">Jornalismo nacional, pensamento amplo <span>●</span></div>
          <div className="header-actions">
            <button className="icon-button" aria-label="Buscar" onClick={() => setSearchOpen((open) => !open)}><Search size={18} /></button>
            <Link className="profile-link" href="/perfil"><Bookmark size={15} /> Salvos</Link>
            <Link className="admin-link" href="/admin">Painel editorial <ArrowRight size={14} /></Link>
          </div>
        </div>
        <div className={`nav-wrap ${menuOpen ? "is-open" : ""}`}>
          <nav className="container primary-nav" aria-label="Navegação principal">
            {categories.map((category) => <button key={category} className={activeCategory === category ? "active" : ""} onClick={() => { setActiveCategory(category); setMenuOpen(false); }}>{category.toUpperCase()}</button>)}
            <button className="more-trigger">+ MAIS <ChevronDown size={14} /></button>
          </nav>
        </div>
        {searchOpen && <div className="search-row container"><Search size={17} /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar no PCH News..." aria-label="Buscar no PCH News" />{query && <button onClick={() => setQuery("")} aria-label="Limpar busca"><X size={16} /></button>}<span>{visible.length} resultados</span></div>}
      </header>

      <main>
        <section className="container ad-banner">
          <div className="ad-copy"><span className="eyebrow gold">PCH NEWS • MÍDIA ESTRATÉGICA</span><h1>Sua marca pode ser<br /><em>a próxima notícia.</em></h1><p>Apresente sua empresa, produto ou serviço para uma audiência que busca informação.</p><button className="gold-button">ANUNCIE NO PCH NEWS <ArrowRight size={16} /></button></div>
          <div className="ad-device"><div className="device-top"><span /><span /><span /></div><div className="device-content"><div className="device-logo">PCH<br /><small>NEWS</small></div><div className="device-lines"><i /><i /><i /><i /></div><div className="device-cards"><b /><b /><b /></div></div></div>
          <div className="ad-side">Sua marca não precisa interromper a notícia.<strong>Ela pode ser<br />a notícia.</strong><span>◉</span></div>
        </section>

        {lead ? (
          <section className="container lead-layout">
          <div className="lead-column">
            <div className="lead-carousel" aria-roledescription="carousel" aria-label="Notícias em destaque">
              <Link className="lead-story" href={`/materia/${lead.id}`} key={lead.id}>
                <img src={imageUrl(lead)} alt="" onError={(event) => { event.currentTarget.src = lead.image || LOGO_URL; }} />
                <div className="story-overlay">
                  <span className="category-tag">{lead.category}</span>
                  <span className="featured-kicker"><Eye size={12} /> {lead.views.toLocaleString("pt-BR")} visualizações</span>
                  <h2>{lead.title}</h2>
                  <p className="lead-summary">{lead.summary}</p>
                  <Meta article={lead} />
                </div>
              </Link>
              {carouselStories.length > 1 && <>
                <div className="carousel-controls">
                  <button type="button" aria-label="Notícia anterior" onClick={() => goToSlide(-1)}><ArrowLeft size={17} /></button>
                  <span>{String(safeSlide + 1).padStart(2, "0")} / {String(carouselStories.length).padStart(2, "0")}</span>
                  <button type="button" aria-label="Próxima notícia" onClick={() => goToSlide(1)}><ArrowRight size={17} /></button>
                </div>
                <div className="carousel-dots" aria-label="Selecionar notícia em destaque">{carouselStories.map((article, index) => <button key={article.id} type="button" aria-label={`Ir para notícia ${index + 1}: ${article.title}`} className={index === safeSlide ? "active" : ""} onClick={() => setActiveSlide(index)} />)}</div>
              </>}
            </div>
          </div>
          <aside className="recent-panel">
            <div className="section-heading"><div><span className="eyebrow">AGORA</span><h2>Mais lidas</h2></div><span className="heading-line" /></div>
            {sideStories.map((article, index) => <Link href={`/materia/${article.id}`} className="recent-item" key={article.id}><div className={`recent-thumb thumb-${index + 1}`} style={{ backgroundImage: `url(${imageUrl(article)})` }}><span>{String(index + 1).padStart(2, "0")}</span></div><div><span className="item-category">{article.category}</span><h3>{article.title}</h3><p><Eye size={12} /> {article.views.toLocaleString("pt-BR")} visualizações</p></div></Link>)}
          </aside>
        </section>
        ) : (
          <div className="container empty-state"><Search size={24} /><h3>Nada encontrado por aqui</h3><p>Tente outra busca ou escolha uma editoria no menu.</p><button onClick={() => { setQuery(""); setActiveCategory("Todas"); }}>Limpar filtros</button></div>
        )}

        <section className="quote-strip"><div className="container quote-inner"><span className="quote-mark">“</span><p>Conteúdo e interação com responsabilidade, ética e entretenimento.</p><span className="quote-sign">PCH <i>NEWS</i></span></div></section>

        {columnists.length > 0 && <section className="container columnist-showcase">
          <div className="section-heading large-heading"><div><span className="eyebrow">VOZES PCH NEWS · BRASIL</span><h2>Colunistas em destaque</h2></div><div className="heading-rule"><span>Autores e perspectivas</span></div></div>
          <div className="columnist-rail">
            {columnists.map((article) => <Link href={`/colunista/${slugify(article.author)}`} className="columnist-card" key={article.author}>
              <div className="columnist-card-image"><img src={imageUrl(article)} alt="" onError={(event) => { event.currentTarget.src = article.image || LOGO_URL; }} /><span><UserRound size={13} /> Colunista</span></div>
              <div className="columnist-card-copy"><strong>{article.author}</strong><small>{article.category} · {article.views.toLocaleString("pt-BR")} views na publicação em destaque</small><h3>{article.title}</h3></div>
            </Link>)}
          </div>
        </section>}

        <section className="container latest-section" id="ultimas">
          <div className="section-heading large-heading"><div><span className="eyebrow">CURADORIA PCH NEWS</span><h2>{activeCategory === "Todas" ? "Últimas notícias" : activeCategory}</h2></div><div className="heading-rule"><span>{visible.length} histórias</span></div></div>
          <div className="latest-grid">{gridStories.map((article) => <article className="news-card" key={article.id}><Link href={`/materia/${article.id}`}><div className="news-image"><img src={imageUrl(article)} alt="" onError={(event) => { event.currentTarget.src = article.image || LOGO_URL; }} /><span className="category-tag">{article.category}</span></div><div className="news-copy"><h3>{article.title}</h3><p>{article.summary}</p><div className="tag-row">{(article.tags || []).slice(0, 3).map((tag) => <span key={tag}>#{tag}</span>)}</div><Meta article={article} /><span className="read-more">Ler matéria <ArrowRight size={14} /></span></div></Link></article>)}</div>
        </section>

        <section className="container most-read-section">
          <div className="section-heading large-heading"><div><span className="eyebrow">AUDIÊNCIA</span><h2>Mais lidas</h2></div><div className="heading-rule"><span>Por visualizações</span></div></div>
          <div className="most-read-list">{mostRead.map((article, index) => <Link href={`/materia/${article.id}`} className="most-read-item" key={article.id}><span className="most-read-rank">{String(index + 1).padStart(2, "0")}</span><div><span className="item-category">{article.category}</span><h3>{article.title}</h3><Meta article={article} /></div><strong><Eye size={13} /> {article.views.toLocaleString("pt-BR")}</strong></Link>)}</div>
        </section>
      </main>

        <section className="container partners-section" id="parceiros">
          <div className="section-heading large-heading">
            <div><span className="eyebrow">REDE PCH NEWS</span><h2>Parceiros</h2></div>
            <div className="heading-rule"><span>Distribuição e conexão editorial</span></div>
          </div>
          <div className="partners-grid">
            <a className="partner-card" href="https://pchnews.hostingpress.com.br" target="_blank" rel="noreferrer">
              <span className="partner-mark">HP</span>
              <div><strong>HostingPRESS</strong><p>Portal de origem e infraestrutura parceira do PCH News.</p></div>
              <ArrowRight size={18} />
            </a>
            <div className="partner-card partner-card-next">
              <span className="partner-mark">+</span>
              <div><strong>Novos parceiros</strong><p>Este espaço já está preparado para receber os próximos portais parceiros.</p></div>
            </div>
          </div>
        </section>

      <footer className="site-footer">
        <div className="container footer-inner">
          <div className="footer-brand-block">
            <img className="footer-logo" src={LOGO_URL} alt="PCH News" />
            <div><strong>PCH News</strong><p>Jornalismo nacional, pensamento amplo.</p><small>Notícias, colunas e perspectivas para libertar a mente.</small></div>
          </div>
          <div className="footer-column"><span>EDITORIAS</span><Link href="/">Brasil</Link><Link href="/">Política</Link><Link href="/">Economia</Link><Link href="/">Cultura</Link><Link href="/">Mundo</Link></div>
          <div className="footer-column"><span>PCH NEWS</span><Link href="/#ultimas">Últimas notícias</Link><Link href="/#parceiros">Parceiros</Link><Link href="/colunista/evaldo-poeta">Coluna do Evaldo</Link><Link href="/admin">Painel editorial</Link><Link href="/">Anuncie</Link></div>
          <div className="footer-column"><span>INSTITUCIONAL</span><Link href="/">Expediente</Link><Link href="/">Política editorial</Link><Link href="/">Privacidade</Link><Link href="/">Contato</Link></div>
          <div className="footer-signature">
            <span>INFORMAÇÃO PARA</span><strong>LIBERTAR A MENTE.</strong>
            <div className="footer-socials"><a href="https://www.instagram.com/" target="_blank" rel="noreferrer">Instagram</a><a href="https://www.facebook.com/" target="_blank" rel="noreferrer">Facebook</a><a href="https://www.youtube.com/" target="_blank" rel="noreferrer">YouTube</a></div>
            <small>© 2026 PCH News · Responsabilidade editorial PCH News</small>
          </div>
        </div>
        <div className="container footer-bottom"><span>PCH News · Brasil e mundo</span><span>Conteúdo editorial, colunas e distribuição digital.</span></div>
      </footer>
    </div>
  );
}
