import { useState } from "react";
import { Megaphone, Upload, X, ShieldCheck, ExternalLink } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function Ads({ notify }:{notify:(message:string)=>void}) {
 const requests=trpc.adRequests.list.useQuery(undefined,{refetchInterval:30000});
 const update=trpc.adRequests.update.useMutation({onSuccess:()=>{void requests.refetch();notify("Solicitação atualizada.");}});
 const campaigns=trpc.ads.list.useQuery(undefined,{retry:false,refetchInterval:30000});
 const createCampaign=trpc.ads.create.useMutation({onSuccess:async(result:any)=>{await campaigns.refetch();if(result?.id){setCampaignForm(current=>({...current,...result,id:String(result.id),advertiserCompany:current.advertiserCompany,status:result.status}));}notify(result?.status==="active"?`Campanha publicada no site público (ID: ${result?.id||"ok"}).`:"Campanha cadastrada e salva no banco.");},onError:(error)=>notify(`Não foi possível publicar a campanha: ${error.message||"erro desconhecido"}`)});
 const updateCampaign=trpc.ads.update.useMutation({onSuccess:async(result:any)=>{await campaigns.refetch();if(result?.id){setCampaignForm(current=>({...current,...result,id:String(result.id),advertiserCompany:current.advertiserCompany,status:result.status}));}notify(result?.status==="active"?`Campanha publicada/atualizada no site público (ID: ${result?.id||"ok"}).`:"Campanha atualizada.");},onError:(error)=>notify(`Não foi possível salvar a campanha: ${error.message||"erro desconhecido"}`)});
 const mediaUpload=trpc.adRequests.uploadAsset.useMutation();
 const [bannerUploading,setBannerUploading]=useState(false);
 const [campaignForm,setCampaignForm]=useState({id:"",advertiserCompany:"",name:"",adType:"Banner lateral",creativeUrl:"",destinationUrl:"",targetScope:"national",placementId:"home-main",country:"BR",city:"",region:"",state:"",priority:0,startsAtMs:null as number|null,endsAtMs:null as number|null,status:"draft" as "draft"|"scheduled"|"active"|"paused"|"finished"});

 const uploadBanner=async(file:File)=>{
  const allowed=["image/png","image/jpeg","image/webp","image/gif"];
  if(!allowed.includes(file.type)){notify("Use uma imagem JPG, PNG, WebP ou GIF.");return;}
  if(file.size>5*1024*1024){notify("A arte deve ter no máximo 5 MB.");return;}
  setBannerUploading(true);
  try{
   const bytes=new Uint8Array(await file.arrayBuffer()); let binary="";
   bytes.forEach(byte=>{binary+=String.fromCharCode(byte);});
   const result=await mediaUpload.mutateAsync({fileName:file.name,contentType:file.type as "image/png"|"image/jpeg"|"image/webp"|"image/gif",base64:btoa(binary)});
   setCampaignForm(current=>({...current,creativeUrl:result.url}));
   notify("Arte da campanha enviada com sucesso.");
  }catch(error){notify(error instanceof Error?error.message:"Não foi possível enviar a arte.");}
  finally{setBannerUploading(false);}
 };

 const buildCampaignPayload=(status?: "draft"|"scheduled"|"active"|"paused"|"finished")=>{
  const { id, ...form } = campaignForm;
  const base={...form, ...(status ? {status} : {}), creativeUrl:campaignForm.creativeUrl||null, destinationUrl:campaignForm.destinationUrl||null, region:campaignForm.region||null, state:campaignForm.state||null};
  return campaignForm.id ? {...base,id:campaignForm.id} : base;
 };
 const saveCampaign=(event:any)=>{
  event.preventDefault();
  const payload=buildCampaignPayload();
  if(campaignForm.id) updateCampaign.mutate(payload as any); else createCampaign.mutate(payload as any);
 };
 const publishCampaignNow=()=>{
  if(!campaignForm.advertiserCompany.trim()||!campaignForm.name.trim()||!campaignForm.adType.trim()){notify("Preencha empresa, nome da campanha e tipo antes de publicar.");return;}
  const now=Date.now();
  const payload=buildCampaignPayload("active");
  payload.startsAtMs=campaignForm.startsAtMs??now;
  if(campaignForm.id) updateCampaign.mutate(payload as any); else createCampaign.mutate(payload as any);
 };

 return <div className="ads-page">
  <div className="admin-heading compact">
   <div><span className="admin-kicker">MONETIZAÇÃO EDITORIAL</span><h1>Anúncios<span>.</span></h1><p>Crie campanhas diretamente aqui ou analise solicitações recebidas pelo comercial.</p></div>
   <span className="ad-safe-badge"><ShieldCheck size={15}/> Sem cobrança automática</span>
  </div>

  <section className="panel ad-requests">
   <div className="panel-heading"><div><span className="admin-kicker">CRM COMERCIAL</span><h2>Solicitações recebidas</h2></div><span>{requests.data?.length||0} registro(s)</span></div>
   <p className="field-note">Os pedidos vêm da área pública <strong>/anuncie</strong>. O cliente pode informar a arte própria ou pedir criação pelo PCH News.</p>
   {requests.isLoading?<div className="media-empty compact-empty">Carregando solicitações…</div>:requests.data?.length?requests.data.map((item:any)=><div className="ad-request" key={item.id}>
    <div><strong>{item.business}</strong><small>{item.contactName} · {item.email} · {item.phone}</small><small>{item.adType} · {item.city||"Local não informado"} · {item.period||"Período não informado"}</small><small>{item.creativeNeed==="pch_creation"?"🎨 Cliente pediu criação da arte":item.creativeNeed==="client_artwork"?"🖼️ Cliente enviou/pretende enviar arte própria":"📝 Ainda não definiu a arte"}</small>{item.creativeUrl&&<a href={item.creativeUrl} target="_blank" rel="noreferrer"><ExternalLink size={13}/> Ver arte enviada</a>}{item.destinationUrl&&<a href={item.destinationUrl} target="_blank" rel="noreferrer"><ExternalLink size={13}/> Abrir link de destino</a>}</div>
    <select value={item.status} onChange={e=>update.mutate({id:item.id,status:e.target.value as any})}><option value="received">Recebido</option><option value="reviewing">Em análise</option><option value="scheduled">Agendado</option></select>
   </div>):<div className="media-empty compact-empty">Nenhuma solicitação comercial registrada.</div>}
  </section>

  <section className="panel ad-requests">
   <div className="panel-heading"><div><span className="admin-kicker">GESTÃO DIRETA</span><h2>Criar campanha</h2></div><span>{campaigns.data?.length||0} campanha(s)</span></div>
   <p className="field-note">Use este formulário quando a equipe já tiver as informações do anunciante. <strong>Cada posição é inventário separado</strong> e pode ser vendida novamente para outra região. Ex.: o mesmo Banner pequeno 1 pode entregar uma campanha para São Paulo e outra para outro estado/cidade, automaticamente conforme a localização aproximada do visitante.  A arte é o que aparece no banner; o <strong>link de venda / destino</strong> é o endereço que o leitor abrirá ao clicar. Ao publicar como <strong>Ativo</strong>, a campanha fica disponível para o site público.</p>
   <form className="ad-form" onSubmit={saveCampaign}>
    <div className="form-two"><label>Empresa anunciante<input required value={campaignForm.advertiserCompany} onChange={e=>setCampaignForm({...campaignForm,advertiserCompany:e.target.value})}/></label><label>Nome da campanha<input required value={campaignForm.name} onChange={e=>setCampaignForm({...campaignForm,name:e.target.value})}/></label></div>
    <div className="form-two"><label>Tipo<select value={campaignForm.adType} onChange={e=>setCampaignForm({...campaignForm,adType:e.target.value})}><option>Banner lateral</option><option>Banner mobile</option><option>Banner destaque</option><option>Patrocínio</option></select></label><label>Posição comercial<select value={campaignForm.placementId} onChange={e=>setCampaignForm({...campaignForm,placementId:e.target.value})}><option value="home-main">Banner principal</option><option value="home-small-1">Banner pequeno 1</option><option value="home-small-2">Banner pequeno 2</option><option value="home-small-3">Banner pequeno 3</option><option value="home-small-4">Banner pequeno 4</option></select></label></div>
    <div className="form-two"><label>Alcance geográfico<select value={campaignForm.targetScope} onChange={e=>setCampaignForm({...campaignForm,targetScope:e.target.value})}><option value="national">Brasil / nacional</option><option value="country">País</option><option value="state">Estado / região</option><option value="city">Cidade</option></select></label><label>Prioridade<input type="number" min="0" max="100" value={campaignForm.priority} onChange={e=>setCampaignForm({...campaignForm,priority:Number(e.target.value)||0})}/></label></div>
    <div className="form-two"><label>País <span className="field-hint">ISO, ex.: BR</span><input value={campaignForm.country} onChange={e=>setCampaignForm({...campaignForm,country:e.target.value.toUpperCase()})}/></label><label>Cidade-alvo<input value={campaignForm.city} onChange={e=>setCampaignForm({...campaignForm,city:e.target.value})} placeholder="Ex.: Osasco"/></label></div>
    <div className="form-two"><label>Status<select value={campaignForm.status} onChange={e=>setCampaignForm({...campaignForm,status:e.target.value as any})}><option value="draft">Rascunho</option><option value="scheduled">Agendado</option><option value="active">Ativo</option><option value="paused">Pausado</option><option value="finished">Finalizado</option></select></label></div>
    <label>Arte do banner<input type="url" value={campaignForm.creativeUrl} onChange={e=>setCampaignForm({...campaignForm,creativeUrl:e.target.value})} placeholder="URL da imagem/arte ou envie a arte abaixo"/></label>
    <label>Link de venda / destino <span className="field-hint">o endereço que abre quando o leitor clica no anúncio</span><input type="url" value={campaignForm.destinationUrl} onChange={e=>setCampaignForm({...campaignForm,destinationUrl:e.target.value})} placeholder="https://empresa.com.br/oferta"/></label>
    <div className="banner-upload-box"><label className="secondary-cta banner-upload-button"><Upload size={15}/>{bannerUploading?"Enviando arte…":"Enviar arte do banner"}<input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={e=>{const file=e.target.files?.[0];if(file)void uploadBanner(file);e.currentTarget.value="";}} disabled={bannerUploading} hidden/></label><span>JPG, PNG, WebP ou GIF · até 5 MB</span>{campaignForm.creativeUrl&&<button type="button" className="banner-clear-button" onClick={()=>setCampaignForm({...campaignForm,creativeUrl:""})}><X size={14}/> Remover</button>}</div>
    {campaignForm.creativeUrl&&<div className="banner-art-preview"><img src={campaignForm.creativeUrl} alt="Prévia da arte da campanha"/><span>Prévia da peça</span></div>}
    <div className="form-two"><label>Início<input type="datetime-local" value={campaignForm.startsAtMs?new Date(campaignForm.startsAtMs).toISOString().slice(0,16):""} onChange={e=>setCampaignForm({...campaignForm,startsAtMs:e.target.value?new Date(e.target.value).getTime():null})}/></label><label>Fim<input type="datetime-local" value={campaignForm.endsAtMs?new Date(campaignForm.endsAtMs).toISOString().slice(0,16):""} onChange={e=>setCampaignForm({...campaignForm,endsAtMs:e.target.value?new Date(e.target.value).getTime():null})}/></label></div>
    <div className="form-two"><label>Região<input value={campaignForm.region} onChange={e=>setCampaignForm({...campaignForm,region:e.target.value})}/></label><label>Estado<input value={campaignForm.state} onChange={e=>setCampaignForm({...campaignForm,state:e.target.value})}/></label></div>
    <div className="form-two"><button className="secondary-cta" type="submit" disabled={createCampaign.isPending||updateCampaign.isPending}>Salvar {campaignForm.id?"alterações":"rascunho"}</button><button className="primary-cta" type="button" onClick={publishCampaignNow} disabled={createCampaign.isPending||updateCampaign.isPending}><Megaphone size={15}/> Publicar agora</button></div>
   </form>
   <div className="ad-requests">{campaigns.data?.map((item:any)=><div className="ad-request" key={item.id}><div><strong>{item.name}</strong><small>{item.advertiserCompany||"Anunciante não informado"} · {item.adType} · {item.status}</small>{item.destinationUrl&&<a href={item.destinationUrl} target="_blank" rel="noreferrer"><ExternalLink size={13}/> Abrir link de venda / destino</a>}</div><button type="button" className="secondary-cta" onClick={()=>setCampaignForm({...campaignForm,...item,advertiserCompany:item.advertiserCompany||"",creativeUrl:item.creativeUrl||"",destinationUrl:item.destinationUrl||"",region:item.region||"",state:item.state||""})}>Editar</button></div>)}</div>
  </section>
 </div>;
}
