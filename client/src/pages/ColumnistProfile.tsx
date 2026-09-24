import { ArrowLeft, ArrowRight, BookOpen, Facebook, Instagram, Linkedin, Twitter } from "lucide-react";
import { Link, useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { NewsArticle } from "@/lib/news";
const LOGO_URL = "/brand/logo.svg";
const imageUrl = (article: NewsArticle) => article.sourceUrl ? `/legacy-image/${encodeURIComponent(article.sourceUrl)}` : article.image || LOGO_URL;
const slugify = (value: string) => value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
export default function ColumnistProfile() {
  const [, params] = useRoute("/colunista/:slug");
  const { data } = trpc.editorial.bootstrap.useQuery(undefined, { retry: false });
  const profile = data?.profiles?.find((item: any) => item.slug === params?.slug);
  const articles: NewsArticle[] = (data?.articles || [])
    .filter((article: any) => article.status === "published" && slugify(article.author) === params?.slug)
    .map((article: any) => ({
      ...article,
      tags: typeof article.tags === "string" ? (() => { try { return JSON.parse(article.tags || "[]"); } catch { return []; } })() : article.tags || [],
      socialLinks: typeof article.socialLinks === "string" ? (() => { try { return JSON.parse(article.socialLinks || "{}"); } catch { return {}; } })() : article.socialLinks || {},
      scheduledAt: article.scheduledAt ? new Date(Number(article.scheduledAt)).toISOString().slice(0, 16) : undefined,
    }));
  if (!profile) return <div className="article-page empty-article"><img className="article-logo" src={LOGO_URL} alt="PCH News" /><h1>Colunista não encontrado.</h1><Link className="primary-cta" href="/">Voltar para o início</Link></div>;
  return <main className="profile-page"><header className="profile-header"><Link href="/" className="article-back"><ArrowLeft size={15} /> Voltar para PCH News</Link><img src={LOGO_URL} alt="PCH News" /><Link href="/" className="admin-link">Publicações</Link></header><section className="profile-hero"><div className="profile-portrait-wrap"><img src={profile.photo} alt={profile.name} className="profile-portrait" /><span className="profile-initial">PCH</span></div><div className="profile-intro"><span className="admin-kicker">COLUNISTA PCH NEWS</span><h1>{profile.name}</h1><strong>{profile.beat}</strong><p>{profile.bio}</p><div className="profile-stat"><BookOpen size={16} /> {articles.length} {articles.length === 1 ? "publicação" : "publicações"} no site</div><div className="profile-socials">{profile.instagram && <a href={`https://instagram.com/${profile.instagram.replace("@", "")}`} target="_blank" rel="noreferrer"><Instagram size={16} /> {profile.instagram}</a>}{profile.facebook && <a href={`https://facebook.com/${profile.facebook}`} target="_blank" rel="noreferrer"><Facebook size={16} /> {profile.facebook}</a>}{profile.x && <a href={`https://x.com/${profile.x.replace("@", "")}`} target="_blank" rel="noreferrer"><Twitter size={16} /> {profile.x}</a>}{profile.linkedin && <a href={`https://linkedin.com/in/${profile.linkedin}`} target="_blank" rel="noreferrer"><Linkedin size={16} /> LinkedIn</a>}</div></div></section><section className="profile-stories"><div className="section-heading large-heading"><div><span className="eyebrow">ARQUIVO DO COLUNISTA</span><h2>Publicações de {profile.name}</h2></div><div className="heading-rule"><span>{articles.length} histórias</span></div></div>{articles.length ? <div className="profile-story-grid">{articles.map((article) => <article className="profile-story" key={article.id}><Link href={`/materia/${article.id}`}><img src={imageUrl(article)} alt="" onError={(event) => { event.currentTarget.src = article.image || LOGO_URL; }} /><div><span className="category-tag">{article.category}</span><h3>{article.title}</h3><p>{article.summary}</p><span className="read-more">Ler matéria <ArrowRight size={14} /></span></div></Link></article>)}</div> : <div className="profile-empty">Ainda não há publicações assinadas por este colunista.</div>}</section><footer className="article-page-footer"><img src={LOGO_URL} alt="PCH News" /><span>Jornalismo local, pensamento amplo.</span></footer></main>;
}
