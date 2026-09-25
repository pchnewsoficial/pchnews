type ClarityCommand = "event" | "set" | "identify";

declare global {
  interface Window { clarity?: (command: ClarityCommand, ...args: string[]) => void; }
}

let initialized = false;

export function initClarity() {
  if (initialized || typeof window === 'undefined') return;
  const projectId = import.meta.env.VITE_CLARITY_PROJECT_ID as string | undefined;
  if (!projectId) return;
  const w = window as Window;
  if (!w.clarity) {
    const clarityStub = ((...args: string[]) => {
      const queue = (clarityStub as typeof clarityStub & { q?: unknown[] });
      queue.q = queue.q || [];
      queue.q.push(args);
    }) as typeof w.clarity & { q?: unknown[] };
    w.clarity = clarityStub;
  }
  const script = document.createElement('script');
  script.async = true;
  script.src = "https://www.clarity.ms/tag/" + encodeURIComponent(projectId);
  script.dataset.pchClarity = 'true';
  document.head.appendChild(script);
  initialized = true;
}

export function clarityEvent(name: string) {
  if (typeof window !== 'undefined' && window.clarity) window.clarity('event', name);
}