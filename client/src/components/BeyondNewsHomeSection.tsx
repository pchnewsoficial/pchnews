import { ArrowRight, Brain, Compass, HeartPulse } from "lucide-react";
import { Link } from "wouter";

export default function BeyondNewsHomeSection() {
  return (
    <section className="container beyond-news-home" id="alem-da-noticia" aria-labelledby="alem-da-noticia-title">
      <div className="beyond-news-inner">
        <div className="beyond-news-heading">
          <span className="eyebrow">DIFERENCIAL EDITORIAL · PCH NEWS</span>
          <h2 id="alem-da-noticia-title">Além da notícia</h2>
          <p>
            Informar é o começo. O PCH News também busca ajudar o leitor a compreender
            o contexto, as consequências e o que um fato revela sobre pessoas e sociedade.
          </p>
        </div>
        <div className="beyond-news-cards">
          <article>
            <span className="beyond-news-icon"><Compass size={18} /></span>
            <div><strong>Contexto</strong><p>O que aconteceu, por que aconteceu e o que precisa ser considerado.</p></div>
          </article>
          <article>
            <span className="beyond-news-icon"><HeartPulse size={18} /></span>
            <div><strong>Impacto humano</strong><p>Quando pertinente, mostramos as pessoas, relações e efeitos que estão por trás do fato.</p></div>
          </article>
          <article>
            <span className="beyond-news-icon"><Brain size={18} /></span>
            <div><strong>Compreensão</strong><p>Uma segunda leitura editorial procura perguntas que ampliem a compreensão sem substituir a apuração.</p></div>
          </article>
        </div>
        <Link href="/principios-editoriais" className="beyond-news-link">
          Conheça nossos princípios editoriais <ArrowRight size={15} />
        </Link>
      </div>
    </section>
  );
}
