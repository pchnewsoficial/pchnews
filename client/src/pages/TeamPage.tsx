import { ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import PageMeta from "@/components/PageMeta";
import PublicFooter from "@/components/PublicFooter";
import officialLogoUrl from "@/assets/pch-news-official-current.svg";

const LOGO_URL = officialLogoUrl;
const roleLabels: Record<string,string> = { admin:"Administração", editor:"Editores", journalist:"Jornalistas", columnist:"Colunistas", reviewer:"Revisores" };

export default function TeamPage() {
  const { data, isLoading } = trpc.editorial.bootstrap.useQuery(undefined, { retry:false });
  const profiles = (data?.profiles || []).filter((profile:any) => profile?.name);
  const groups = ["admin","editor","journalist","columnist","reviewer"].map(role => ({
    role,
    title: roleLabels[role],
    items: profiles.filter((p:any) => p.role === role)
  })).filter(group => group.items.length);
  const all = groups.length ? groups.flatMap(g => g.items) : profiles;
  return <div className="site-shell public-module-page">
    <PageMeta title="Equipe PCH News" description="Conheça os profissionais que fazem parte da equipe do PCH News." canonicalPath="/equipe" />
    <header className="public-module-header"><div className="container public-module-header-inner"><Link href="/" className="public-module-brand"><img src={LOGO_URL} alt="PCH News"/><span>Equipe <strong>PCH News</strong></span></Link><Link href="/" className="secondary-cta">Voltar às notícias</Link></div></header>
    <main className="container team-page">
      <section className="team-page-hero"><div><span className="eyebrow gold">EQUIPE PCH NEWS</span><h1>As pessoas por trás da informação.</h1><p>Conheça os profissionais que participam da construção editorial do PCH News. Cada integrante pode apresentar sua trajetória, seus canais e, quando aprovado, seus próprios produtos e serviços.</p></div></section>
      <section className="team-marquee-section" aria-label="Equipe em destaque"><div className="team-marquee-window"><div className="team-marquee-track">{[...all,...all].map((p:any,i:number)=><Link key={p.slug+"-"+i} href={"/equipe/"+p.slug} className="team-marquee-item">{p.photo?<img src={p.photo} alt=""/>:<span>{String(p.name).split(/\s+/).filter(Boolean).slice(0,2).map((x:string)=>x[0]).join("").toUpperCase()}</span>}<strong>{p.name}</strong><small>{p.beat}</small></Link>)}</div></div></section>
      {isLoading ? <div className="profile-empty">Carregando equipe…</div> : groups.length ? groups.map(group => <section className="team-group" key={group.role}><div className="section-heading large-heading"><div><span className="eyebrow">{group.title.toUpperCase()}</span><h2>{group.title}</h2></div></div><div className="team-grid">{group.items.map((p:any)=><Link className="team-card" key={p.slug} href={"/equipe/"+p.slug}>{p.photo?<img src={p.photo} alt=""/>:<div className="team-card-avatar">{String(p.name).split(/\s+/).filter(Boolean).slice(0,2).map((x:string)=>x[0]).join("").toUpperCase()}</div>}<div><span>{p.beat}</span><h3>{p.name}</h3><p>{p.bio || "Conheça o perfil profissional."}</p><strong>Ver perfil <ArrowRight size={14}/></strong></div></Link>)}</div></section>) : <div className="profile-empty">A equipe editorial ainda está sendo cadastrada.</div>}
    </main>
    <PublicFooter/>
  </div>;
}
