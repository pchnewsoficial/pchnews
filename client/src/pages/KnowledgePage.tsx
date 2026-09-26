import { ArrowRight, BookOpen, Brain, Lightbulb, Sparkles } from "lucide-react";
import { Link } from "wouter";
import PageMeta from "@/components/PageMeta";
import PublicFooter from "@/components/PublicFooter";

export default function KnowledgePage() {
  return (
    <div className="site-shell public-module-page knowledge-page">
      <PageMeta title="Conhecimento PCH — PCH News" description="Espaço do PCH News dedicado a conhecimento, ideias, cultura e desenvolvimento." canonicalPath="/conhecimento-pch" />
      <header className="knowledge-hero">
        <div className="container">
          <Link href="/" className="knowledge-back">← PCH News</Link>
          <span className="eyebrow gold">PCH NEWS · CONHECIMENTO</span>
          <h1>Conhecimento PCH.</h1>
          <p>Um espaço próprio para conteúdos que ampliam repertório, estimulam reflexão e ajudam a transformar informação em conhecimento.</p>
        </div>
      </header>
      <main className="container knowledge-main">
        <section className="knowledge-intro">
          <div>
            <span className="eyebrow">UM OUTRO JEITO DE INFORMAR</span>
            <h2>Informação que continua depois da notícia.</h2>
            <p>O Conhecimento PCH reúne materiais especiais do PCH News em uma experiência diferente da publicidade. Aqui, conteúdo editorial e projetos de conhecimento têm identidade própria.</p>
          </div>
          <div className="knowledge-mark"><BookOpen size={24}/><strong>PCH</strong><small>CONHECIMENTO</small></div>
        </section>
        <section className="knowledge-grid">
          <article><span><Brain size={19}/></span><h3>Repertório</h3><p>Conteúdos para compreender temas, conceitos e assuntos que fazem parte da vida cotidiana.</p></article>
          <article><span><Lightbulb size={19}/></span><h3>Ideias</h3><p>Reflexões e projetos apresentados com clareza, contexto e identificação.</p></article>
          <article><span><Sparkles size={19}/></span><h3>Desenvolvimento</h3><p>Materiais especiais voltados a aprendizado, cultura e desenvolvimento humano.</p></article>
        </section>
        <section className="knowledge-note knowledge-creator">
          <div>
            <span className="eyebrow">QUEM É EVALDO POETA</span>
            <h2>Evaldo Poeta</h2>
            <p><strong>Criador da Poesia Cognitiva Hipnótica (PCH) · Poeta Terapeuta · Psicanalista Clínico · Cronista · Colunista do PCH News</strong></p>
            <p>Evaldo Poeta é escritor, poeta terapeuta, psicanalista clínico, cronista e criador da <strong>Poesia Cognitiva Hipnótica (PCH)</strong> — uma linguagem autoral que une poesia, reflexão, comunicação e elementos de diferentes campos do conhecimento para transformar informação em experiência, reflexão em consciência e palavras em movimento.</p>
            <p>É autor de obras como <strong>Prisão Interior — Só Você Pode Sair</strong>, <strong>Hábito de Refletir</strong>, <strong>Pílulas Terapêuticas</strong> e <strong>Poemas Reais, Códigos Milionários</strong>, nas quais desenvolve uma escrita que aproxima linguagem, comportamento, emoções, espiritualidade e experiência humana.</p>
            <p>No <strong>PCH News</strong>, atua como criador e colunista, participando da construção da identidade editorial do veículo e desenvolvendo conteúdos que transitam entre comportamento, sociedade, cultura, negócios, comunicação, espiritualidade e cotidiano.</p>
            <p>Como colunista, sua proposta não é apenas contar o que aconteceu, mas provocar uma segunda leitura da realidade: <strong>o que existe por trás do fato, o que ele revela sobre as pessoas e o que podemos compreender a partir dele?</strong></p>
            <blockquote>“A informação chama a atenção. A compreensão transforma o olhar.”</blockquote>
            <p>É também o criador do conceito editorial que busca integrar a linguagem PCH ao jornalismo, à comunicação institucional, à publicidade, à educação, à cultura e às narrativas humanas.</p>
            <p>No PCH News, Evaldo escreve para <strong>informar, conectar e provocar reflexão</strong> — usando a palavra não apenas para dizer alguma coisa, mas para fazer alguma coisa acontecer dentro de quem lê.</p>
          </div>
          <Link className="gold-button" href="/colunista/evaldo-poeta">Ver perfil e publicações <ArrowRight size={16}/></Link>
        </section>
        <section className="knowledge-note">
          <div><span className="eyebrow">EDITORIAL</span><h2>Um espaço separado da publicidade.</h2><p>Conhecimento PCH e Anuncie agora têm destinos diferentes. Quando houver conteúdo de marca ou publicidade, ele será identificado de forma clara.</p></div>
          <Link className="gold-button" href="/anuncie">Quero anunciar <ArrowRight size={16}/></Link>
        </section>
        <section className="knowledge-note">
          <div><span className="eyebrow">PROPÓSITO</span><h2>Informar para ampliar consciência.</h2><p>O PCH News existe para transformar informação em compreensão, aproximando jornalismo, conhecimento, cultura e desenvolvimento humano de pessoas e comunidades.</p></div>
        </section>
        <section className="knowledge-note">
          <div>
            <span className="eyebrow">MVV · PCH NEWS</span>
            <h2>Missão, Visão e Valores.</h2>
            <p><strong>Missão:</strong> informar com clareza, responsabilidade e utilidade, valorizando fatos, pessoas e contextos.</p>
            <p><strong>Visão:</strong> construir uma plataforma jornalística digital de alcance nacional, preparada para dialogar com diferentes regiões e, no futuro, com o público internacional.</p>
            <p><strong>Valores:</strong> verdade factual, independência editorial, respeito às pessoas, transparência, responsabilidade, pluralidade, inovação e compromisso com o interesse público.</p>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
