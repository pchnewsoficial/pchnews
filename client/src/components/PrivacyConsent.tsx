import { useEffect, useState } from "react";
import { Settings2, ShieldCheck, X } from "lucide-react";
import { Link } from "wouter";
import { readPrivacyConsent, savePrivacyConsent, type PrivacyConsent } from "@/lib/privacyConsent";

declare global {
  interface Window {
    clarity?: (command: string, ...args: any[]) => void;
  }
}

function applyClarityConsent(consent: PrivacyConsent) {
  if (typeof window === "undefined" || typeof window.clarity !== "function") return;
  window.clarity("consentv2", {
    ad_Storage: consent.advertising ? "granted" : "denied",
    analytics_Storage: consent.analytics ? "granted" : "denied",
  });
}

export default function PrivacyConsent() {
  const [consent, setConsent] = useState<PrivacyConsent | null>(() => readPrivacyConsent());
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [analytics, setAnalytics] = useState(() => readPrivacyConsent()?.analytics ?? false);
  const [advertising, setAdvertising] = useState(() => readPrivacyConsent()?.advertising ?? false);

  useEffect(() => {
    const onConsent = (event: Event) => {
      const next = (event as CustomEvent<PrivacyConsent>).detail || readPrivacyConsent();
      setConsent(next);
      setAnalytics(next?.analytics ?? false);
      setAdvertising(next?.advertising ?? false);
    };
    window.addEventListener("pch-privacy-consent", onConsent); const openSettings = () => setSettingsOpen(true); window.addEventListener("pch-open-privacy-settings", openSettings);
    return () => { window.removeEventListener("pch-privacy-consent", onConsent); window.removeEventListener("pch-open-privacy-settings", openSettings); };
  }, []);

  const commit = (nextAnalytics: boolean, nextAdvertising: boolean) => {
    const next = savePrivacyConsent({ analytics: nextAnalytics, advertising: nextAdvertising });
    setConsent(next);
    setSettingsOpen(false);
    applyClarityConsent(next);
  };

  // Once consent has been saved, the consent bar must stay completely hidden.
  // It can only be reopened intentionally from the footer.
  if (consent && !settingsOpen) return null;

  return (
    <div className="privacy-consent" role="dialog" aria-modal="true" aria-label="Preferências de privacidade">
      <div className="privacy-consent-copy">
        <div className="privacy-consent-title"><ShieldCheck size={18} /> Sua privacidade importa</div>
        <p>Usamos tecnologias necessárias para o funcionamento do site. Analytics e publicidade não necessários ficam desativados até sua escolha.</p>
        <div className="privacy-consent-links"><Link href="/privacidade">Política de Privacidade</Link><Link href="/cookies">Política de Cookies</Link></div>
      </div>
      <div className="privacy-consent-actions">
        {settingsOpen && <div className="privacy-consent-options">
          <label><input type="checkbox" checked={analytics} onChange={(e) => setAnalytics(e.target.checked)} /> Analytics / desempenho</label>
          <label><input type="checkbox" checked={advertising} onChange={(e) => setAdvertising(e.target.checked)} /> Publicidade personalizada</label>
        </div>}
        {settingsOpen ? <button type="button" className="privacy-btn primary" onClick={() => commit(analytics, advertising)}>Salvar preferências</button> : <>
          <button type="button" className="privacy-btn ghost" onClick={() => commit(false, false)}>Recusar não necessários</button>
          <button type="button" className="privacy-btn outline" onClick={() => setSettingsOpen(true)}><Settings2 size={14} /> Configurar</button>
          <button type="button" className="privacy-btn primary" onClick={() => commit(true, false)}>Aceitar analytics</button>
        </>}
        {settingsOpen && <button type="button" className="privacy-close" aria-label="Fechar preferências" onClick={() => setSettingsOpen(false)}><X size={16} /></button>}
      </div>
    </div>
  );
}
