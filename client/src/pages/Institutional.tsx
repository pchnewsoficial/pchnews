import { Link } from "wouter";
import { ArrowRight, CheckCircle2, ShieldCheck } from "lucide-react";
import PublicFooter from "@/components/PublicFooter";

const LOGO_URL = "/brand/pch-news-official-20260926.svg?v=20260926";

export default function Institutional() {
  return (
    <div className="site-shell public-module-page">
      <header className="public-module-header">
        <div className="container public-module-header-inner">
          <Link href="/" className="public-module-brand"><img src={LOGO_URL} alt="PCH News" /><span>Informação para <strong>libertar a mente.</strong></span></Link>
          <nav><Link href="/">Notícias</Link><Link href="/lei">Lei &amp; Justiça</Link><Link href="/anuncie">Anuncie</Link></nav>
        </div>
      </header>
      <main>
        <section className="container public-hero">
          <span className="eyebrow gold">INSTITUCIONAL · PCH NEWS</span>
          <h1>Informação para <em>libertar a mente.</em></h1>
          <p>Um projeto jornalístico digital comprometido com clareza, contexto e responsabilidade.</p>
        </section>
        <section className="container institutional-grid">
          <article className="institutional-card institutional-card-wide"><span className="public-kicker">MISSÃO</span><h2>Informar com clareza, contexto e responsabilidade.</h2><p>O PCH News existe para informar com clareza, contexto e responsabilidade, aproximando o público dos fatos que impactam sua vida e sua comunidade. Nosso compromisso é produzir jornalismo acessível, independente e compreensível, valorizando a pluralidade de ideias, a apuração e o direito do leitor de formar sua própria opinião.</p></article>
          <article className="institutional-card"><span className="public-kicker">VISÃO</span><h2>Qualidade, transparência e contexto.</h2><p>Ser uma plataforma jornalística digital reconhecida pela qualidade da informação, pela transparência editorial e pela capacidade de transformar acontecimentos complexos em conteúdo compreensível para o público.</p></article>
          <article className="institutional-card"><span className="public-kicker">OBJETIVO</span><h2>Levar informação relevante ao público.</h2><p>Levar informação relevante, contextualizada e responsável ao público, conectando notícias nacionais, regionais e internacionais a temas que fazem parte da vida cotidiana.</p></article>
        </section>
        <section className="container institutional-section">
          <div className="institutional-section-heading"><ShieldCheck size={24}/><div><span className="public-kicker">PRINCÍPIOS EDITORIAIS</span><h2>O que orienta o PCH News</h2></div></div>
          <div className="principles-grid">
            {["Independência editorial","Apuração e responsabilidade","Transparência sobre fontes e correções","Pluralidade e respeito ao contraditório","Distinção entre notícia, análise, opinião e publicidade","Proteção da dignidade das pessoas","Correção e atualização das informações quando necessário"].map(item=><div className="principle-item" key={item}><CheckCircle2 size={18}/><span>{item}</span></div>)}
          </div>
        </section>
        <section className="container institutional-section">
          <div className="institutional-copy"><span className="public-kicker">COMO FAZEMOS JORNALISMO</span><h2>Apuração, revisão e responsabilidade humana.</h2><p>As matérias são construídas a partir de informações e fontes que podem ser verificadas, passam por revisão editorial e podem receber apoio de ferramentas e agentes tecnológicos. A tecnologia auxilia pesquisa, organização, revisão e identificação de pontos de atenção; a decisão editorial final permanece sob responsabilidade humana.</p><p>Quando uma informação relevante muda, o PCH News pode atualizar a matéria e registrar a alteração. Correções e contexto fazem parte do compromisso com o leitor.</p></div>
        </section>
        <section className="container institutional-section institutional-highlight">
          <div><span className="public-kicker">PUBLICIDADE E CONTEÚDO COMERCIAL</span><h2>Publicidade identificada, jornalismo independente.</h2><p>Conteúdo comercial e publicidade devem ser identificados de forma clara. Uma solicitação comercial não determina a pauta, o texto ou a conclusão de uma matéria jornalística.</p><Link className="gold-button" href="/anuncie">Conheça o PCH News Ads <ArrowRight size={16}/></Link></div>
          <div className="institutional-actions"><Link href="/lei">Conheça Lei &amp; Justiça <ArrowRight size={16}/></Link><Link href="/">Voltar às notícias <ArrowRight size={16}/></Link></div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
