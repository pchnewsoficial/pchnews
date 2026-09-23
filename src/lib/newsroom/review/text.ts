export const paragraphs = (body: string) =>
  body
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

export const isHeading = (p: string) => p.startsWith("## ");

export const words = (text: string) => text.split(/\s+/).filter(Boolean);

export const sentences = (text: string) =>
  (text.match(/[^.!?]+[.!?]+["”]?|[^.!?]+$/g) ?? []).map((s) => s.trim()).filter(Boolean);

export function clip(text: string, max = 180) {
  return text.length > max ? `${text.slice(0, max).trimEnd()}…` : text;
}

export function snippet(text: string, index: number, length: number) {
  const start = Math.max(0, index - 50);
  const end = Math.min(text.length, index + length + 50);
  return `${start > 0 ? "…" : ""}${text.slice(start, end)}${end < text.length ? "…" : ""}`;
}

/** Regex com limites de palavra que funcionam com acentos. */
export function wordRe(source: string) {
  return new RegExp(`(?<![\\p{L}\\p{N}])(?:${source})(?![\\p{L}\\p{N}])`, "giu");
}

export function matchCase(original: string, replacement: string) {
  const first = original.charAt(0);
  const isUpper = first !== first.toLowerCase() && first === first.toUpperCase();
  return isUpper ? replacement.charAt(0).toUpperCase() + replacement.slice(1) : replacement;
}

export function quoteRanges(text: string): Array<[number, number]> {
  return [...text.matchAll(/["“][^"”]*["”]/g)].map((m) => [m.index ?? 0, (m.index ?? 0) + m[0].length]);
}

export const inRanges = (ranges: Array<[number, number]>, index: number) =>
  ranges.some(([start, end]) => index >= start && index < end);
