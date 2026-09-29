import { useState } from "react";
import { CheckCircle2, FileText, ShieldCheck } from "lucide-react";
import { Link } from "wouter";

export const PCH_EDITORIAL_TERMS_VERSION = "2026-09-v1";
export const PCH_EDITORIAL_TERMS_ID = "pch-editorial-terms-v1";

export default function EditorialTermsAcceptance({ onAccepted }: { onAccepted?: (accepted: boolean) => void }) {
  const [confidentiality, setConfidentiality] = useState(false);
  const [partnership, setPartnership] = useState(false);
  const accepted = confidentiality && partnership;

  const update = (kind: "confidentiality" | "partnership", value: boolean) => {
    if (kind === "confidentiality") setConfidentiality(value);
    else setPartnership(value);
    const next = kind === "confidentiality" ? value && partnership : confidentiality && value;
    onAccepted?.(next);
  };

  return <div className="editorial-responsibility-box">
    <div className="editorial-responsibility-heading">
      <ShieldCheck size={18} />
      <div><strong>Termos de participação PCH News</strong><small>Versão {PCH_EDITORIAL_TERMS_VERSION}</small></div>
    </div>
    <p className="terms-acceptance-intro">A proposta do PCH News é preservar a voz de cada colaborador e, ao mesmo tempo, manter um padrão editorial comum: responsabilidade, clareza, contexto e busca pelo que existe além da notícia.</p>
    <label className="editorial-responsibility-check">
      <input type="checkbox" checked={confidentiality} onChange={(e) => update("confidentiality", e.target.checked)} />
      <span><strong>Li e concordo com o Termo de Confidencialidade e Confiabilidade.</strong><br />Comprometo-me a proteger informações internas, pautas, materiais não publicados, acessos e dados a que eu tenha acesso em razão da participação no PCH News.</span>
    </label>
    <label className="editorial-responsibility-check">
      <input type="checkbox" checked={partnership} onChange={(e) => update("partnership", e.target.checked)} />
      <span><strong>Li e concordo com o Termo de Participação e Parceria Editorial.</strong><br />Entendo que a participação é voluntária, sem cobrança ou promessa atual de remuneração, e que posso escrever com minha própria linguagem dentro dos princípios editoriais do PCH News.</span>
    </label>
    <div className="terms-acceptance-links"><FileText size={14} /><Link href="/principios-editoriais">Ler os princípios editoriais e os termos completos</Link></div>
    {accepted && <div className="editorial-responsibility-ok"><CheckCircle2 size={14} /> Os dois termos foram aceitos e serão registrados com a versão correspondente.</div>}
  </div>;
}
