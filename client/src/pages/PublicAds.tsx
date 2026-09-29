import { FormEvent, useEffect, useState } from "react";
import { CheckCircle2, Megaphone, Send, ShieldCheck, Upload, X } from "lucide-react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import PublicFooter from "@/components/PublicFooter";
import PageMeta from "@/components/PageMeta";

import officialLogoUrl from "@/assets/pch-news-official-current.svg";
const LOGO_URL = officialLogoUrl;
const formatCards = [
  { id: "banner-home", name: "Banner na home", where: "Faixa em destaque entre as notícias da página inicial, no computador e no celular.", tag: "Mais visto" },
  { id: "lateral-home", name: "Lateral na home", where: "Espaço ao lado da manchete principal, junto às mais lidas." },
  { id: "topo-materia", name: "Topo das matérias", where: "Faixa acima de cada matéria lida no portal." },
  { id: "patrocinio-editoria", name: "Patrocínio de editoria", where: "Sua marca apresentando uma editoria, como Colunas ou Agenda." },
  { id: "publieditorial", name: "Conteúdo patrocinado", where: "Matéria sobre sua empresa, produzida com a redação e identificada como publicidade." },
  { id: "evento-agenda", name: "Evento na Agenda PCH", where: "Destaque do seu evento na agenda e na home." },
  { id: "projeto-especial", name: "Projeto especial", where: "Campanha sob medida: série de conteúdos, cobertura ou ação combinada." },
];
const formats = [...formatCards.map((f) => f.name), "Outro"];
const payments = ["Pix", "Boleto bancário", "Cartão de crédito", "Transferência bancária", "A combinar"];

