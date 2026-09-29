import { Link } from "wouter";
import officialLogoUrl from "@/assets/pch-news-official-current.svg";
import { ArrowRight } from "lucide-react";

const LOGO_URL = officialLogoUrl;

export default function PublicFooter() {
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
        <div className="footer-column">
          <span>EDITORIAL</span>
          <Link href="/#ultimas">Últimas notícias</Link>
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
      <div className="container footer-bottom">
        <span>PCH News · Brasil e mundo</span>
        <span>Notícia, análise, opinião e publicidade identificada.</span>
      </div>
    </footer>
  );
}
