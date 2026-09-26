import { FormEvent, useState } from "react";
import { CheckCircle2, Megaphone, Send, ShieldCheck } from "lucide-react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import PublicFooter from "@/components/PublicFooter";

const LOGO_URL = "/brand/pch-news-official-20260926.svg?v=20260926";
const formats = ["Publicidade na home", "Patrocínio de editoria", "Campanha institucional", "Projeto especial", "Outro"];

export default function PublicAds() {
  const create = trpc.adRequests.create.useMutation();
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ business:"", contactName:"", email:"", phone:"", city:"", website:"", socials:"", adType:formats[0], budget:"", period:"", message:"", consent:false });
  const update=(key:string,value:string|boolean)=>setForm(f=>({...f,[key]:value}));
  const submit=async(e:FormEvent)=>{
    e.preventDefault();
    if(!form.business.trim()||!form.contactName.trim()||!form.email.trim()||!form.phone.trim()||!form.message.trim()||!form.consent){ return; }
    await create.mutateAsync(form);
    setSent(true);
  };
  return <div className="site-shell public-module-page">
    <header className="public-module-header"><div className="container public-module-header-inner"><Link href="/" className="public-module-brand"><img src={LOGO_URL} alt="PCH News"/><span>Informação para <strong>libertar a mente.</strong></span></Link><nav><Link href="/">Notícias</Link><Link href="/institucional">Institucional</Link><Link href="/lei">Lei &amp; Justiça</Link></nav></div></header>
    <main>
      <section className="container public-hero ad-public-hero"><div><span className="eyebrow gold">PCH NEWS ADS · COMERCIAL</span><h1>Sua marca pode ocupar <em>um espaço claro.</em></h1><p>Apresente sua empresa, produto ou serviço ao PCH News. Envie seu briefing e a equipe comercial retornará para avaliar o formato adequado.</p></div><div className="ad-hero-mark"><Megaphone size={44}/><span>PUBLICIDADE<br/><strong>IDENTIFICADA</strong></span></div></section>
      <section className="container ads-public-grid">
        <div className="ads-public-info"><span className="public-kicker">FORMATOS</span><h2>Presença comercial com transparência.</h2><p>Os formatos abaixo são referências. Valores, disponibilidade e condições são definidos em proposta comercial, conforme o projeto.</p><div className="ad-format-list">{formats.map(f=><div key={f}><CheckCircle2 size={17}/><span>{f}</span></div>)}</div><div className="ads-trust"><ShieldCheck size={20}/><div><strong>Sem cobrança automática</strong><p>Este formulário registra apenas uma solicitação comercial. A equipe entra em contato antes de qualquer contratação.</p></div></div></div>
        <div className="public-form-card">{sent?<div className="form-success"><CheckCircle2 size={42}/><span className="public-kicker">SOLICITAÇÃO RECEBIDA</span><h2>Obrigado pelo contato.</h2><p>Seu briefing foi registrado. A equipe comercial do PCH News poderá entrar em contato pelos dados informados.</p><Link className="gold-button" href="/">Voltar ao PCH News</Link></div>:<form onSubmit={submit}><div className="public-form-heading"><span className="public-kicker">FALE COM O COMERCIAL</span><h2>Solicitar proposta</h2><p>Campos com * são obrigatórios.</p></div><div className="public-form-two"><label>Empresa / marca *<input required value={form.business} onChange={e=>update("business",e.target.value)} /></label><label>Responsável *<input required value={form.contactName} onChange={e=>update("contactName",e.target.value)} /></label></div><div className="public-form-two"><label>E-mail *<input required type="email" value={form.email} onChange={e=>update("email",e.target.value)} /></label><label>WhatsApp / telefone *<input required value={form.phone} onChange={e=>update("phone",e.target.value)} /></label></div><div className="public-form-two"><label>Cidade / UF<input value={form.city} onChange={e=>update("city",e.target.value)} /></label><label>Site / redes sociais<input value={form.website} onChange={e=>update("website",e.target.value)} placeholder="https://..." /></label></div><div className="public-form-two"><label>Tipo de divulgação<select value={form.adType} onChange={e=>update("adType",e.target.value)}>{formats.map(f=><option key={f}>{f}</option>)}</select></label><label>Período desejado<input value={form.period} onChange={e=>update("period",e.target.value)} placeholder="Ex.: outubro / 30 dias" /></label></div><label>Faixa de investimento (opcional)<input value={form.budget} onChange={e=>update("budget",e.target.value)} placeholder="Ex.: a partir de R$ 500" /></label><label>Briefing / mensagem *<textarea required minLength={10} rows={6} value={form.message} onChange={e=>update("message",e.target.value)} placeholder="Conte o que deseja divulgar, objetivo da campanha e informações importantes." /></label><label className="consent-check"><input required type="checkbox" checked={form.consent} onChange={e=>update("consent",e.target.checked)}/><span>Autorizo o PCH News a utilizar estes dados para responder à minha solicitação comercial.</span></label>{create.isError&&<div className="form-error">{create.error.message||"Não foi possível enviar agora. Tente novamente."}</div>}<button className="gold-button" type="submit" disabled={create.isPending}><Send size={16}/>{create.isPending?"Enviando…":"Enviar solicitação"}</button></form>}</div>
      </section>
    </main><PublicFooter/>
  </div>;
}
