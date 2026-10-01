import { Link } from "wouter";
import officialLogoUrl from "@/assets/pch-news-official-current.svg";
import { ArrowRight, Facebook, Instagram, Youtube } from "lucide-react";
import { trpc } from "@/lib/trpc";

const LOGO_URL = officialLogoUrl;

const SOCIALS = [
  { label: "Instagram", href: "https://www.instagram.com/pchnewsoficial/", icon: Instagram, active: true },
  { label: "YouTube", href: "https://www.youtube.com/@pchnewsoficial", icon: Youtube, active: true },
  { label: "Facebook", href: "", icon: Facebook, active: false },
  { label: "TikTok", href: "", icon: null, active: false },
] as const;

function TikTokIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M15.4 3c.3 1.8 1.4 3.2 3.1 3.9.7.3 1.4.4 2.1.4v3.1a8.2 8.2 0 0 1-5.2-1.8v7.2a5.2 5.2 0 1 1-4.5-5.2v3.2a2.1 2.1 0 1 0 1.4 2V3h3.1Z"/></svg>;
}

export default function PublicFooter() {
  const { data } = trpc.editorial.bootstrap.useQuery(undefined, { retry: false, staleTime: 60_000 });
  const { data: editorialSubthemes = [] } = trpc.editorialSubthemes.list.useQuery(undefined, { retry: false, staleTime: 60_000 });
  const columnists = (data?.profiles || [])
    .filter((p: any) => p?.name && p?.photo && (p?.role === "columnist" || String(p?.beat || "").toLowerCase().includes("colunista")))
    .slice(0, 12);
  const latestArticle = [...(data?.articles || [])]
    .filter((article: any) => article?.status === "published" && article?.title)
    .sort((a: any, b: any) => Number(b?.date || b?.updatedAt || 0) - Number(a?.date || a?.updatedAt || 0))[0];

  return (
    <footer className="site-footer">
      <style>{`
        .site-footer .footer-news-banner{
          width:min(100%,var(--pch-content-max));
          margin:0 auto;
          padding:14px 30px 0;
        }
        .site-footer .footer-news-banner-inner{
          display:grid;
          grid-template-columns:minmax(0,1fr) auto;
          align-items:center;
          gap:18px;
          min-height:82px;
          padding:0 18px;
          border:1px solid rgba(209,169,75,.22);
          border-radius:10px;
          overflow:hidden;
          background:linear-gradient(100deg,#121b29,#0d1521);
        }
        .site-footer .footer-news-banner-copy{
          min-width:0;
          display:flex;
          align-items:center;
          gap:12px;
        }
        .site-footer .footer-news-banner-kicker{
          flex:0 0 auto;
          color:#d8b45c;
          font:800 9px/1 'DM Sans',sans-serif;
          letter-spacing:.14em;
          text-transform:uppercase;
        }
        .site-footer .footer-news-banner-title{
          min-width:0;
          color:#fff;
          font:700 15px/1.25 'DM Sans',sans-serif;
          overflow:hidden;
          text-overflow:ellipsis;
          white-space:nowrap;
        }
        .site-footer .footer-news-banner-image{
          width:128px;
          height:64px;
          object-fit:cover;
          border-radius:7px;
          opacity:.88;
        }
        .site-footer .footer-news-banner-link{
          display:inline-flex;
          align-items:center;
          gap:6px;
          white-space:nowrap;
          color:#f0d88d;
          font:800 9px/1 'Oswald',sans-serif;
          letter-spacing:.08em;
          text-transform:uppercase;
        }
        .site-footer .footer-columnists{
          width:min(100%,var(--pch-content-max));
          margin:18px auto 0;
          padding:16px 30px 14px;
          border-top:1px solid rgba(255,255,255,.07);
          border-bottom:1px solid rgba(255,255,255,.07);
        }
        .site-footer .footer-columnists-heading{
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap:16px;
          margin-bottom:10px;
        }
        .site-footer .footer-columnists-heading span{
          color:#d0a94f;
          font:800 10px/1 'DM Sans',sans-serif;
          letter-spacing:.15em;
        }
        .site-footer .footer-columnists-heading a{
          display:inline-flex;
          align-items:center;
          gap:5px;
          color:#aeb6c4;
          font:700 9px/1 'Oswald',sans-serif;
          letter-spacing:.06em;
          text-transform:uppercase;
        }
        .site-footer .footer-columnists-window{overflow:hidden;}
        .site-footer .footer-columnists-track{
          display:flex;
          width:max-content;
          gap:10px;
          padding:2px 2px 5px;
          animation:pch-footer-columnists-marquee 34s linear infinite;
          will-change:transform;
        }
        .site-footer .footer-columnists-window:hover .footer-columnists-track,
        .site-footer .footer-columnists-window:focus-within .footer-columnists-track{
          animation-play-state:paused;
        }
        @keyframes pch-footer-columnists-marquee{
          from{transform:translateX(0);}
          to{transform:translateX(-50%);}
        }
        @media (prefers-reduced-motion:reduce){
          .site-footer .footer-columnists-track{
            animation:none;
            width:100%;
            overflow-x:auto;
          }
        }
        .site-footer .footer-columnist-pill{
          flex:0 0 auto;
          display:flex;
          align-items:center;
          gap:9px;
          min-width:205px;
          padding:8px 10px;
          border:1px solid rgba(255,255,255,.09);
          border-radius:9px;
          background:rgba(255,255,255,.035);
        }
        .site-footer .footer-columnist-pill img,
        .site-footer .footer-columnist-avatar{
          width:38px;
          height:38px;
          flex:0 0 38px;
          border-radius:50%;
        }
        .site-footer .footer-columnist-pill img{
          object-fit:cover;
          background:#17202c;
        }
        .site-footer .footer-columnist-avatar{
          display:none;
          place-items:center;
          background:#17202c;
          color:#f0d88d;
          font:800 11px/1 'DM Sans',sans-serif;
        }
        .site-footer .footer-columnist-pill>span:last-child{
          min-width:0;
          display:flex;
          flex-direction:column;
          gap:3px;
        }
        .site-footer .footer-columnist-pill strong{
          color:#f3f5f7;
          font:700 12px/1.2 'DM Sans',sans-serif;
          overflow:hidden;
          text-overflow:ellipsis;
          white-space:nowrap;
        }
        .site-footer .footer-columnist-pill small{
          color:#7f8998;
          font:600 9px/1.2 'DM Sans',sans-serif;
        }
        .site-footer .footer-social-column .footer-socials{
          display:flex!important;
          align-items:center;
          flex-wrap:wrap;
          gap:8px!important;
          width:auto!important;
        }
        .site-footer .footer-social-column .footer-social-link{
          width:38px!important;
          min-width:38px!important;
          height:38px!important;
          min-height:38px!important;
          padding:0!important;
          display:grid!important;
          place-items:center!important;
          border:1px solid rgba(255,255,255,.10);
          border-radius:9px!important;
          background:rgba(255,255,255,.035)!important;
          color:#c9d0da!important;
        }
        .site-footer .footer-social-column .footer-social-link:hover{
          color:#f0d88d!important;
          border-color:rgba(209,169,75,.45);
          background:rgba(209,169,75,.08)!important;
          transform:translateY(-1px);
        }
        .site-footer .footer-social-column .footer-social-link span{display:none!important;}
        .site-footer .footer-social-column .footer-social-link svg{width:18px!important;height:18px!important;margin:0!important;}
        .site-footer .footer-social-column .footer-social-note{display:none!important;}
        .site-footer .footer-themes-list{
          display:grid;
          grid-template-columns:repeat(2,minmax(0,1fr));
          gap:6px 16px;
        }
        .site-footer .footer-themes-list a{
          color:#aeb6c4;
          font:600 11px/1.35 'DM Sans',sans-serif;
          transition:color .2s ease;
        }
        .site-footer .footer-themes-list a:hover{color:#f0d88d;}
        @media(max-width:760px){
          .site-footer .footer-themes-list{grid-template-columns:1fr;}
        }

        /* Desktop footer composition: one clean hierarchy, no accidental grid wrapping. */
        @media(min-width:1001px){
          .site-footer .footer-inner{
            width:min(100%,var(--pch-content-max));
            display:grid!important;
            grid-template-columns:minmax(190px,1.15fr) minmax(150px,.8fr) minmax(250px,1.35fr) minmax(250px,1.35fr)!important;
            gap:24px!important;
            align-items:start!important;
            padding:24px 30px 18px!important;
          }
          .site-footer .footer-inner>.footer-column:nth-of-type(2),
          .site-footer .footer-inner>.footer-column:nth-of-type(3),
          .site-footer .footer-inner>.footer-column:nth-of-type(4){min-width:0;}
          .site-footer .footer-inner>.footer-column:nth-of-type(2){grid-column:2;}
          .site-footer .footer-inner>.footer-column:nth-of-type(3){grid-column:3;}
          .site-footer .footer-inner>.footer-column:nth-of-type(4){grid-column:4;}
          .site-footer .footer-inner>.footer-column:nth-of-type(5){grid-column:4;grid-row:1;}
          .site-footer .footer-inner>.footer-column:nth-of-type(4) + .footer-column{grid-column:4;}
          .site-footer .footer-brand-block{align-self:start;}
          .site-footer .footer-brand-block p{max-width:190px;}
          .site-footer .footer-themes-list{grid-template-columns:1fr 1fr;gap:5px 14px;}
          .site-footer .footer-column{gap:5px!important;}
          .site-footer .footer-column>span{margin-bottom:3px!important;}
          .site-footer .footer-column a,.site-footer .footer-column button{font-size:9px!important;line-height:1.2!important;}

          .site-footer .footer-brand-block{grid-column:1;}
          .site-footer .footer-inner>.footer-contact-row{
            grid-column:1 / -1;
            display:flex;
            align-items:center;
            justify-content:space-between;
            gap:24px;
            margin-top:2px;
            padding-top:18px;
            border-top:1px solid rgba(255,255,255,.07);
          }
          .site-footer .footer-contact-row .footer-social-column{display:flex!important;flex-direction:row!important;align-items:center!important;gap:14px!important;}
          .site-footer .footer-contact-row .footer-social-column>span{margin:0!important;}
          .site-footer .footer-contact-row .footer-signature{display:flex!important;flex-direction:row!important;align-items:center!important;gap:14px!important;text-align:right!important;}
          .site-footer .footer-contact-row .footer-signature>span{margin:0!important;white-space:nowrap;}
          .site-footer .footer-contact-row .footer-signature strong{margin:0!important;white-space:nowrap;}
          .site-footer .footer-contact-row .footer-cta-link{margin:0!important;}
          .site-footer .footer-contact-row .footer-signature small{margin:0!important;white-space:nowrap;}
        }
        @media(max-width:1000px){
          .site-footer .footer-contact-row{display:contents;}
        }

        @media(max-width:760px){
          .site-footer .footer-news-banner{padding:12px 16px 0;}
          .site-footer .footer-news-banner-inner{grid-template-columns:minmax(0,1fr) auto;gap:10px;min-height:70px;padding:0 12px;}
          .site-footer .footer-news-banner-title{font-size:12px;}
          .site-footer .footer-news-banner-image{width:92px;height:52px;}
          .site-footer .footer-news-banner-link{display:none;}
          .site-footer .footer-columnists{padding:16px 16px 14px;}
          .site-footer .footer-columnists-heading{align-items:flex-start;}
          .site-footer .footer-columnists-heading a{font-size:8px;}
          .site-footer .footer-columnist-pill{min-width:190px;}
        }
        @media(max-width:480px){
          .site-footer .footer-news-banner{padding:10px 14px 0;}
          .site-footer .footer-news-banner-inner{grid-template-columns:minmax(0,1fr) 76px;min-height:64px;}
          .site-footer .footer-news-banner-copy{gap:8px;}
          .site-footer .footer-news-banner-kicker{font-size:8px;}
          .site-footer .footer-news-banner-title{font-size:11px;white-space:normal;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;}
          .site-footer .footer-news-banner-image{width:76px;height:48px;}
          .site-footer .footer-columnists{padding-left:14px;padding-right:14px;}
          .site-footer .footer-columnists-heading{flex-direction:column;gap:7px;}
          .site-footer .footer-columnist-pill{min-width:180px;}
        }
      `}</style>

      {latestArticle && (
        <section className="footer-news-banner" aria-label="Notícia em destaque">
          <Link className="footer-news-banner-inner" href={`/materia/${latestArticle.slug || latestArticle.id}`}>
            <div className="footer-news-banner-copy">
              <span className="footer-news-banner-kicker">PCH NEWS · EM DESTAQUE</span>
              <strong className="footer-news-banner-title">{latestArticle.title}</strong>
            </div>
            {latestArticle.image ? <img className="footer-news-banner-image" src={latestArticle.image} alt="" loading="lazy" /> : null}
            <span className="footer-news-banner-link">Ler notícia <ArrowRight size={13} /></span>
          </Link>
        </section>
      )}



      {columnists.length > 0 && (
        <section className="container footer-columnists" aria-label="Colunistas PCH News">
          <div className="footer-columnists-heading">
            <span>COLUNISTAS PCH NEWS</span>
            <Link href="/equipe">Conheça nossos colunistas <ArrowRight size={13} /></Link>
          </div>
          <div className="footer-columnists-window">
            <div className="footer-columnists-track">
              {[...columnists, ...columnists].map((profile: any, index: number) => {
                const slug = profile.slug || "evaldo-poeta";
                return (
                  <Link key={"footer-columnist-" + slug + "-" + index} href={"/equipe/" + slug} className="footer-columnist-pill">
                    <img src={profile.photo} alt={profile.name} loading="lazy" onError={(e) => { e.currentTarget.style.visibility = "hidden"; }} />
                    <span><strong>{profile.name}</strong><small>{profile.role || profile.beat || "Colunista PCH News"}</small></span>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      <div className="container footer-inner">
        <div className="footer-brand-block">
          <img className="footer-logo" src={LOGO_URL} alt="PCH News" decoding="async" />
          <div>
            <strong>PCH News</strong>
            <p>Jornalismo nacional, pensamento amplo.</p>
            <small>Informação para libertar a mente.</small>
          </div>
        </div>
        <div className="footer-column">
          <span>PCH NEWS</span>
          <Link href="/">Início</Link>
          <Link href="/institucional">Institucional</Link>
          <Link href="/lei">Lei &amp; Justiça</Link>
          <Link href="/anuncie">Anuncie</Link>
          <Link href="/parceiros">Parceiros</Link>
        </div>
        <div className="footer-column">
          <span>TEMAS ESPECÍFICOS</span>
          <div className="footer-themes-list">
            {(editorialSubthemes as any[]).slice(0, 12).map((topic: any) => (
              <Link key={topic.id || topic.slug} href={`/?tema=${encodeURIComponent(topic.slug)}`}>{topic.label}</Link>
            ))}
          </div>
        </div>
        <div className="footer-column">
          <span>EDITORIAL</span>
          <Link href="/#ultimas">Últimas notícias</Link>
          <Link href="/equipe">Equipe PCH News</Link>
          <Link href="/colunista/evaldo-poeta">Colunistas</Link>
          <a href="/admin">Painel editorial</a>
        </div>
        <div className="footer-column">
          <span>TRANSPARÊNCIA</span>
          <Link href="/institucional">Missão e princípios</Link>
          <Link href="/institucional">Política editorial</Link>
          <Link href="/principios-editoriais" className="footer-feature-link"><span>Além da notícia</span><small>Conheça o diferencial editorial do PCH News</small><ArrowRight size={13} /></Link>
          <Link href="/institucional">Publicidade</Link>
          <Link href="/privacidade">LGPD e Privacidade</Link>
          <Link href="/termos">Termos de uso</Link>
          <Link href="/cookies">Cookies</Link>
          <button type="button" className="footer-privacy-link" onClick={() => window.dispatchEvent(new CustomEvent("pch-open-privacy-settings"))}>Preferências de privacidade</button>
        </div>
        <div className="footer-contact-row">
          <div className="footer-column footer-social-column">
            <span>REDES SOCIAIS</span>
            <div className="footer-socials" aria-label="Redes sociais do PCH News">
              {SOCIALS.map(({ label, href, icon: Icon, active }) => active && href ? (
                <a key={label} className="footer-social-link" href={href} target="_blank" rel="noreferrer" aria-label={label} title={label}>
                  {Icon ? <Icon size={17} aria-hidden="true" /> : <TikTokIcon />}
                  <span>{label}</span>
                </a>
              ) : (
                <span key={label} className="footer-social-link is-coming" aria-label={label} title={label}>
                  {label === "TikTok" ? <TikTokIcon /> : <Icon size={17} aria-hidden="true" />}
                  <span>{label}</span>
                </span>
              ))}
            </div>
          </div>
          <div className="footer-signature">
            <span>INFORMAÇÃO PARA</span>
            <strong className="footer-freedom-highlight">LIBERTAR A MENTE.</strong>
            <Link className="footer-cta-link" href="/anuncie">Fale com o comercial <ArrowRight size={14} /></Link>
            <small>© 2026 PCH News · Responsabilidade editorial PCH News</small>
          </div>
        </div>
      </div>

      <div className="container footer-bottom">
        <span>PCH News · Brasil e mundo</span>
        <span>Notícia, análise, opinião e publicidade identificada.</span>
      </div>
    </footer>
  );
}
