type ClarityCommand = "event" | "set" | "identify" | "consentv2" | "consent";

declare global {
  interface Window { clarity?: (command: ClarityCommand, ...args: string[]) => void; }
}

let initialized = false;

export function initClarity(analytics = false, advertising = false) {
  if (initialized || typeof window === 'undefined') return;
  const projectId = import.meta.env.VITE_CLARITY_PROJECT_ID as string | undefined;
  if (!projectId) return;
  const w = window as Window;
  if (!w.clarity) {
    const clarityStub = ((...args: string[]) => {
      const queue = clarityStub as unknown as { q?: unknown[] };
      queue.q = queue.q || [];
      queue.q.push(args);
    }) as unknown as NonNullable<Window["clarity"]> & { q?: unknown[] };
    w.clarity = clarityStub;
  }
  const script = document.createElement('script');
  script.async = true;
  script.src = "https://www.clarity.ms/tag/" + encodeURIComponent(projectId);
  script.dataset.pchClarity = 'true';
  document.head.appendChild(script);
  initialized = true;
  applyClarityConsent(analytics, advertising);
}

export function applyClarityConsent(analytics: boolean, advertising: boolean) {
  if (typeof window !== "undefined" && window.clarity) {
    window.clarity("consentv2", {
      ad_Storage: advertising ? "granted" : "denied",
      analytics_Storage: analytics ? "granted" : "denied",
    } as any);
  }
}

export function clarityEvent(name: string) {
  if (typeof window !== 'undefined' && window.clarity) window.clarity('event', name);
}