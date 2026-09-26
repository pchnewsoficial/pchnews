import { FileText, Scale, ShieldCheck } from "lucide-react";
import { Link } from "wouter";
import { useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { NewsArticle } from "@/lib/news";
import PublicFooter from "@/components/PublicFooter";
import PageMeta from "@/components/PageMeta";

const LOGO_URL = "/brand/pch-news-official-20260926.svg?v=20260927";
const legalTerms = ["lei","legislação","legislacao","justiça","justica","tribunal","direito","direitos","judiciário","judiciario","decisão judicial","decisao judicial"];

export default function LawNews() {
  const { data } = trpc.editorial.bootstrap.useQuery(undefined,{retry:false});
  const articles:NewsArticle[]=useMemo(()=>((data?.articles||[]) as any[]).filter(a=>["published","updated"].includes(a.status)).map(a=>({...a,tags:typeof a.tags==="string"?(()=>{try{return JSON.parse(a.tags||"[]")}catch{return[]}})():a.tags||[]})),[data]);
  const stories=useMemo(()=>articles.filter(a=>a.category==="Lei & Justiça" || (a.tags||[]).some((tag:string)=>legalTerms.includes(tag.trim().toLowerCase()))).slice(0,24),[articles]);
  return <div className="site-shell public-module-page"><PageMeta title="Lei & Justiça — PCH News" description="Notícias sobre legislação, justiça, direitos e instituições no PCH News." canonicalPath="/lei" />
    <header className="public-module-header"><div className="container public-module-header-inner"><Link href="/" className="public-module-brand"><img src={LOGO_URL} alt="PCH News"/><span>Informação para <strong>libertar a mente.</strong></span></Link><nav><Link href="/">Notícias</Link><Link href="/institucional">Institucional</Link><Link href="/anuncie">Anuncie</Link></nav></div></header>
    <main>
      <section className="container public-hero law-hero"><div><span className="eyebrow gold">EDITORIA PCH NEWS</span><h1>Lei <em>&amp; Justiça.</em></h1><p>Notícias sobre legislação, decisões judiciais, direitos, instituições e os impactos práticos das normas na vida cotidiana.</p></div><div className="law-icon"><Scale size={52}/></div></section>
      <section className="container law-note"><ShieldCheck size={20}/><p>Esta é uma editoria jornalística. O conteúdo informa e contextualiza fatos públicos e <strong>não substitui orientação jurídica individual.</strong></p></section>
      <section className="container law-stories"><div className="section-heading large-heading"><div><span className="eyebrow">COBERTURA JURÍDICA</span><h2>{stories.length?"Últimas notícias da lei":"Lei & Justiça"}</h2></div><div className="heading-rule"><span>{stories.length} publicações</span></div></div>{stories.length?<div className="law-story-grid">{stories.map(a=><Link className="law-story-card" key={a.id} href={"/materia/"+(a.slug||a.id)}><div className="law-story-image"><img src={a.image||LOGO_URL} alt=""/><span>Lei &amp; Justiça</span></div><div><span className="law-story-meta">{a.date} · {a.author}</span><h3>{a.title}</h3><p>{a.summary}</p></div></Link>)}</div>:<div className="law-empty"><FileText size={38}/><h3>A editoria está sendo construída.</h3><p>Ainda não há matérias publicadas classificadas em Lei &amp; Justiça. Quando houver conteúdo aprovado e publicado, ele aparecerá aqui.</p><Link className="gold-button" href="/">Ver todas as notícias</Link></div>}</section>
    </main><PublicFooter/>
  </div>;
}
