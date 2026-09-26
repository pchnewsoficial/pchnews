import { useState } from "react";
import { CheckCircle2, ShieldCheck } from "lucide-react";

export const EDITORIAL_RESPONSIBILITY_VERSION = "2026-09-v1";

export default function EditorialResponsibility({ required = true, onAccepted }: { required?: boolean; onAccepted?: (accepted: boolean) => void }) {
  const [accepted, setAccepted] = useState(false);
  const toggle = (value: boolean) => { setAccepted(value); onAccepted?.(value); };
  return <div className="editorial-responsibility-box">
    <div className="editorial-responsibility-heading"><ShieldCheck size={18} /><div><strong>Responsabilidade pelo material enviado</strong><small>Versão {EDITORIAL_RESPONSIBILITY_VERSION}</small></div></div>
    <label className="editorial-responsibility-check">
      <input type="checkbox" checked={accepted} onChange={(e) => toggle(e.target.checked)} required={required} />
      <span>Declaro que sou responsável pelas informações, textos, imagens e demais materiais que eu enviar ao PCH News, que possuo as autorizações e direitos necessários e que me comprometo com a veracidade, legalidade e respeito aos direitos de terceiros. Estou ciente de que o PCH News poderá revisar, editar, identificar, suspender ou retirar conteúdo conforme suas regras editoriais e a legislação aplicável.</span>
    </label>
    {accepted && <div className="editorial-responsibility-ok"><CheckCircle2 size={14} /> Declaração registrada no aceite/publicação.</div>}
  </div>;
}
