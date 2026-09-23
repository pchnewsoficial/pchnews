import type { EditorArticle } from "@/lib/newsroom/types";
import { isHeading, paragraphs, sentences, words } from "@/lib/newsroom/review/text";
import { isCleanSlug, normalizeText } from "@/lib/slug";

export type CheckState = "ok" | "alerta" | "erro";
export interface SeoCheck {
  id: string;
  label: string;
  state: CheckState;
  detail: string;
}

const STOPWORDS = new Set(
  "a o as os de da do das dos e em no na nos nas um uma uns umas por para com sem sobre entre ate apos que se sua seu suas seus ao aos mais menos como pelo pela pelos pelas ja nao sao foi ser tem esta este essa esse isso isto muito ainda deve pode faz fazer anos ano dia dias diz disse".split(
    " ",
  ),
);

export const SEO_TITLE_MAX = 60;
export const DESC_MIN = 70;
export const DESC_MAX = 160;

export const effectiveSeoTitle = (a: EditorArticle) => a.seo.title.trim() || a.title.trim();
export const firstParagraph = (a: EditorArticle) =>
  paragraphs(a.body).find((p) => !isHeading(p)) ?? "";
export const effectiveDescription = (a: EditorArticle) =>
  a.seo.description.trim() || a.excerpt.trim() || suggestMetaDescription(a);

function cutAtWord(text: string, max: number) {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  return cut.slice(0, cut.lastIndexOf(" ")).replace(/[,;:\s]+$/, "");
}

export function suggestSeoTitle(a: EditorArticle) {
  return cutAtWord(a.title.trim().replace(/\.+$/, ""), SEO_TITLE_MAX - 2);
}

export function suggestMetaDescription(a: EditorArticle) {
  const source = a.subtitle.trim() || firstParagraph(a);
  let out = "";
  for (const s of sentences(source)) {
    if ((out + " " + s).trim().length > 155) break;
    out = (out + " " + s).trim();
  }
  if (!out) out = `${cutAtWord(source, 152)}…`;
  if (out.length < DESC_MIN && a.excerpt) out = cutAtWord(`${out} ${a.excerpt}`, 155);
  return out;
}

export function suggestKeyword(a: EditorArticle) {
  const tokens = (t: string) =>
    normalizeText(t)
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 3 && !STOPWORDS.has(w));
  const body = ` ${tokens(a.body).join(" ")} `;
  const titleTokens = tokens(a.title);
  // Bigrama do título que também aparece no texto.
  for (let i = 0; i < titleTokens.length - 1; i++) {
    const pair = `${titleTokens[i]} ${titleTokens[i + 1]}`;
    if (body.includes(` ${pair} `)) return originalForm(a, pair);
  }
  const freq = new Map<string, number>();
  for (const w of [...titleTokens, ...titleTokens, ...tokens(a.body)]) freq.set(w, (freq.get(w) ?? 0) + 1);
  const top = [...freq.entries()].sort((x, y) => y[1] - x[1])[0]?.[0] ?? "";
  return originalForm(a, top);
}

/** Recupera a grafia acentuada original do termo normalizado. */
function originalForm(a: EditorArticle, normalized: string) {
  if (!normalized) return "";
  const text = `${a.title} ${a.body}`;
  const parts = normalized.split(" ");
  const re = new RegExp(parts.map(() => "([\\p{L}\\p{N}]+)").join("[\\s\\p{P}]+"), "gu");
  for (const m of text.matchAll(re)) {
    if (normalizeText(m.slice(1).join(" ")) === normalized) return m.slice(1).join(" ").toLowerCase();
  }
  return normalized;
}

export function includesTerm(text: string, term: string) {
  return normalizeText(text).includes(normalizeText(term));
}

export function auditArticleSeo(a: EditorArticle): SeoCheck[] {
  const title = effectiveSeoTitle(a);
  const desc = a.seo.description.trim() || a.excerpt.trim();
  const kw = a.seo.keyword.trim();
  const totalWords = words(a.body).length;
  const checks: SeoCheck[] = [];
  const push = (id: string, label: string, state: CheckState, detail: string) =>
    checks.push({ id, label, state, detail });

  push(
    "title",
    "Title tag",
    !title ? "erro" : title.length > SEO_TITLE_MAX || title.length < 25 ? "alerta" : "ok",
    !title
      ? "Sem título."
      : `${title.length} caracteres${a.seo.title ? "" : " (herdado do título)"}. Ideal: até ${SEO_TITLE_MAX} para reduzir cortes.`,
  );
  push(
    "description",
    "Meta description",
    !desc ? "erro" : desc.length < DESC_MIN || desc.length > DESC_MAX ? "alerta" : "ok",
    !desc
      ? "Ausente — o Google escolherá um trecho da página."
      : `${desc.length} caracteres${a.seo.description ? "" : " (usando o resumo)"}. Faixa recomendada: ${DESC_MIN}–${DESC_MAX}.`,
  );
  push(
    "slug",
    "URL limpa",
    !a.slug ? "erro" : !isCleanSlug(a.slug) || a.slug.length > 80 ? "alerta" : "ok",
    a.slug ? `/noticia/${a.slug}` : "Slug vazio.",
  );
  push("keyword", "Tema principal definido", kw ? "ok" : "alerta", kw || "Defina o tema para orientar título e lide.");
  if (kw) {
    push("kw-title", "Tema no título", includesTerm(title, kw) ? "ok" : "alerta", `“${kw}” ${includesTerm(title, kw) ? "presente" : "ausente"} na title tag.`);
    push("kw-lead", "Tema no lide", includesTerm(firstParagraph(a), kw) ? "ok" : "alerta", "O primeiro parágrafo deve tratar do tema principal.");
  }
  push("image", "Imagem principal (Open Graph)", a.image ? "ok" : "erro", a.image ? "Usada no card social e no NewsArticle." : "Sem imagem: compartilhamentos ficam sem prévia.");
  push("alt", "Texto alternativo da imagem", !a.image ? "alerta" : a.imageAlt.trim() ? "ok" : "alerta", a.imageAlt.trim() || "Descreva o que a foto mostra.");
  push(
    "headings",
    "Intertítulos",
    totalWords > 450 && !paragraphs(a.body).some(isHeading) ? "alerta" : "ok",
    `${totalWords} palavras no texto.`,
  );
  push(
    "index",
    "Indexação",
    a.status === "publicado" && !a.seo.index ? "erro" : "ok",
    a.status !== "publicado"
      ? "Não publicada: fica fora do sitemap e não é indexável."
      : a.seo.index
        ? "index, follow — incluída no sitemap."
        : "Publicada com noindex: não aparecerá na busca.",
  );
  push(
    "canonical",
    "Canonical",
    a.seo.canonical && !/^https:\/\//.test(a.seo.canonical) ? "alerta" : "ok",
    a.seo.canonical || "Automático: aponta para a própria URL da matéria.",
  );
  return checks;
}

export function seoScore(checks: SeoCheck[]) {
  if (!checks.length) return 0;
  const points = checks.reduce((sum, c) => sum + (c.state === "ok" ? 1 : c.state === "alerta" ? 0.5 : 0), 0);
  return Math.round((points / checks.length) * 100);
}
