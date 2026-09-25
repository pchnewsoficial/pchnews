import { TolerajornalMark } from "@/components/FreedomReviewPanel";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Copy, Facebook, Linkedin, MessageCircle, MessageSquare, Send, Eye } from "lucide-react";
import { Link, useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { NewsArticle, readStoredArticles } from "@/lib/news";
import { ReaderComment } from "@/lib/editorial";
const LOGO_URL = "/brand/logo.svg?v=20260925-2";
const EyeIcon = () => <Eye size={14} />;
const imageUrl = (article: NewsArticle) => article.sourceUrl ? `https://pch-news.pchnews-oficial.workers.dev/legacy-image/${encodeURIComponent(article.sourceUrl)}` : article.image || LOGO_URL;
const slugify = (value: string) => value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
function youtubeEmbed(url?: string | null) { if (!url) return null; try { const parsed = new URL(url); const id = parsed.hostname.includes("youtu.be") ? parsed.pathname.slice(1) : parsed.searchParams.get("v") || parsed.pathname.split("/").filter(Boolean).pop(); return id ? `https://www.youtube.com/embed/${id}` : null; } catch { return null; } }
function visitorId() { const key = "pch-news-visitor-id"; const current = window.localStorage.getItem(key); if (current) return current; const next = `visitor-${crypto.randomUUID()}`; window.localStorage.setItem(key, next); return next; }
function mapServerArticle(article: any): NewsArticle { return { ...article, tags: typeof article.tags === "string" ? JSON.parse(article.tags || "[]") : article.tags || [], socialLinks: typeof article.socialLinks === "string" ? JSON.parse(article.socialLinks || "{}") : article.socialLinks || {}, scheduledAt: article.scheduledAt ? new Date(Number(article.scheduledAt)).toISOString().slice(0, 16) : undefined }; }
export default function ArticlePage() {
  const [, params] = useRoute("/materia/:slug");
  const { data, isError: bootstrapError } = trpc.editorial.bootstrap.useQuery(undefined, { retry: 1, staleTime: 15_000 });
  const recordView = trpc.editorial.recordView.useMutation();
  const createComment = trpc.comments.create.useMutation();
  const [comments, setComments] = useState<ReaderComment[]>([]);
  const [viewCount, setViewCount] = useState(0);
  const [commentForm, setCommentForm] = useState({ name: "", text: "" });
  const article = useMemo(() => {
    const remote = data?.articles?.map(mapServerArticle).find((item) => item.id === params?.slug || slugify(item.title) === params?.slug);
    if (remote) return remote;
    if (!bootstrapError) return undefined;
    return readStoredArticles().find((item) => item.id === params?.slug || slugify(item.title) === params?.slug);
  }, [data, params?.slug, bootstrapError]);
  useEffect(() => {
    if (!article) return;
    const remoteComments = (data?.comments || []).filter((comment: any) => comment.articleId === article.id && comment.status === "approved");
    setComments(remoteComments.map((comment: any) => ({
      ...comment,
      createdAt: comment.createdAt || new Date(Number(comment.createdAtMs || Date.now())).toLocaleString("pt-BR"),
      repliedAt: comment.repliedAt || (comment.repliedAtMs ? new Date(Number(comment.repliedAtMs)).toLocaleString("pt-BR") : undefined),
    })));
  }, [article?.id, data?.comments]);
  useEffect(() => {
    if (!article || article.status !== "published") return;
    setViewCount(article.views || 0);
    recordView.mutate(
      { articleId: article.id, visitorId: visitorId() },
      {
        onSuccess: (result) => {
          if (result && typeof result.views === "number") setViewCount(result.views);
        },
      },
    );
  }, [article?.id]);
  useEffect(() => {
    if (!article) return;
    const origin = window.location.origin;
    const canonical = article.canonicalUrl || `${origin}/materia/${params?.slug || article.id}`;
    const title = article.seoTitle || article.title;
    const description = article.metaDescription || article.summary;
    document.title = title ? `${title} | PCH News` : "PCH News";
    const upsertMeta = (selector: string, attrs: Record<string,string>) => {
      let node = document.head.querySelector(selector) as HTMLMetaElement | null;
      if (!node) { node = document.createElement("meta"); document.head.appendChild(node); }
      Object.entries(attrs).forEach(([key,value]) => node!.setAttribute(key,value));
    };
    upsertMeta('meta[name="description"]',{name:"description",content:description});
    upsertMeta('meta[name="robots"]',{name:"robots",content:article.noindex ? "noindex,follow" : "index,follow"});
    upsertMeta('meta[property="og:title"]',{property:"og:title",content:article.ogTitle || title});
    upsertMeta('meta[property="og:description"]',{property:"og:description",content:article.ogDescription || description});
    upsertMeta('meta[property="og:type"]',{property:"og:type",content:"article"});
    upsertMeta('meta[property="og:url"]',{property:"og:url",content:canonical});
    upsertMeta('meta[property="og:image"]',{property:"og:image",content:article.image});
    upsertMeta('meta[name="twitter:card"]',{name:"twitter:card",content:"summary_large_image"});
    upsertMeta('meta[name="twitter:title"]',{name:"twitter:title",content:article.ogTitle || title});
    upsertMeta('meta[name="twitter:description"]',{name:"twitter:description",content:article.ogDescription || description});
    upsertMeta('meta[name="twitter:image"]',{name:"twitter:image",content:article.image});
    let link = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!link) { link = document.createElement("link"); link.rel = "canonical"; document.head.appendChild(link); }
    link.href = canonical;
    let script = document.head.querySelector('script[data-pch-news-article]') as HTMLScriptElement | null;
    if (!script) { script = document.createElement("script"); script.type = "application/ld+json"; script.dataset.pchNewsArticle = "true"; document.head.appendChild(script); }
    script.textContent = JSON.stringify({
      "@context":"https://schema.org","@type":"NewsArticle","mainEntityOfPage":{"@type":"WebPage","@id":canonical},
      "headline":article.title,"description":description,"image":[article.image],
      "datePublished":article.date,"dateModified":article.updated,"author":{"@type":"Person","name":article.author,"url":`${origin}/colunista/${profileSlug}`},
      "publisher":{"@type":"Organization","name":"PCH News","url":origin}
    });
  }, [article?.id, params?.slug]);
  if (!article || article.status !== "published") return <div className="article-page empty-article"><img className="article-logo" src={LOGO_URL} alt="PCH News" /><h1>Matéria não encontrada.</h1><p>Essa publicação ainda não está disponível publicamente.</p><Link className="primary-cta" href="/">Voltar para o início</Link></div>;
  const profileSlug = slugify(article.author);
  const share = (network: string) => { const url = window.location.href; const text = `${article.title} — PCH News`; const targets: Record<string, string> = { whatsapp: `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`, facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, x: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}` }; if (network === "copy") { navigator.clipboard?.writeText(url); return; } window.open(targets[network], "_blank", "noopener,noreferrer,width=640,height=580"); };
  const submitComment = async (event: FormEvent) => {
    event.preventDefault();
    if (!commentForm.name.trim() || !commentForm.text.trim()) return;
    try {
      await createComment.mutateAsync({ articleId: article.id, name: commentForm.name.trim(), text: commentForm.text.trim() });
      setCommentForm({ name: "", text: "" });
      window.alert("Obrigado! Seu comentário será analisado pela redação antes de aparecer.");
    } catch {
      window.alert("Não foi possível enviar o comentário agora.");
    }
  };
  return <main className="article-page"><div className="article-ad-top"><span className="ad-tag">PUBLICIDADE</span><strong>Espaço para sua marca no PCH News</strong><a href="/#anuncie">Conheça os formatos</a></div><header className="article-page-header"><Link href="/" className="article-back"><ArrowLeft size={15} /> Voltar para PCH News</Link><img src={LOGO_URL} alt="PCH News" /><Link href="/admin" className="admin-link">Painel editorial</Link></header><article className="article-reader"><span className="category-tag">{article.category}</span><h1>{article.title}</h1><p className="article-deck">{article.summary}</p><div className="article-byline"><span>Por <Link href={`/colunista/${profileSlug}`}>{article.author}</Link></span><span>•</span><span>{article.date}</span><span>•</span><span><EyeIcon /> {viewCount.toLocaleString("pt-BR")} visualizações</span></div><img className="article-cover" src={imageUrl(article)} alt="" />{youtubeEmbed(article.youtubeUrl) && <div className="article-video"><iframe src={youtubeEmbed(article.youtubeUrl)!} title={`Vídeo relacionado a ${article.title}`} loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen /></div>}<div className="article-reader-grid"><div className="article-body"><div className="tj-article-strip"><span className={"tj-type " + (/opini|coluna/i.test(article.category) ? "opinion" : "fact")}>{/opini|coluna/i.test(article.category) ? "OPINIÃO" : "REPORTAGEM FACTUAL"}</span><TolerajornalMark compact /></div><div dangerouslySetInnerHTML={{ __html: article.bodyHtml || `<p>${article.summary}</p>` }} />{article.sourceUrl && <p className="source-note">Fonte original: <a href={article.sourceUrl} target="_blank" rel="noreferrer">{article.sourceName || "fonte externa"}</a>.</p>}</div><aside className="article-side-rail"><div className="article-ad-side"><span className="ad-tag">PUBLICIDADE</span><strong>Sua marca pode aparecer aqui</strong><a href="/#anuncie">Anuncie no PCH News</a></div><div className="share-box"><strong>Compartilhe</strong><span>Leve esta história adiante</span><button className="share-whatsapp" onClick={() => share("whatsapp")}><MessageCircle size={17} /> WhatsApp</button><button onClick={() => share("facebook")}><Facebook size={16} /> Facebook</button><button onClick={() => share("linkedin")}><Linkedin size={16} /> LinkedIn</button><button onClick={() => share("x")}><Send size={15} /> X / Twitter</button><button onClick={() => share("copy")}><Copy size={15} /> Copiar link</button></div></aside></div>{article.socialLinks && Object.values(article.socialLinks).some(Boolean) && <section className="article-socials"><strong>Continue esta história</strong><div>{Object.entries(article.socialLinks).filter(([, url]) => Boolean(url)).map(([name, url]) => <a key={name} href={url as string} target="_blank" rel="noreferrer">{name === "x" ? "X" : name[0].toUpperCase() + name.slice(1)}</a>)}</div></section>}<section className="comments-section"><div className="comments-heading"><div><span className="admin-kicker">CONVERSA</span><h2>Comentários</h2></div><span><MessageSquare size={15} /> {comments.length} publicados</span></div>{comments.length ? <div className="approved-comments">{comments.map((comment) => <article key={comment.id}><div className="comment-avatar">{comment.name.slice(0, 2).toUpperCase()}</div><div><strong>{comment.name}</strong><small>{comment.createdAt}</small><p>{comment.text}</p>{comment.reply && <div className="moderation-reply"><strong>Resposta de {comment.repliedBy || "PCH News"}</strong><span>{comment.reply}</span></div>}</div></article>)}</div> : <p className="comments-empty">Seja o primeiro a comentar esta notícia.</p>}<form className="comment-form" onSubmit={submitComment}><input value={commentForm.name} onChange={(event) => setCommentForm({ ...commentForm, name: event.target.value })} placeholder="Seu nome" /><textarea value={commentForm.text} onChange={(event) => setCommentForm({ ...commentForm, text: event.target.value })} placeholder="Escreva um comentário respeitoso" /><button className="primary-cta" type="submit"><MessageCircle size={15} /> Enviar para moderação</button><small>Comentários passam por aprovação da redação.</small></form></section></article><footer className="article-page-footer"><img src={LOGO_URL} alt="PCH News" /><span>Jornalismo local, pensamento amplo.</span></footer></main>;
}
