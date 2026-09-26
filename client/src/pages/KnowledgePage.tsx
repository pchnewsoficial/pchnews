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
        <section className="knowledge-note">
          <div><span className="eyebrow">EDITORIAL</span><h2>Um espaço separado da publicidade.</h2><p>Conhecimento PCH e Anuncie agora têm destinos diferentes. Quando houver conteúdo de marca ou publicidade, ele será identificado de forma clara.</p></div>
          <Link className="gold-button" href="/anuncie">Quero anunciar <ArrowRight size={16}/></Link>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
