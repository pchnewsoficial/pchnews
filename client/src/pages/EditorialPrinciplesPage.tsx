import { Link } from "wouter";
import PageMeta from "@/components/PageMeta";
import PublicFooter from "@/components/PublicFooter";

export default function EditorialPrinciplesPage() {
  return <div className="site-shell public-module-page">
    <PageMeta title="Princípios Editoriais — PCH News" description="O princípio editorial do PCH News: ir além da notícia, preservando a autoria e ampliando a compreensão." canonicalPath="/principios-editoriais" />
    <header className="knowledge-hero"><div className="container"><Link href="/" className="knowledge-back">← PCH News</Link><span className="eyebrow gold">PCH NEWS · PRINCÍPIOS EDITORIAIS</span><h1>Além da notícia.</h1><p>O PCH News não quer apenas repetir o que aconteceu. Quer ajudar o leitor a compreender o que o fato revela, provoca e significa.</p></div></header>
    <main className="container knowledge-main">
      <section className="knowledge-note knowledge-creator"><span className="eyebrow">NOSSO PRINCÍPIO CENTRAL</span><h2>Informar é o começo. Compreender é ir além.</h2>
        <p>Uma notícia pode registrar um fato. O PCH News procura, quando houver base e relevância, avançar para o contexto, as consequências, as pessoas envolvidas, os aspectos emocionais e comportamentais e as perguntas que o fato deixa para a sociedade.</p>
        <p>Esse princípio não significa transformar toda notícia em opinião, diagnóstico ou interpretação. Fato, análise, experiência pessoal e reflexão devem permanecer identificados. Conteúdos sobre saúde, saúde mental, psicologia ou comportamento devem ser tratados com responsabilidade, sem diagnóstico indevido, sensacionalismo ou promessa terapêutica.</p>
      </section>
      <section className="knowledge-grid">
        <article><h3>O fato</h3><p>O que aconteceu? Quem informou? Quais são as fontes e evidências disponíveis?</p></article>
        <article><h3>O contexto</h3><p>O que o leitor precisa saber para compreender o fato além do título?</p></article>
        <article><h3>O impacto humano</h3><p>Como pessoas, comunidades, comportamentos e relações podem ser afetados?</p></article>
        <article><h3>O que está além</h3><p>Que perguntas, aprendizados, consequências ou perspectivas relevantes o fato permite explorar?</p></article>
      </section>
      <section className="knowledge-note"><span className="eyebrow">LIBERDADE COM RESPONSABILIDADE</span><h2>Cada autor pode escrever do seu jeito.</h2>
        <p>O PCH News não busca transformar todos os autores em uma única voz. Colunistas, jornalistas e convidados podem preservar seu estilo, repertório e forma de expressão. O padrão comum está na responsabilidade editorial: separar fato de opinião, identificar fontes, evitar afirmações sem base, respeitar pessoas e deixar claro quando um conteúdo é análise, coluna, reportagem ou reflexão.</p>
      </section>
      <section className="knowledge-note"><span className="eyebrow">COMO O PCH NEWS AJUDA</span><h2>Uma ferramenta editorial pode perguntar o que ficou de fora.</h2>
        <p>O sistema de revisão do PCH News poderá analisar uma matéria e apontar oportunidades de contexto, impacto humano, perguntas relevantes, contrapontos e consequências. Essa ferramenta não substitui o autor, a apuração ou a decisão editorial humana. Ela serve como segunda leitura.</p>
        <p><strong>Pergunta-guia:</strong> depois de ler esta matéria, o leitor entende apenas o que aconteceu ou também consegue compreender melhor por que isso importa?</p>
      </section>
      <section className="knowledge-note"><span className="eyebrow">TERMOS</span><h2>Participação, parceria e confidencialidade</h2>
        <p><strong>Participação:</strong> o convite é voluntário e, no momento, não há cobrança nem promessa ou garantia de remuneração. Qualquer eventual remuneração futura dependerá de acordo específico.</p>
        <p><strong>Confidencialidade:</strong> informações internas, pautas não publicadas, materiais restritos, acessos e dados recebidos em razão da participação devem ser protegidos.</p>
        <p><strong>Responsabilidade autoral:</strong> cada colaborador responde pelo material que envia e deve possuir as autorizações e direitos necessários. O PCH News pode revisar, editar, identificar, suspender ou retirar conteúdo conforme suas regras editoriais e a legislação aplicável.</p>
      </section>
      <section className="knowledge-note"><span className="eyebrow">ORIGEM DO PROJETO</span><h2>Uma ideia de Evaldo Poeta.</h2>
        <p>O PCH News foi idealizado por <strong>Evaldo Poeta</strong>, com a proposta de construir um veículo digital que una informação, contexto, conhecimento, cultura e compreensão humana.</p>
      </section>
    </main><PublicFooter />
  </div>;
}