export default function PublicAds() {
  const create = trpc.adRequests.create.useMutation();
  const uploadAsset = trpc.adRequests.uploadAsset.useMutation();
  const [sent, setSent] = useState(false);
  const [assetUploading, setAssetUploading] = useState(false);
  const [form, setForm] = useState({ business:"", contactName:"", email:"", phone:"", city:"", website:"", socials:"", adType:(() => { if (typeof window === "undefined") return formats[0]; const q = new URLSearchParams(window.location.search).get("formato"); return formatCards.find((f) => f.id === q)?.name || formats[0]; })(), payment:payments[0], budget:"", period:"", message:"", consent:false, destinationUrl:"", creativeUrl:"", creativeNeed:"no_artwork_yet" });
  useEffect(() => { if (window.location.hash) document.getElementById(window.location.hash.slice(1))?.scrollIntoView({ behavior: "smooth", block: "start" }); }, []);
  const chooseFormat = (name: string) => { setForm((f) => ({ ...f, adType: name })); document.getElementById("proposta")?.scrollIntoView({ behavior: "smooth", block: "start" }); };
  const update=(key:string,value:string|boolean)=>setForm(f=>({...f,[key]:value}));
  const updateCreativeNeed=(value:string)=>setForm(f=>({...f,creativeNeed:value as "client_artwork"|"pch_creation"|"no_artwork_yet"}));
  const uploadCreative=async(file:File)=>{
    const allowed=["image/png","image/jpeg","image/webp","image/gif"];
    if(!allowed.includes(file.type)){return;}
    if(file.size>5*1024*1024){return;}
    setAssetUploading(true);
    try{
      const bytes=new Uint8Array(await file.arrayBuffer()); let binary="";
      bytes.forEach(byte=>{binary+=String.fromCharCode(byte);});
      const result=await uploadAsset.mutateAsync({fileName:file.name,contentType:file.type as "image/png"|"image/jpeg"|"image/webp"|"image/gif",base64:btoa(binary)});
      update("creativeUrl",result.url);
      update("creativeNeed","client_artwork");
    } finally { setAssetUploading(false); }
  };
  const submit=async(e:FormEvent)=>{
    e.preventDefault();
    if(!form.business.trim()||!form.contactName.trim()||!form.email.trim()||!form.phone.trim()||!form.message.trim()||!form.consent){ return; }
    const { payment, ...rest } = form; await create.mutateAsync({ ...rest, message: `Forma de pagamento preferida: ${payment}\n\n${form.message}`, consent: true });
    setSent(true);
  };
  return <div className="site-shell public-module-page"><PageMeta title="Anuncie no PCH News" description="Solicite uma proposta comercial para anunciar no PCH News." canonicalPath="/anuncie" />
    <header className="public-module-header"><div className="container public-module-header-inner"><Link href="/" className="public-module-brand"><img src={LOGO_URL} alt="PCH News"/><span>Informação para <strong>libertar a mente.</strong></span></Link><nav><Link href="/">Notícias</Link><Link href="/institucional">Institucional</Link><Link href="/lei">Lei &amp; Justiça</Link></nav></div></header>
    <main>
      <section className="container public-hero ad-public-hero"><div><span className="eyebrow gold">PCH NEWS ADS · COMERCIAL</span><h1>Sua marca pode ocupar <em>um espaço claro.</em></h1><p>Apresente sua empresa, produto ou serviço ao PCH News. Escolha o formato abaixo, diga como prefere pagar e receba a proposta da equipe comercial.</p></div><div className="ad-hero-mark"><Megaphone size={44}/><span>PUBLICIDADE<br/><strong>IDENTIFICADA</strong></span></div></section>
      <section className="container ads-public-grid">
        <div className="ads-public-info"><span className="public-kicker" id="formatos">FORMATOS</span><h2>Presença comercial com transparência.</h2><p>Clique no formato que você quer. Valores, disponibilidade e condições vêm na proposta comercial, conforme o período e o projeto.</p><div className="ad-format-cards">{formatCards.map(f=><button type="button" key={f.id} className={"ad-format-card"+(form.adType===f.name?" is-selected":"")} onClick={()=>chooseFormat(f.name)}><span className="ad-format-top"><strong>{f.name}</strong>{f.tag&&<em>{f.tag}</em>}</span><span>{f.where}</span><small>{form.adType===f.name?"Selecionado ✓":"Escolher este formato →"}</small></button>)}</div><div className="ads-trust"><ShieldCheck size={20}/><div><strong>Sem cobrança automática</strong><p>Este formulário registra apenas uma solicitação comercial. A equipe entra em contato antes de qualquer contratação.</p></div></div></div>
        <div className="public-form-card" id="proposta">{sent?<div className="form-success"><CheckCircle2 size={42}/><span className="public-kicker">SOLICITAÇÃO RECEBIDA</span><h2>Obrigado pelo contato.</h2><p>Seu briefing foi registrado. A equipe comercial do PCH News poderá entrar em contato pelos dados informados.</p><Link className="gold-button" href="/">Voltar ao PCH News</Link></div>:<form onSubmit={submit}><div className="public-form-heading"><span className="public-kicker">FALE COM O COMERCIAL</span><h2>Solicitar proposta</h2><p>Campos com * são obrigatórios.</p></div><div className="public-form-two"><label>Empresa / marca *<input required value={form.business} onChange={e=>update("business",e.target.value)} /></label><label>Responsável *<input required value={form.contactName} onChange={e=>update("contactName",e.target.value)} /></label></div><div className="public-form-two"><label>E-mail *<input required type="email" value={form.email} onChange={e=>update("email",e.target.value)} /></label><label>WhatsApp / telefone *<input required value={form.phone} onChange={e=>update("phone",e.target.value)} /></label></div><div className="public-form-two"><label>Cidade / UF<input value={form.city} onChange={e=>update("city",e.target.value)} /></label><label>Site / redes sociais<input value={form.website} onChange={e=>update("website",e.target.value)} placeholder="https://..." /></label></div><div className="public-form-two"><label>Tipo de divulgação<select value={form.adType} onChange={e=>update("adType",e.target.value)}>{formats.map(f=><option key={f}>{f}</option>)}</select></label><label>Período desejado<input value={form.period} onChange={e=>update("period",e.target.value)} placeholder="Ex.: outubro / 30 dias" /></label></div><label>Como prefere pagar? *<select value={form.payment} onChange={e=>update("payment",e.target.value)}>{payments.map(p=><option key={p}>{p}</option>)}</select><small className="field-note">O pagamento só acontece depois que você aprovar a proposta.</small></label><label>Faixa de investimento (opcional)<input value={form.budget} onChange={e=>update("budget",e.target.value)} placeholder="Ex.: a partir de R$ 500" /></label><label>Como será a arte da campanha? *<select value={form.creativeNeed} onChange={e=>updateCreativeNeed(e.target.value)}><option value="no_artwork_yet">Ainda não tenho a arte</option><option value="client_artwork">Vou enviar minha própria arte</option><option value="pch_creation">Quero que o PCH News crie a arte</option></select><small className="field-note">Se você já tiver a arte, pode enviar abaixo. Se não tiver, marque que precisa de criação para a equipe comercial considerar esse serviço na proposta.</small></label><div className="banner-upload-box"><span><strong>Logo / arte da campanha</strong></span><span>Opcional · JPG, PNG, WebP ou GIF · até 5 MB</span><label className="secondary-cta banner-upload-button"><Upload size={15}/>{assetUploading?"Enviando…":"Enviar arquivo"}<input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={e=>{const file=e.target.files?.[0];if(file)void uploadCreative(file);e.currentTarget.value="";}} disabled={assetUploading} hidden/></label>{form.creativeUrl&&<><img className="banner-art-preview" src={form.creativeUrl} alt="Arte enviada"/><button type="button" className="banner-clear-button" onClick={()=>update("creativeUrl","")}><X size={14}/> Remover arquivo</button></>}</div><label>Link de destino do anúncio (opcional)<input type="url" value={form.destinationUrl} onChange={e=>update("destinationUrl",e.target.value)} placeholder="https://site.com.br/pagina-de-vendas ou link para download"/><small className="field-note">É o endereço que o leitor abrirá ao clicar no anúncio. Pode ser site, página de vendas, WhatsApp ou download.</small></label><label>Briefing / mensagem *<textarea required minLength={10} rows={6} value={form.message} onChange={e=>update("message",e.target.value)} placeholder="Conte o que deseja divulgar, objetivo da campanha e informações importantes." /></label><label className="consent-check"><input required type="checkbox" checked={form.consent} onChange={e=>update("consent",e.target.checked)}/><span>Autorizo o PCH News a utilizar estes dados para responder à minha solicitação comercial.</span></label>{create.isError&&<div className="form-error">{create.error.message||"Não foi possível enviar agora. Tente novamente."}</div>}<button className="gold-button" type="submit" disabled={create.isPending}><Send size={16}/>{create.isPending?"Enviando…":"Enviar solicitação"}</button></form>}</div>
      </section>
    </main><PublicFooter/>
  </div>;
}
