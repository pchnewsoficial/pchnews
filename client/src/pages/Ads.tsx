import { useState } from "react";
import { Megaphone, Upload, X, ShieldCheck, ExternalLink } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function Ads({ notify }:{notify:(message:string)=>void}) {
 const requests=trpc.adRequests.list.useQuery(undefined,{refetchInterval:30000});
 const update=trpc.adRequests.update.useMutation({onSuccess:()=>{void requests.refetch();notify("Solicitação atualizada.");}});
 const campaigns=trpc.ads.list.useQuery(undefined,{retry:false,refetchInterval:30000});
 const createCampaign=trpc.ads.create.useMutation({onSuccess:()=>{void campaigns.refetch();notify("Campanha cadastrada e salva no banco.");}});
 const updateCampaign=trpc.ads.update.useMutation({onSuccess:()=>{void campaigns.refetch();notify("Campanha atualizada.");}});
 const mediaUpload=trpc.media.upload.useMutation();
 const [bannerUploading,setBannerUploading]=useState(false);
 const [campaignForm,setCampaignForm]=useState({id:"",advertiserCompany:"",name:"",adType:"Banner lateral",creativeUrl:"",destinationUrl:"",targetScope:"national",region:"",state:"",startsAtMs:null as number|null,endsAtMs:null as number|null,status:"draft" as "draft"|"approved"|"active"|"paused"|"finished"});

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

 const saveCampaign=(event:any)=>{
  event.preventDefault();
  const payload={...campaignForm,creativeUrl:campaignForm.creativeUrl||null,destinationUrl:campaignForm.destinationUrl||null,region:campaignForm.region||null,state:campaignForm.state||null};
  if(campaignForm.id) updateCampaign.mutate(payload as any); else createCampaign.mutate(payload as any);
 };
 const publishCampaignNow=()=>{
  if(!campaignForm.advertiserCompany.trim()||!campaignForm.name.trim()||!campaignForm.adType.trim()){notify("Preencha empresa, nome da campanha e tipo antes de publicar.");return;}
  const now=Date.now();
  const payload={...campaignForm,status:"active" as const,startsAtMs:campaignForm.startsAtMs??now,creativeUrl:campaignForm.creativeUrl||null,destinationUrl:campaignForm.destinationUrl||null,region:campaignForm.region||null,state:campaignForm.state||null};
  if(campaignForm.id) updateCampaign.mutate(payload as any); else createCampaign.mutate(payload as any);
  notify("Campanha enviada para publicação imediata.");
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
    <select value={item.status} onChange={e=>update.mutate({id:item.id,status:e.target.value as any})}><option value="received">Recebido</option><option value="reviewing">Em análise</option><option value="approved">Aprovado</option></select>
   </div>):<div className="media-empty compact-empty">Nenhuma solicitação comercial registrada.</div>}
  </section>

  <section className="panel ad-requests">
   <div className="panel-heading"><div><span className="admin-kicker">GESTÃO DIRETA</span><h2>Criar campanha</h2></div><span>{campaigns.data?.length||0} campanha(s)</span></div>
   <p className="field-note">Use este formulário quando a equipe já tiver as informações do anunciante. Você pode colar uma URL ou enviar a arte diretamente.</p>
   <form className="ad-form" onSubmit={saveCampaign}>
    <div className="form-two"><label>Empresa anunciante<input required value={campaignForm.advertiserCompany} onChange={e=>setCampaignForm({...campaignForm,advertiserCompany:e.target.value})}/></label><label>Nome da campanha<input required value={campaignForm.name} onChange={e=>setCampaignForm({...campaignForm,name:e.target.value})}/></label></div>
    <div className="form-two"><label>Tipo<select value={campaignForm.adType} onChange={e=>setCampaignForm({...campaignForm,adType:e.target.value})}><option>Banner lateral</option><option>Banner mobile</option><option>Banner destaque</option><option>Patrocínio</option></select></label><label>Status<select value={campaignForm.status} onChange={e=>setCampaignForm({...campaignForm,status:e.target.value as any})}><option value="draft">Rascunho</option><option value="approved">Aprovado</option><option value="active">Ativo</option><option value="paused">Pausado</option><option value="finished">Finalizado</option></select></label></div>
    <label>Arte do banner<input type="url" value={campaignForm.creativeUrl} onChange={e=>setCampaignForm({...campaignForm,creativeUrl:e.target.value})} placeholder="URL da imagem/arte ou envie a arte abaixo"/></label>
    <div className="banner-upload-box"><label className="secondary-cta banner-upload-button"><Upload size={15}/>{bannerUploading?"Enviando arte…":"Enviar arte do banner"}<input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={e=>{const file=e.target.files?.[0];if(file)void uploadBanner(file);e.currentTarget.value="";}} disabled={bannerUploading} hidden/></label><span>JPG, PNG, WebP ou GIF · até 5 MB</span>{campaignForm.creativeUrl&&<button type="button" className="banner-clear-button" onClick={()=>setCampaignForm({...campaignForm,creativeUrl:""})}><X size={14}/> Remover</button>}</div>
    {campaignForm.creativeUrl&&<div className="banner-art-preview"><img src={campaignForm.creativeUrl} alt="Prévia da arte da campanha"/><span>Prévia da peça</span></div>}
    <div className="form-two"><label>Início<input type="datetime-local" value={campaignForm.startsAtMs?new Date(campaignForm.startsAtMs).toISOString().slice(0,16):""} onChange={e=>setCampaignForm({...campaignForm,startsAtMs:e.target.value?new Date(e.target.value).getTime():null})}/></label><label>Fim<input type="datetime-local" value={campaignForm.endsAtMs?new Date(campaignForm.endsAtMs).toISOString().slice(0,16):""} onChange={e=>setCampaignForm({...campaignForm,endsAtMs:e.target.value?new Date(e.target.value).getTime():null})}/></label></div>
    <div className="form-two"><label>Região<input value={campaignForm.region} onChange={e=>setCampaignForm({...campaignForm,region:e.target.value})}/></label><label>Estado<input value={campaignForm.state} onChange={e=>setCampaignForm({...campaignForm,state:e.target.value})}/></label></div>
    <div className="form-two"><button className="secondary-cta" type="submit" disabled={createCampaign.isPending||updateCampaign.isPending}>Salvar {campaignForm.id?"alterações":"rascunho"}</button><button className="primary-cta" type="button" onClick={publishCampaignNow} disabled={createCampaign.isPending||updateCampaign.isPending}><Megaphone size={15}/> Publicar agora</button></div>
   </form>
   <div className="ad-requests">{campaigns.data?.map((item:any)=><div className="ad-request" key={item.id}><div><strong>{item.name}</strong><small>{item.advertiserCompany||"Anunciante não informado"} · {item.adType} · {item.status}</small></div><button type="button" className="secondary-cta" onClick={()=>setCampaignForm({...campaignForm,...item,advertiserCompany:item.advertiserCompany||"",creativeUrl:item.creativeUrl||"",destinationUrl:item.destinationUrl||"",region:item.region||"",state:item.state||""})}>Editar</button></div>)}</div>
  </section>
 </div>;
}
