import { ArrowRight, Brain, Compass, HeartPulse, HelpCircle } from "lucide-react";
import { Link } from "wouter";

const BEYOND_NEWS_QUESTIONS = [
  { title: "O fato", text: "O que aconteceu? Quem informou? Quais são as fontes e evidências disponíveis?" },
  { title: "O contexto", text: "O que o leitor precisa saber para compreender o fato além do título?" },
  { title: "O impacto humano", text: "Como pessoas, comunidades, comportamentos e relações podem ser afetados?" },
  { title: "O que está além", text: "Que perguntas, aprendizados, consequências ou perspectivas relevantes o fato permite explorar?" },
];

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
            <div><strong>Contexto</strong><p>O que veio antes e o que o leitor precisa saber para entender o fato.</p></div>
          </article>
          <article>
            <span className="beyond-news-icon"><HeartPulse size={18} /></span>
            <div><strong>Impacto humano</strong><p>Quando pertinente, mostramos pessoas, relações e efeitos reais do acontecimento.</p></div>
          </article>
          <article>
            <span className="beyond-news-icon"><Brain size={18} /></span>
            <div><strong>Compreensão</strong><p>Uma segunda leitura procura o que o fato permite compreender além do acontecimento.</p></div>
          </article>
        </div>

        <div className="beyond-news-questions" aria-labelledby="beyond-news-questions-title">
          <div className="beyond-news-questions-heading">
            <span className="beyond-news-icon"><HelpCircle size={17} /></span>
            <div>
              <span className="eyebrow">PERGUNTAS-GUIA</span>
              <h3 id="beyond-news-questions-title">Quatro perguntas antes de ir além</h3>
            </div>
          </div>
          <div className="beyond-news-question-grid">
            {BEYOND_NEWS_QUESTIONS.map((question) => (
              <article key={question.title} className="beyond-news-question">
                <strong>{question.title}</strong>
                <p>{question.text}</p>
              </article>
            ))}
          </div>
        </div>

        <Link href="/principios-editoriais" className="beyond-news-link">
          Conheça nossos princípios editoriais <ArrowRight size={15} />
        </Link>
      </div>
    </section>
  );
}
