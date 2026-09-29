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
  const columnists = (data?.profiles || []).filter((p: any) => p?.name).slice(0, 12);
  return (
    <footer className="site-footer">
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
          <small className="footer-social-note">Facebook e TikTok: ícones preparados; links serão ativados quando os perfis oficiais forem cadastrados.</small>
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
        <div className="footer-signature">
          <span>INFORMAÇÃO PARA</span>
          <strong className="footer-freedom-highlight">LIBERTAR A MENTE.</strong>
          <Link className="footer-cta-link" href="/anuncie">Fale com o comercial <ArrowRight size={14} /></Link>
          <small>© 2026 PCH News · Responsabilidade editorial PCH News</small>
        </div>
      </div>
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
                const initials = String(profile.name).split(/\s+/).filter(Boolean).slice(0,2).map((x: string) => x[0]).join("").toUpperCase();
                return (
                  <Link key={"footer-columnist-" + slug + "-" + index} href={"/equipe/" + slug} className="footer-columnist-pill">
                    {profile.photo ? <img src={profile.photo} alt="" onError={(e) => { e.currentTarget.style.display = "none"; e.currentTarget.parentElement?.classList.add("is-fallback"); }} /> : null}
                    <span className="footer-columnist-avatar">{initials}</span>
                    <span><strong>{profile.name}</strong><small>{profile.role || "Colunista"}</small></span>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}
      <div className="container footer-bottom">
        <span>PCH News · Brasil e mundo</span>
        <span>Notícia, análise, opinião e publicidade identificada.</span>
      </div>
    </footer>
  );
}
