import { useEffect, useMemo, useState } from "react";
import officialLogoUrl from "@/assets/pch-news-official-current.svg";
import { ArrowLeft, ArrowRight, Bookmark, CalendarDays, ChevronDown, Clock3, Eye, MapPin, Menu, Search, Thermometer, UserRound, X } from "lucide-react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { EDITORIAL_CATEGORIES, EDITORIAL_SUBTHEMES, NewsArticle } from "@/lib/news";
import "@/pch-redesign.css";
import PublicFooter from "@/components/PublicFooter";
import { editorialImageUrl } from "@/lib/editorialImage";

const LOGO_URL = officialLogoUrl;
const LOGO_FALLBACK_URL = officialLogoUrl;
const imageUrl = (article: NewsArticle) => {
  if (article.image) return article.image;
  if (article.sourceUrl?.startsWith("https://pchnews.hostingpress.com.br/materia/")) {
    return `https://pch-news.pchnews-oficial.workers.dev/legacy-image/${encodeURIComponent(article.sourceUrl)}`;
  }
  return LOGO_URL;
};
const categories = ["Todas", "Brasil", "Regiões", "Política", "Economia", "Internacional"];
const moreCategories = EDITORIAL_CATEGORIES.filter((category) => !categories.includes(category));

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
  // Supabase is the only source of editorial content. Do not seed or read articles from browser storage.
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const { data: remoteEditorial, isLoading: editorialLoading, error: editorialError, refetch: refetchEditorial } = trpc.editorial.bootstrap.useQuery(undefined, { retry: 2, retryDelay: 1200, staleTime: 15_000 });
  const [activeCategory, setActiveCategory] = useState("Todas");
  const [activeTopic, setActiveTopic] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeSlide, setActiveSlide] = useState(0);
  const [activeAdSlide, setActiveAdSlide] = useState(0);
  const [adPaused, setAdPaused] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const [coordinates, setCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);

  const headerWeather = trpc.apiHub.weather.useQuery(
    { latitude: coordinates?.latitude ?? 0, longitude: coordinates?.longitude ?? 0 },
    { enabled: Boolean(coordinates), retry: false, refetchInterval: 15 * 60 * 1000, staleTime: 10 * 60 * 1000 },
  );

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => setCoordinates({ latitude: coords.latitude, longitude: coords.longitude }),
      () => setCoordinates(null),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 15 * 60 * 1000 },
    );
  }, []);

  useEffect(() => {
    const remoteArticles = Array.isArray(remoteEditorial?.articles) ? remoteEditorial.articles : [];
    // Do not blank the public homepage while the production database is empty.
    // Once migrated articles exist, the database becomes the source of truth.
    if (remoteArticles.length === 0) return;
    const normalized: NewsArticle[] = remoteArticles.map((article: any) => ({ ...article, tags: typeof article.tags === "string" ? (() => { try { return JSON.parse(article.tags || "[]"); } catch { return []; } })() : article.tags || [], socialLinks: typeof article.socialLinks === "string" ? (() => { try { return JSON.parse(article.socialLinks || "{}"); } catch { return {}; } })() : article.socialLinks || {}, scheduledAt: article.scheduledAt ? new Date(Number(article.scheduledAt)).toISOString().slice(0, 16) : undefined }));
    setArticles(normalized);
  }, [remoteEditorial]);

  const eventCarousel = trpc.events.carousel.useQuery({ limit: 6 }, { retry: false, staleTime: 60 * 1000 });
  const weatherTemperature = (headerWeather.data as { current?: { temperature_2m?: number } } | undefined)?.current?.temperature_2m;

  const published = useMemo(() => articles.filter((article) => {
    if (!["published", "updated"].includes(article.status)) return false;
    if (!article.scheduledAt) return true;
    return new Date(article.scheduledAt).getTime() <= Date.now();
  }), [articles]);
  const visible = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return published.filter((article) => {
      const topicMatches = !activeTopic || (article.tags || []).some((tag) => tag.trim().toLowerCase() === activeTopic.toLowerCase());
      const categoryMatches = activeTopic
        ? topicMatches
        : activeCategory === "Todas"
          || (activeCategory === "Colunas" ? article.author !== "Redação PCH News" : article.category === activeCategory)
          || (activeCategory === "Regiões" && article.scope === "regional")
          || (activeCategory === "Internacional" && article.scope === "international");
      const queryMatches = !normalized || `${article.title} ${article.category} ${article.author} ${(article.tags || []).join(" ")}`.toLowerCase().includes(normalized);
      return categoryMatches && queryMatches;
    });
  }, [activeCategory, activeTopic, published, query]);

  const editorialOrder = (a: NewsArticle, b: NewsArticle) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)) || b.views - a.views;
  const fallbackMostRead = useMemo(() => [...published].sort((a, b) => b.views - a.views), [published]);
  const carouselStories = visible.length ? [...visible].sort(editorialOrder).slice(0, 5) : [...fallbackMostRead].sort(editorialOrder).slice(0, 5);
  const safeSlide = carouselStories.length ? activeSlide % carouselStories.length : 0;
  const lead = carouselStories[safeSlide] || published[0];

  // Each homepage story is assigned to one editorial rail only, avoiding the same
  // headline being repeated in Destaque, Mais lidas, Últimas and category blocks.
  const leadId = lead?.id;
  const sideStories = useMemo(
    () => published.filter((article) => article.id !== leadId).sort((a, b) => b.views - a.views).slice(0, 3),
    [published, leadId],
  );
  const sideIds = useMemo(() => new Set(sideStories.map((article) => article.id)), [sideStories]);

  const gridStories = useMemo(
    () => [...visible]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime() || b.views - a.views)
      .filter((article) => article.id !== leadId && !sideIds.has(article.id))
      .slice(0, 6),
    [visible, leadId, sideIds],
  );
  const gridIds = useMemo(() => new Set(gridStories.map((article) => article.id)), [gridStories]);

  const pilulas = useMemo(
    () => published
      .filter((article) => (article.tags || []).some((tag) => tag.toLowerCase().includes("pílula do poeta")) || article.author.toLowerCase().includes("evaldo poeta"))
      .filter((article) => article.id !== leadId && !sideIds.has(article.id) && !gridIds.has(article.id))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 6),
    [published, leadId, sideIds, gridIds],
  );
  const pilulaIds = useMemo(() => new Set(pilulas.map((article) => article.id)), [pilulas]);

  const mostRead = useMemo(
    () => [...published]
      .filter((article) => article.id !== leadId && !sideIds.has(article.id) && !gridIds.has(article.id) && !pilulaIds.has(article.id))
      .sort((a, b) => b.views - a.views)
      .slice(0, 5),
    [published, leadId, sideIds, gridIds, pilulaIds],
  );
  const mostReadIds = useMemo(() => new Set(mostRead.map((article) => article.id)), [mostRead]);

  const usedEditorialIds = useMemo(
    () => new Set([leadId, ...sideStories.map((article) => article.id), ...gridStories.map((article) => article.id), ...pilulas.map((article) => article.id), ...mostRead.map((article) => article.id)].filter(Boolean) as string[]),
    [leadId, sideStories, gridStories, pilulas, mostRead],
  );

  const categorySections = useMemo(
    () => EDITORIAL_CATEGORIES.map((category) => ({
      category,
      stories: published
        .filter((article) => article.category === category && !usedEditorialIds.has(article.id))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime() || b.views - a.views)
        .slice(0, 4),
    })).filter((section) => section.stories.length > 0).slice(0, 6),
    [published, usedEditorialIds],
  );

  const columnists = useMemo(() => {
    const profiles = Array.isArray(remoteEditorial?.profiles) ? remoteEditorial.profiles as any[] : [];
    return profiles
      .filter((profile) => profile?.slug === "evaldo-poeta" || profile?.name === "Evaldo Poeta")
      .map((profile) => {
        const stories = published.filter((article) => article.author === profile.name);
        const featured = [...stories].sort((a, b) => b.views - a.views)[0];
        return { profile, featured, publicationCount: stories.length };
      })
       .filter((item) => item.profile?.name)
      .sort((a, b) => (Number(Boolean(b.featured)) - Number(Boolean(a.featured))) || ((b.featured?.views || 0) - (a.featured?.views || 0)))
      .slice(0, 2);
  }, [published, remoteEditorial?.profiles]);

  useEffect(() => setActiveSlide(0), [activeCategory, activeTopic, query]);

  const adSlides = [
    { eyebrow: "PCH NEWS • MÍDIA ESTRATÉGICA", title: "Sua marca pode ser", emphasis: "a próxima notícia.", text: "Apresente sua empresa, produto ou serviço para uma audiência que busca informação.", cta: "ANUNCIE NO PCH NEWS" },
    { eyebrow: "PUBLICIDADE", title: "Sua campanha no", emphasis: "lugar certo.", text: "Home, editorias, patrocínios e projetos especiais com identificação clara.", cta: "CONHEÇA OS FORMATOS" },
    { eyebrow: "REDE PCH NEWS", title: "Conecte sua marca ao", emphasis: "jornalismo digital.", text: "Planeje presença por período e, futuramente, por região, cidade e dispositivo.", cta: "FALE COM O PCH NEWS" },
  ];

  useEffect(() => {
    if (adPaused) return;
    const timer = window.setInterval(() => setActiveAdSlide((current) => (current + 1) % adSlides.length), 6000);
    return () => window.clearInterval(timer);
  }, [adSlides.length, adPaused]);

  useEffect(() => {
    if (carouselStories.length < 2) return;
    const timer = window.setInterval(() => setActiveSlide((current) => (current + 1) % carouselStories.length), 6500);
    return () => window.clearInterval(timer);
  }, [carouselStories.length, activeCategory, activeTopic, query]);

  const goToSlide = (direction: number) => {
    if (!carouselStories.length) return;
    setActiveSlide((current) => (current + direction + carouselStories.length) % carouselStories.length);
  };


  const publicContentError = editorialError && articles.length === 0 ? (
    <main className="article-placeholder" role="alert">
      <span className="admin-kicker">PCH NEWS</span>
      <h1>Não foi possível carregar as notícias agora.</h1>
      <p>{editorialError.message || "A conexão com a redação está temporariamente indisponível."}</p>
      <button className="primary-cta" onClick={() => void refetchEditorial()} disabled={editorialLoading}>
        {editorialLoading ? "Tentando novamente…" : "Tentar novamente"}
      </button>
    </main>
  ) : null;

  return (
    <div className="site-shell">
      {publicContentError}
      <div className="breaking-bar">
        <div className="container breaking-inner">
          <span className="breaking-label"><span className="breaking-dot" /> URGENTE</span>
          <div className="ticker-track"><span>PCH NEWS</span><span>•</span><span>Informação, contexto e opinião</span><span>•</span><span>Jornalismo nacional</span></div>
          <span className="breaking-date">{(() => { const p = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "America/Sao_Paulo" }).formatToParts(new Date()); const day = p.find((x) => x.type === "day")?.value ?? ""; const month = p.find((x) => x.type === "month")?.value ?? ""; const year = p.find((x) => x.type === "year")?.value ?? ""; const labels = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"]; return `${day} ${labels[Math.max(0, Math.min(11, Number(month) - 1))]} ${year}`; })()}</span>
        </div>
      </div>

      <header className="site-header">
        <div className="container header-main">
          <button className="icon-button mobile-only" aria-label="Abrir menu" onClick={() => setMenuOpen((open) => !open)}>{menuOpen ? <X size={20} /> : <Menu size={20} />}</button>
          <Link className="brand-lockup" href="/">
            <img className="official-logo" src={LOGO_URL} alt="PCH News" onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = LOGO_FALLBACK_URL; }} />
            <span className="brand-wordmark" aria-hidden="true"><strong>PCH</strong> NEWS</span>
            <span className="brand-caption">Informação para<br /><strong>libertar a mente.</strong></span>
          </Link>
          <div className="header-motto">Jornalismo nacional, pensamento amplo <span>●</span></div>
          <div className="header-live-info" aria-label="Informações locais">
            <div className="header-live-item">
              <Clock3 size={15} aria-hidden="true" />
              <span>{new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(now)}</span>
            </div>
            <div className="header-live-item" title={coordinates ? "Clima da sua localização" : "Autorize a localização para consultar o clima"}>
              {coordinates ? <Thermometer size={15} aria-hidden="true" /> : <MapPin size={15} aria-hidden="true" />}
              <span>{weatherTemperature != null ? `${Math.round(Number(weatherTemperature))}°C` : coordinates ? "Clima..." : "Localização"}</span>
            </div>
          </div>
          <div className="header-actions">
            <button className="icon-button" aria-label="Buscar" onClick={() => setSearchOpen((open) => !open)}><Search size={18} /></button>
            <Link className="profile-link" href="/"><Bookmark size={15} /> Salvos</Link>
            <a className="admin-link" href="/admin">Painel editorial <ArrowRight size={14} /></a>
          </div>
        </div>
        <div className={`nav-wrap ${menuOpen ? "is-open" : ""}`}>
          <nav className="container primary-nav" aria-label="Navegação principal">
            {categories.map((category) => <button key={category} className={activeCategory === category && !activeTopic ? "active" : ""} onClick={() => { setActiveCategory(category); setActiveTopic(null); setMenuOpen(false); setMoreOpen(false); }}>{category.toUpperCase()}</button>)}
            <button className={`more-trigger ${moreOpen ? "active" : ""}`} type="button" aria-expanded={moreOpen} aria-haspopup="menu" onClick={() => setMoreOpen((open) => !open)}>+ MAIS <ChevronDown size={14} /></button>

          </nav>
          {moreOpen && <div className="more-menu" role="menu">
              <div className="more-menu-section"><span className="more-menu-label">EDITORIAS</span><div className="more-menu-grid">
                {moreCategories.map((category) => <button key={category} type="button" role="menuitem" className={activeCategory === category && !activeTopic ? "is-selected" : ""} onClick={() => { setActiveCategory(category); setActiveTopic(null); setMoreOpen(false); setMenuOpen(false); }}>{category}</button>)}
              </div></div>
              <div className="more-menu-section"><span className="more-menu-label">TEMAS ESPECÍFICOS</span><div className="more-menu-grid">
                {EDITORIAL_SUBTHEMES.map((topic) => <button key={topic.label} type="button" role="menuitem" className={activeTopic === topic.label ? "is-selected" : ""} onClick={() => { setActiveTopic(topic.label); setActiveCategory(topic.parent); setMoreOpen(false); setMenuOpen(false); }}>{topic.label}</button>)}
              </div></div>
            </div>}
        </div>
        {searchOpen && <div className="search-row container"><Search size={17} /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar no PCH News..." aria-label="Buscar no PCH News" />{query && <button onClick={() => setQuery("")} aria-label="Limpar busca"><X size={16} /></button>}<span>{visible.length} resultados</span></div>}
      </header>

      <main>
        {(eventCarousel.data || []).length > 0 && <section className="container events-promo-home" aria-label="Eventos em destaque">
          <div className="section-heading large-heading"><div><span className="eyebrow">AGENDA PCH NEWS</span><h2>Eventos próximos</h2></div><Link href="/eventos" className="read-more">Ver agenda <ArrowRight size={14}/></Link></div>
          <div className="events-promo-rail">
            {(eventCarousel.data || []).map((event:any) => <Link key={event.id} href={`/eventos/${event.id}`} className="events-promo-card">
              <div className="events-promo-date"><CalendarDays size={15}/><strong>{new Intl.DateTimeFormat("pt-BR",{day:"2-digit",month:"short"}).format(new Date(Number(event.startAtMs)))}</strong><span>{new Intl.DateTimeFormat("pt-BR",{hour:"2-digit",minute:"2-digit"}).format(new Date(Number(event.startAtMs)))}</span></div>
              <div><span className="item-category">{event.eventType}</span><h3>{event.title}</h3><p><MapPin size={12}/> {event.city}/{event.state}</p></div>
              {event.sponsored && <span className="event-sponsored-label">PATROCINADO</span>}
            </Link>)}
          </div>
        </section>}

        {lead ? (
          <section className="container lead-layout">
          <div className="lead-column">
            <div className="lead-carousel" aria-roledescription="carousel" aria-label="Notícias em destaque">
              <Link className="lead-story" href={`/materia/${lead.id}`} key={lead.id}>
                <img src={imageUrl(lead)} alt={lead.title} onError={(event) => { event.currentTarget.src = lead.image || LOGO_URL; }} />
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
            <div className="side-ad-slot" aria-label="Publicidade">
              <span className="ad-tag">PUBLICIDADE</span>
              <strong>Sua marca em destaque</strong>
              <p>Espaço lateral reservado para campanhas, parceiros e divulgação.</p>
              <a href="#anuncie">Conheça os formatos <ArrowRight size={14} /></a>
            </div>
            <div className="section-heading"><div><span className="eyebrow">AGORA</span><h2>Mais lidas</h2></div><span className="heading-line" /></div>
            {sideStories.map((article, index) => <Link href={`/materia/${article.id}`} className="recent-item" key={article.id}><div className={`recent-thumb thumb-${index + 1}`} style={{ backgroundImage: `url(${imageUrl(article)})` }}><span>{String(index + 1).padStart(2, "0")}</span></div><div><span className="item-category">{article.category}</span><h3>{article.title}</h3><p><Eye size={12} /> {article.views.toLocaleString("pt-BR")} visualizações</p></div></Link>)}
          </aside>
        </section>
        ) : (


          <div className="container empty-state"><Search size={24} /><h3>Nada encontrado por aqui</h3><p>Tente outra busca ou escolha uma editoria no menu.</p><button onClick={() => { setQuery(""); setActiveCategory("Todas"); setActiveTopic(null); }}>Limpar filtros</button></div>
        )}

        <section className="container ad-banner ad-carousel" id="anuncie" aria-roledescription="carousel" aria-label="Publicidade PCH News" onMouseEnter={() => setAdPaused(true)} onMouseLeave={() => setAdPaused(false)} onFocusCapture={() => setAdPaused(true)} onBlurCapture={() => setAdPaused(false)}>
          <div className="ad-carousel-track" style={{ transform: `translateX(-${activeAdSlide * 100}%)` }}>
            {adSlides.map((slide) => <div className="ad-slide" key={slide.title}>
              <div className="ad-copy"><span className="ad-tag">{slide.eyebrow}</span><h1>{slide.title}<br /><em>{slide.emphasis}</em></h1><p>{slide.text}</p><Link className="gold-button" href="/anuncie">{slide.cta} <ArrowRight size={16} /></Link></div>
              <div className="ad-device"><div className="device-top"><span /><span /><span /></div><div className="device-content"><div className="device-logo">PCH<br /><small>NEWS</small></div><div className="device-lines"><i /><i /><i /><i /></div><div className="device-cards"><b /><b /><b /></div></div></div>
              <div className="ad-side"><span>PUBLICIDADE</span><strong>{String(activeAdSlide + 1).padStart(2, "0")} / {String(adSlides.length).padStart(2, "0")}</strong><small>Peça comercial identificada.</small></div>
            </div>)}
          </div>
          <div className="ad-carousel-controls"><button type="button" aria-label="Publicidade anterior" onClick={() => setActiveAdSlide((current) => (current - 1 + adSlides.length) % adSlides.length)}><ArrowLeft size={16} /></button><div className="ad-carousel-dots">{adSlides.map((slide, index) => <button type="button" key={slide.title} aria-label={`Ir para peça ${index + 1}`} className={index === activeAdSlide ? "active" : ""} onClick={() => setActiveAdSlide(index)} />)}</div><button type="button" aria-label="Próxima publicidade" onClick={() => setActiveAdSlide((current) => (current + 1) % adSlides.length)}><ArrowRight size={16} /></button></div>
          <div className="ad-progress" aria-hidden="true"><span key={activeAdSlide} /></div>
        </section>


        <section className="quote-strip"><div className="container quote-inner"><span className="quote-mark">“</span><p>Conteúdo e interação com responsabilidade, ética e entretenimento.</p><span className="quote-sign">PCH <i>NEWS</i></span></div></section>

        {pilulas.length > 0 && <section className="container pilulas-showcase">
          <div className="section-heading large-heading"><div><span className="eyebrow">COLUNAS · EVALDO POETA</span><h2>Pílulas do Poeta</h2></div><div className="heading-rule"><span>Últimas publicações</span></div></div>
          <div className="pilulas-rail">{pilulas.map((article) => <Link href={`/materia/${article.id}`} className="pilula-card" key={article.id}><span className="pilula-card-kicker">PÍLULA DO POETA</span><h3>{article.title}</h3><p>{article.summary || "Uma palavra para pensar, refletir e transformar escolhas."}</p><Meta article={article} /><span className="read-more">Ler pílula <ArrowRight size={14} /></span></Link>)}</div>
        </section>}

        {columnists.length >= 2 && <section className="container columnist-showcase" id="colunistas">
          <div className="section-heading large-heading"><div><span className="eyebrow">VOZES PCH NEWS · BRASIL</span><h2>Colunistas em destaque</h2></div><div className="heading-rule"><span>Perfis, publicações e perspectivas</span></div></div>
          <div className="columnist-rail">
            {columnists.map(({ profile, featured, publicationCount }) => <Link href={`/colunista/${profile.slug}`} className="columnist-card" key={profile.slug}>
              <div className="columnist-card-image"><img src={profile.photo || LOGO_URL} alt={profile.name} onError={(event) => { event.currentTarget.src = LOGO_URL; }} /><span><UserRound size={13} /> Colunista</span></div>
              <div className="columnist-card-copy"><strong>{profile.name}</strong><small>{profile.beat} · {publicationCount} {publicationCount === 1 ? "publicação" : "publicações"}</small><p>{profile.bio}</p>{featured ? <><h3>{featured.title}</h3><span className="read-more">Ler coluna <ArrowRight size={14} /></span></> : <span className="read-more">Ver perfil <ArrowRight size={14} /></span>}</div>
            </Link>)}
          </div>
        </section>}

        <section className="container latest-section" id="ultimas">
          <div className="section-heading large-heading"><div><span className="eyebrow">CURADORIA PCH NEWS</span><h2>{activeCategory === "Todas" ? "Últimas notícias" : activeCategory}</h2></div><div className="heading-rule"><span>{visible.length} histórias</span></div></div>
          <div className="latest-grid">{gridStories.map((article) => <article className="news-card" key={article.id}><Link href={`/materia/${article.id}`}><div className="news-image"><img src={imageUrl(article)} alt={article.title} onError={(event) => { event.currentTarget.src = article.image || LOGO_URL; }} /><span className="category-tag">{article.category}</span></div><div className="news-copy"><h3>{article.title}</h3><p>{article.summary}</p><div className="tag-row">{(article.tags || []).slice(0, 3).map((tag) => <span key={tag}>#{tag}</span>)}</div><Meta article={article} /><span className="read-more">Ler matéria <ArrowRight size={14} /></span></div></Link></article>)}</div>
        </section>

        <section className="container most-read-section">
          <div className="section-heading large-heading"><div><span className="eyebrow">AUDIÊNCIA</span><h2>Mais lidas</h2></div><div className="heading-rule"><span>Por visualizações</span></div></div>
          <div className="most-read-list">{mostRead.map((article, index) => <Link href={`/materia/${article.id}`} className="most-read-item" key={article.id}><span className="most-read-rank">{String(index + 1).padStart(2, "0")}</span><div><span className="item-category">{article.category}</span><h3>{article.title}</h3><Meta article={article} /></div><strong><Eye size={13} /> {article.views.toLocaleString("pt-BR")}</strong></Link>)}</div>
        </section>

        {categorySections.length > 0 && <section className="container editorial-sections">
          <div className="section-heading large-heading"><div><span className="eyebrow">EDITORIAS PCH NEWS</span><h2>Notícias por tema</h2></div><div className="heading-rule"><span>Curadoria editorial</span></div></div>
          <div className="editorial-section-list">
            {categorySections.map(({ category, stories }) => <section className="editorial-category-block" key={category}>
              <div className="editorial-category-heading"><h3>{category}</h3><button onClick={() => setActiveCategory(category)}>Ver tudo <ArrowRight size={14} /></button></div>
              <div className="editorial-category-grid">
                {stories.map((article) => <Link href={`/materia/${article.id}`} className="editorial-category-card" key={article.id}>
                  <div className="editorial-category-image"><img src={imageUrl(article)} alt={article.title} onError={(event) => { event.currentTarget.src = article.image || "/brand/pch-news-official-current.svg?v=20260927"; }} /></div>
                  <div><span>{article.category}</span><h4>{article.title}</h4><Meta article={article} /></div>
                </Link>)}
              </div>
            </section>)}
          </div>
        </section>}
      </main>


        <section className="container services-section" id="servicos"><div className="section-heading large-heading"><div><span className="eyebrow">UTILIDADE PÚBLICA</span><h2>Serviços PCH News</h2></div><div className="heading-rule"><span>Informação que ajuda no dia a dia</span></div></div><div className="services-grid"><Link href="/eventos" className="service-card"><CalendarDays size={24}/><div><strong>Agenda de eventos</strong><p>Encontre eventos por cidade, estado e proximidade.</p></div><ArrowRight size={16}/></Link><Link href="/conhecimento-pch" className="service-card service-card-knowledge"><span className="service-icon service-icon-pch"><strong>PCH</strong><small>CONHECIMENTO</small></span><div><span className="service-eyebrow">IDEIAS · CULTURA · DESENVOLVIMENTO</span><strong>Conhecimento PCH</strong><p>Um espaço próprio para conhecimento, ideias e conteúdos especiais do PCH News.</p></div><ArrowRight size={16}/></Link></div></section>

        {(published.some((article) => article.youtubeUrl) || published.some((article) => (article.tags || []).some((tag) => /podcast/i.test(tag)))) && <section className="container media-hub-section" id="midia"><div className="section-heading large-heading"><div><span className="eyebrow">PCH NEWS · VÍDEOS E PODCASTS</span><h2>Programas e conversas</h2></div><div className="heading-rule"><span>Conteúdo audiovisual</span></div></div><div className="media-hub-grid">{published.filter((article) => article.youtubeUrl || (article.tags || []).some((tag) => /podcast/i.test(tag))).slice(0,6).map((article) => <Link key={article.id} href={`/materia/${article.id}`} className="media-hub-card"><div className="media-hub-label">{article.youtubeUrl ? "VÍDEO" : "PODCAST"}</div><h3>{article.title}</h3><p>{article.summary}</p><span>Assistir / ouvir <ArrowRight size={14}/></span></Link>)}</div></section>}
        <section className="container partners-section" id="parceiros">
          <div className="section-heading large-heading">
            <div><span className="eyebrow">REDE PCH NEWS</span><h2>Parceiros</h2></div>
            <div className="heading-rule"><span>Distribuição e conexão editorial</span></div>
          </div>
          <div className="partners-grid">
            <Link className="partner-card" href="/parceiros">
              <span className="partner-mark">HP</span>
              <div><strong>HostingPRESS</strong><p>Portal de origem e infraestrutura parceira do PCH News.</p></div>
              <ArrowRight size={18} />
            </Link>
            <div className="partner-card partner-card-next">
              <span className="partner-mark">+</span>
              <div><strong>Novos parceiros</strong><p>Este espaço já está preparado para receber os próximos portais parceiros.</p></div>
            </div>
          </div>
        </section>

      <nav className="mobile-app-nav" aria-label="Atalhos rápidos">
        <Link href="/" className="mobile-app-item"><span><Bookmark size={18} /></span><small>Início</small></Link>
        <Link href="/eventos" className="mobile-app-item"><span><CalendarDays size={18} /></span><small>Agenda</small></Link>
        <button type="button" className="mobile-app-item" onClick={() => { setSearchOpen(true); window.scrollTo({ top: 0, behavior: "smooth" }); }}><span><Search size={18} /></span><small>Buscar</small></button>
        <Link href="/anuncie" className="mobile-app-item"><span><ArrowRight size={18} /></span><small>Anuncie</small></Link>
        <button type="button" className="mobile-app-item" onClick={() => { setMenuOpen((open) => !open); window.scrollTo({ top: 0, behavior: "smooth" }); }}><span><Menu size={18} /></span><small>Menu</small></button>
      </nav>

      <PublicFooter />

    </div>
  );
}
