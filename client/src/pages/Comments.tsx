import { useMemo, useState } from "react";
import { Check, Filter, MessageCircle, Search, Send, Trash2, X } from "lucide-react";
import { NewsArticle } from "@/lib/news";
import { ReaderComment, persistComments } from "@/lib/editorial";
import { trpc } from "@/lib/trpc";
export default function Comments({ comments, articles, onChange, notify, currentAuthor, isAdmin }: { comments: ReaderComment[]; articles: NewsArticle[]; onChange: (next: ReaderComment[]) => void; notify: (message: string) => void; currentAuthor: string; isAdmin: boolean }) {
  const [query, setQuery] = useState(""); const [status, setStatus] = useState<ReaderComment["status"] | "all">("all"); const [articleId, setArticleId] = useState("all"); const [replyOpen, setReplyOpen] = useState<string | null>(null); const [replyDraft, setReplyDraft] = useState("");
  const pending = comments.filter((comment) => comment.status === "pending");
  const moderateRemote = trpc.comments.moderate.useMutation(); const filtered = useMemo(() => { const normalized = query.toLowerCase().trim(); return comments.filter((comment) => { const article = articles.find((item) => item.id === comment.articleId); const matchesQuery = !normalized || `${comment.name} ${comment.text} ${article?.title || ""}`.toLowerCase().includes(normalized); return matchesQuery && (status === "all" || comment.status === status) && (articleId === "all" || comment.articleId === articleId); }); }, [comments, articles, query, status, articleId]);
  const moderate = async (id: string, nextStatus: ReaderComment["status"]) => {
    if (nextStatus !== "approved" && nextStatus !== "rejected") return;
    try {
      await moderateRemote.mutateAsync({ id, action: nextStatus === "approved" ? "approve" : "reject" });
      const next = comments.map((comment) => comment.id === id ? { ...comment, status: nextStatus } : comment);
      onChange(next); persistComments(next);
      notify(nextStatus === "approved" ? "Comentário aprovado e publicado." : "Comentário rejeitado.");
    } catch (error) { notify(error instanceof Error ? error.message : "Não foi possível moderar o comentário."); }
  };
  const remove = async (id: string) => {
    try {
      await moderateRemote.mutateAsync({ id, action: "remove" });
      const next = comments.map((comment) => comment.id === id ? { ...comment, status: "rejected" as const } : comment);
      onChange(next); persistComments(next); notify("Comentário removido da fila.");
    } catch (error) { notify(error instanceof Error ? error.message : "Não foi possível remover o comentário."); }
  };
  const sendReply = async (comment: ReaderComment) => {
    if (!replyDraft.trim()) return;
    try {
      const reply = replyDraft.trim();
      await moderateRemote.mutateAsync({ id: comment.id, action: "reply", reply });
      const next = comments.map((item) => item.id === comment.id ? { ...item, reply, repliedBy: currentAuthor, repliedAt: new Date().toLocaleString("pt-BR") } : item);
      onChange(next); persistComments(next); setReplyDraft(""); setReplyOpen(null); notify("Resposta publicada no comentário.");
    } catch (error) { notify(error instanceof Error ? error.message : "Não foi possível publicar a resposta."); }
  };
  return <div className="comments-admin"><div className="admin-heading compact"><div><span className="admin-kicker">COMUNIDADE</span><h1>Comentários<span>.</span></h1><p>Modere e responda as conversas antes que apareçam nas matérias.</p></div><span className="comment-count"><MessageCircle size={15} /> {pending.length} pendentes</span></div><div className="comment-filters"><div className="admin-search"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por nome, texto ou notícia" /></div><label><Filter size={14} /> Status<select value={status} onChange={(event) => setStatus(event.target.value as ReaderComment["status"] | "all")}><option value="all">Todos</option><option value="pending">Pendentes</option><option value="approved">Aprovados</option><option value="rejected">Rejeitados</option></select></label><label>Matéria<select value={articleId} onChange={(event) => setArticleId(event.target.value)}><option value="all">Todas as matérias</option>{articles.map((article) => <option key={article.id} value={article.id}>{article.title}</option>)}</select></label></div><div className="moderation-summary">{filtered.length} comentário(s) encontrado(s)</div><div className="panel moderation-panel">{filtered.length === 0 ? <div className="moderation-empty"><MessageCircle size={30} /><strong>{comments.length ? "Nenhum resultado" : "Nenhum comentário ainda"}</strong><span>{comments.length ? "Ajuste os filtros ou tente outra busca." : "Quando leitores comentarem, eles aparecerão aqui para revisão."}</span></div> : filtered.map((comment) => { const article = articles.find((item) => item.id === comment.articleId); const canReply = isAdmin || article?.author === currentAuthor; return <article className={`moderation-row ${comment.status}`} key={comment.id}><div className="comment-avatar">{comment.name.slice(0, 2).toUpperCase()}</div><div className="moderation-copy"><div><strong>{comment.name}</strong><small>{comment.createdAt} · {article?.title || "Matéria"}</small></div><p>{comment.text}</p>{comment.reply && <div className="moderation-reply"><strong>Resposta de {comment.repliedBy || "PCH News"}</strong><span>{comment.reply}</span><small>{comment.repliedAt}</small></div>}{replyOpen === comment.id && <div className="quick-reply"><textarea value={replyDraft} onChange={(event) => setReplyDraft(event.target.value)} placeholder="Escreva uma resposta cordial..." autoFocus /><button className="approve-comment" onClick={() => sendReply(comment)}><Send size={13} /> Publicar resposta</button></div>}</div><div className="moderation-actions">{canReply && <button className="reply-comment" onClick={() => { setReplyOpen(replyOpen === comment.id ? null : comment.id); setReplyDraft(comment.reply || ""); }}><MessageCircle size={14} /> {comment.reply ? "Editar resposta" : "Responder"}</button>}{comment.status === "pending" && <><button className="approve-comment" onClick={() => moderate(comment.id, "approved")}><Check size={14} /> Aprovar</button><button className="reject-comment" onClick={() => moderate(comment.id, "rejected")}><X size={14} /> Rejeitar</button></>}{comment.status !== "pending" && <button className="remove-comment" onClick={() => remove(comment.id)}><Trash2 size={14} /> Remover</button>}</div></article>; })}</div></div>;
}
