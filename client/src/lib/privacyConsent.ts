export type PrivacyConsent = {
  necessary: true;
  analytics: boolean;
  advertising: boolean;
  updatedAt: string;
};

export const PRIVACY_CONSENT_KEY = "pch-news-privacy-consent-v1";

export function readPrivacyConsent(): PrivacyConsent | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(PRIVACY_CONSENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PrivacyConsent>;
    if (typeof parsed.analytics !== "boolean" || typeof parsed.advertising !== "boolean") return null;
    return { necessary: true, analytics: parsed.analytics, advertising: parsed.advertising, updatedAt: parsed.updatedAt || new Date().toISOString() };
  } catch {
    return null;
  }
}

export function savePrivacyConsent(input: Pick<PrivacyConsent, "analytics" | "advertising">): PrivacyConsent {
  const consent: PrivacyConsent = { necessary: true, analytics: Boolean(input.analytics), advertising: Boolean(input.advertising), updatedAt: new Date().toISOString() };
  if (typeof window !== "undefined") {
    window.localStorage.setItem(PRIVACY_CONSENT_KEY, JSON.stringify(consent));
    window.dispatchEvent(new CustomEvent("pch-privacy-consent", { detail: consent }));
  }
  return consent;
}

export function clearPrivacyConsent() {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(PRIVACY_CONSENT_KEY);
    window.dispatchEvent(new Event("pch-privacy-consent"));
  }
}
