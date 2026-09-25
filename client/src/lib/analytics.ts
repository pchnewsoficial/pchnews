/**
 * Microsoft Clarity integration (official @microsoft/clarity SDK).
 * - Only initializes when VITE_CLARITY_PROJECT_ID is set.
 * - Consent: if VITE_CLARITY_REQUIRE_CONSENT === "true", Clarity loads but waits for
 *   setAnalyticsConsent(true) (Clarity consent API). Otherwise it follows Clarity's default mode.
 * - Never send PII, form text, tokens or free text: only whitelisted event names and short slug-like tags.
 */
import Clarity from "@microsoft/clarity";

export type PchEvent = "article_view" | "article_publish" | "search" | "category_view" | "newsletter_click" | "page_view";

let started = false;
const projectId = (import.meta.env.VITE_CLARITY_PROJECT_ID as string | undefined)?.trim();
const requireConsent = import.meta.env.VITE_CLARITY_REQUIRE_CONSENT === "true";

export function initAnalytics() {
  if (started || !projectId || typeof window === "undefined") return;
  try {
    Clarity.init(projectId);
    if (requireConsent) Clarity.consentV2?.({ ad_Storage: "denied", analytics_Storage: "denied" });
    started = true;
  } catch (error) {
    console.warn("[Clarity] init failed", error);
  }
}

export function setAnalyticsConsent(granted: boolean) {
  if (!started) return;
  const v = granted ? "granted" : "denied";
  Clarity.consentV2?.({ ad_Storage: "denied", analytics_Storage: v });
}

/** Keeps tag values safe: short, no emails, no whitespace-heavy free text. */
export function safeTag(value: string): string {
  return value.toLowerCase().replace(/[^\w/-]+/g, "-").replace(/-+/g, "-").slice(0, 60);
}

export function trackEvent(name: PchEvent, tags: Record<string, string> = {}) {
  if (!started) return;
  try {
    for (const [k, v] of Object.entries(tags)) if (v && !v.includes("@")) Clarity.setTag(k, safeTag(v));
    Clarity.event(name);
  } catch { /* analytics must never break the app */ }
}

export const analyticsEnabled = () => started;
