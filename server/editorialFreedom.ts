/**
 * Liberdade Editorial — PCH News
 * Motor determinístico e auditável de critérios editoriais.
 * Missão: "Informar para que o leitor possa pensar por si mesmo."
 *
 * Princípios:
 * - Nenhuma regra favorece ideologia, partido, governo, oposição ou ator.
 *   Em temas políticos, apenas descreve desequilíbrios de apresentação.
 * - Cada alerta informa a regra que disparou (ruleId) e a evidência textual.
 * - Funciona sem LLM. Um provedor de IA futuro pode apenas ACRESCENTAR achados,
 *   nunca substituir estas regras (ver FreedomRuleProvider).
 */

export const FREEDOM_RULESET_VERSION = "pch-news-2026.09-v1";

export type FreedomSeverity = "ok" | "info" | "warning" | "block";

export type FreedomCheck = {
  ruleId: string;
  label: string;
  severity: FreedomSeverity;
  message: string;
  evidence: string[];
  action?: string;
};

export type FreedomArticle = { title: string; summary: string; bodyHtml: string; category: string };

/** Contrato para regras adicionais futuras (ex.: IA). Devem ser auditáveis. */
export type FreedomRuleProvider = (ctx: FreedomContext) => FreedomCheck[];

type FreedomContext = { title: string; summary: string; body: string; sentences: string[]; category: string; words: number; html: string };

const strip = (html: string) => html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<\/(p|h\d|li|blockquote)>/gi, ". ").replace(/<[^>]+>/g, " ").replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").replace(/\s+/g, " ").replace(/\.\s*\./g, ".").trim();
const split = (text: string) => text.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter((s) => s.length > 2);
const clip = (s: string, n = 160) => (s.length > n ? s.slice(0, n - 1) + "…" : s);
const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
const rx = (words: string[]) => new RegExp("(^|[^\\p{L}])(" + words.join("|") + ")(?=[^\\p{L}]|$)", "iu");
const matches = (sentences: string[], re: RegExp, max = 4) => sentences.filter((s) => re.test(s)).slice(0, max).map((s) => clip(s));
const termHits = (text: string, re: RegExp) => { const g = new RegExp(re.source, "giu"); return Array.from(new Set(Array.from(text.matchAll(g)).map((m) => m[2].toLowerCase()))); };

const ATTRIBUTION = rx(["segundo", "de acordo com", "afirmou", "afirma", "disse", "declarou", "informou", "apontou", "conforme", "relatou", "explicou", "em nota", "em entrevista", "dados do", "dados da", "levantamento", "relatório"]);
const VAGUE_ATTRIBUTION = rx(["especialistas (?:afirmam|dizem|apontam|alertam)", "estudos (?:mostram|indicam|apontam)", "fontes (?:afirmam|dizem|revelam)", "sabe-se que", "muitos (?:acreditam|dizem|afirmam)", "dizem que", "há quem diga", "analistas (?:afirmam|dizem)", "pesquisas (?:mostram|indicam)", "todo mundo sabe"]);
const ABSOLUTE = rx(["sempre", "nunca", "todos", "todas", "ninguém", "jamais", "comprovadamente", "sem dúvida", "definitivamente", "indiscutivelmente", "maior da história", "pior da história", "totalmente", "absolutamente", "certamente", "inquestionável"]);
const EMOTIONAL = rx(["chocante", "absurdo", "absurda", "escândalo", "escandaloso", "bomba", "inacreditável", "vergonha", "vergonhoso", "desespero", "catástrofe", "catastrófico", "destruiu", "humilhou", "detonou", "revoltante", "assustador", "terrível", "caos", "massacre", "urgente", "exclusivo", "vazou", "você não vai acreditar", "imperdível"]);
const OPINION = rx(["acredito", "na minha opinião", "em minha opinião", "penso que", "achamos", "acho que", "deveria", "deveriam", "é preciso que", "lamentável", "inaceitável", "felizmente", "infelizmente", "é evidente que", "ao nosso ver", "a nosso ver"]);
const CONTEXT = rx(["desde", "anteriormente", "histórico", "no ano passado", "em comparação", "contexto", "antes disso", "há \\d+ anos", "nos últimos", "em \\d{4}", "à época"]);
const CONTROVERSY = rx(["eleição", "eleições", "governo", "oposição", "partido", "reforma", "polêmica", "polêmico", "investigação", "acusação", "acusado", "denúncia", "stf", "congresso", "senado", "projeto de lei", "imposto", "impeachment", "protesto", "greve", "aborto", "religião", "privatização"]);
const COUNTERPOINT = rx(["por outro lado", "em contrapartida", "críticos", "defensores", "procurad[oa]", "em nota", "rebate", "rebateu", "contesta", "contestou", "discorda", "discordou", "outra avaliação", "divergem", "não respondeu", "não se manifestou", "direito de resposta"]);
const UNCERTAINTY = rx(["ainda não", "não confirmou", "não confirmado", "estimativa", "preliminar", "até o momento", "não foi possível", "não há dados", "sem confirmação", "em apuração", "margem de erro", "provisório", "provisórios"]);
const PROJECTION = rx(["pode", "poderá", "deve", "deverá", "projeção", "previsão", "tende a", "expectativa", "estima-se"]);
const WHEN = new RegExp(String.raw`\b(\d{1,2} de [a-zç]+|\d{1,2}\/\d{1,2}|(19|20)\d{2}|segunda|terça|quarta|quinta|sexta|sábado|domingo|ontem|hoje|nesta|neste|nesta semana|\d{1,2}h\d{0,2})\b`, "iu");
const WHERE = new RegExp(String.raw`(\bem\s+[A-ZÁÉÍÓÚÂÊÔÃÕÇ][\p{L}]+|\bno\s+[A-ZÁÉÍÓÚÂÊÔÃÕÇ][\p{L}]+|\bna\s+[A-ZÁÉÍÓÚÂÊÔÃÕÇ][\p{L}]+|\bcidade\b|\bestado\b|\bmunicípio\b|\bcapital\b)`, "u");
const HOW = rx(["por meio de", "através de", "após", "com base em", "mediante", "votação", "decreto", "acordo", "medida", "processo"]);
const WHY = rx(["porque", "devido", "motivo", "em razão", "para que", "com o objetivo", "a fim de", "justificou", "razão"]);
const HEADLINE_PROMISE = rx(["revela", "prova", "comprova", "confirma", "definitivo", "definitiva", "verdade sobre", "tudo sobre", "segredo", "fim de", "acaba com"]);

function ctxOf(a: FreedomArticle): FreedomContext {
  const body = strip(a.bodyHtml || "");
  return { title: (a.title || "").trim(), summary: (a.summary || "").trim(), body, sentences: split(body), category: a.category || "", words: body ? body.split(/\s+/).length : 0, html: a.bodyHtml || "" };
}

const isOpinionCategory = (c: string) => /opini|coluna|editorial|artigo/i.test(norm(c));

const RULES: FreedomRuleProvider[] = [
  // LE-01 Fato x opinião
  (c) => {
    const ev = matches(c.sentences, OPINION);
    if (isOpinionCategory(c.category)) return [{ ruleId: "LE-01", label: "Fato e opinião separados", severity: "ok", message: "Texto classificado como opinião; o leitor verá o selo OPINIÃO.", evidence: [`Editoria: ${c.category}`] }];
    if (ev.length) return [{ ruleId: "LE-01", label: "Opinião em texto factual", severity: "warning", message: `${ev.length} trecho(s) com marcadores de opinião em matéria factual.`, evidence: ev, action: "Atribua a avaliação a uma fonte identificada ou mova para a editoria Opinião." }];
    return [{ ruleId: "LE-01", label: "Fato e opinião separados", severity: "ok", message: "Nenhum marcador de opinião da redação no texto factual.", evidence: [] }];
  },
  // LE-02 Contexto
  (c) => {
    const ev = matches(c.sentences, CONTEXT, 3);
    if (c.words < 180) return [{ ruleId: "LE-02", label: "Contexto insuficiente", severity: "warning", message: `Texto com ${c.words} palavras — pouco espaço para contexto.`, evidence: [`${c.words} palavras no corpo`], action: "Explique antecedentes: o que levou ao fato e o que mudou." }];
    if (!ev.length) return [{ ruleId: "LE-02", label: "Contexto temporal ausente", severity: "warning", message: "Nenhum marcador de antecedente ou comparação temporal encontrado.", evidence: ["Termos procurados: desde, anteriormente, em AAAA, nos últimos…"], action: "Inclua uma frase de contexto: desde quando, comparado a quê." }];
    return [{ ruleId: "LE-02", label: "Contexto presente", severity: "ok", message: "O texto oferece antecedentes ou comparação.", evidence: ev }];
  },
  // LE-03 Fontes
  (c) => {
    const ev = matches(c.sentences, ATTRIBUTION, 4);
    const links = (c.html.match(/https?:\/\/[^"'\s<]+/gi) || []).slice(0, 4);
    if (!ev.length && !links.length) return [{ ruleId: "LE-03", label: "Sem fontes identificadas", severity: "warning", message: "Nenhuma atribuição ou link de fonte encontrado.", evidence: [], action: "Identifique quem informa cada fato (pessoa, cargo, instituição, documento)." }];
    return [{ ruleId: "LE-03", label: "Fontes identificadas", severity: "ok", message: `${ev.length} atribuição(ões) e ${links.length} link(s) de fonte.`, evidence: [...ev.slice(0, 2), ...links.slice(0, 2)] }];
  },
  // LE-04 Atribuição vaga
  (c) => {
    const ev = matches(c.sentences, VAGUE_ATTRIBUTION);
    if (!ev.length) return [];
    return [{ ruleId: "LE-04", label: "Afirmação sem atribuição", severity: "warning", message: `${ev.length} atribuição(ões) genérica(s) — ex.: "especialistas afirmam" sem dizer quem.`, evidence: ev, action: "Nomeie a fonte (nome, cargo, instituição) ou remova a afirmação." }];
  },
  // LE-05 Absolutos sem fonte
  (c) => {
    const ev = c.sentences.filter((s) => ABSOLUTE.test(s) && !ATTRIBUTION.test(s)).slice(0, 4).map((s) => clip(s));
    if (!ev.length) return [];
    return [{ ruleId: "LE-05", label: "Afirmação absoluta sem fonte", severity: "warning", message: `${ev.length} frase(s) com termo absoluto e sem atribuição na mesma frase.`, evidence: ev, action: "Relativize (\"a maioria\", \"desde 2019\") ou atribua a uma fonte verificável." }];
  },
  // LE-06 Linguagem emocional / sensacionalista
  (c) => {
    const terms = termHits(`${c.title} ${c.summary} ${c.body}`, EMOTIONAL);
    const bangs = (c.body.match(/!/g) || []).length + (c.title.match(/!/g) || []).length;
    if (!terms.length && bangs < 2) return [{ ruleId: "LE-06", label: "Linguagem sóbria", severity: "ok", message: "Sem termos de carga emocional ou sensacionalista.", evidence: [] }];
    return [{ ruleId: "LE-06", label: "Linguagem emocional ou sensacionalista", severity: terms.length >= 3 ? "warning" : "info", message: `Termos de alta carga: ${terms.join(", ") || "—"}${bangs ? ` · ${bangs} ponto(s) de exclamação` : ""}.`, evidence: matches(c.sentences, EMOTIONAL, 3), action: "Descreva o fato com termos neutros e deixe o leitor avaliar a gravidade." }];
  },
  // LE-07 Manchete promete mais que o texto
  (c) => {
    const out: FreedomCheck[] = [];
    const absTitle = termHits(c.title, ABSOLUTE);
    const unsupported = absTitle.filter((t) => !new RegExp(t, "i").test(c.body));
    if (unsupported.length) out.push({ ruleId: "LE-07a", label: "Título com linguagem absoluta", severity: "warning", message: "Título usa linguagem absoluta não sustentada pelo texto.", evidence: [`Título: "${clip(c.title)}"`, `Termo(s) sem respaldo no corpo: ${unsupported.join(", ")}`], action: "Ajuste o título ao que o corpo efetivamente demonstra." });
    const promise = termHits(c.title, HEADLINE_PROMISE);
    if (promise.length) out.push({ ruleId: "LE-07b", label: "Título promete conclusão", severity: "warning", message: `Título usa "${promise.join(", ")}" — confirme que o texto apresenta a evidência.`, evidence: [`Título: "${clip(c.title)}"`], action: "Troque por verbo descritivo (\"aponta\", \"indica\") se a prova não estiver no texto." });
    const key = norm(c.title).split(/[^a-z0-9]+/).filter((w) => w.length > 4);
    const body = norm(c.body);
    const missing = key.filter((w) => !body.includes(w.slice(0, Math.max(5, w.length - 2))));
    if (key.length >= 3 && missing.length / key.length > 0.6) out.push({ ruleId: "LE-07c", label: "Título distante do corpo", severity: "info", message: `${missing.length} de ${key.length} termos centrais do título não aparecem no texto.`, evidence: [`Ausentes no corpo: ${missing.slice(0, 6).join(", ")}`], action: "Garanta que o corpo desenvolva o que o título anuncia." });
    if (/\?\s*$/.test(c.title)) out.push({ ruleId: "LE-07d", label: "Título em pergunta", severity: "info", message: "Títulos em pergunta podem sugerir conclusão sem afirmá-la.", evidence: [`Título: "${clip(c.title)}"`], action: "Prefira título afirmativo com o fato apurado." });
    return out.length ? out : [{ ruleId: "LE-07", label: "Título proporcional ao texto", severity: "ok", message: "O título não promete mais do que o corpo sustenta.", evidence: [] }];
  },
  // LE-08 Controvérsia sem contraponto (descritivo, sem lado)
  (c) => {
    const topics = termHits(`${c.title} ${c.body}`, CONTROVERSY);
    if (!topics.length) return [];
    const counter = matches(c.sentences, COUNTERPOINT, 3);
    const attributions = matches(c.sentences, ATTRIBUTION, 20).length;
    if (!counter.length) return [{ ruleId: "LE-08", label: "Tema controverso sem contraponto", severity: "warning", message: `Tema potencialmente controverso (${topics.slice(0, 4).join(", ")}) com ${attributions} atribuição(ões) e nenhum contraponto ou outra parte ouvida.`, evidence: [`Termos de tema: ${topics.slice(0, 6).join(", ")}`], action: "Registre as perspectivas relevantes envolvidas ou informe que a outra parte foi procurada. Esta regra não indica qual lado deve prevalecer." }];
    return [{ ruleId: "LE-08", label: "Perspectivas relevantes presentes", severity: "ok", message: "O texto registra contraponto ou tentativa de ouvir as partes.", evidence: counter }];
  },
  // LE-09 Quem, o quê, quando, onde, como, por quê
  (c) => {
    const text = `${c.summary} ${c.body}`;
    const who = ATTRIBUTION.test(text) || /\b[A-ZÁÉÍÓÚ][a-záéíóúãõç]+ [A-ZÁÉÍÓÚ][a-záéíóúãõç]+/.test(c.body);
    const checks: Array<[string, boolean]> = [["quem", who], ["o quê", c.title.length > 10 && c.summary.length > 20], ["quando", WHEN.test(text)], ["onde", WHERE.test(text)], ["como", HOW.test(text)]];
    const missing = checks.filter(([, ok]) => !ok).map(([k]) => k);
    const out: FreedomCheck[] = [missing.length
      ? { ruleId: "LE-09", label: "Informação essencial faltando", severity: "warning", message: `Não encontrado: ${missing.join(", ")}.`, evidence: [`Presentes: ${checks.filter(([, ok]) => ok).map(([k]) => k).join(", ") || "nenhum"}`], action: `Complete o lide com ${missing.join(", ")}.` }
      : { ruleId: "LE-09", label: "Lide completo", severity: "ok", message: "Quem, o quê, quando, onde e como identificados.", evidence: [] }];
    if (!WHY.test(text)) out.push({ ruleId: "LE-09b", label: "Por quê não explicado", severity: "info", message: "Nenhuma explicação de causa ou motivação encontrada (quando aplicável).", evidence: [], action: "Se houver motivo conhecido, explique-o com atribuição." });
    return out;
  },
  // LE-10 Incerteza e limites
  (c) => {
    const proj = matches(c.sentences, PROJECTION, 3);
    const unc = matches(c.sentences, UNCERTAINTY, 3);
    if (unc.length) return [{ ruleId: "LE-10", label: "Limites da informação declarados", severity: "ok", message: "O texto informa incertezas ou limites da apuração.", evidence: unc }];
    if (proj.length) return [{ ruleId: "LE-10", label: "Incerteza não declarada", severity: "info", message: `${proj.length} projeção(ões) sem indicar grau de incerteza.`, evidence: proj, action: "Diga o que ainda não se sabe, a base da estimativa e o que falta confirmar." }];
    return [];
  },
];

export type FreedomReport = {
  rulesetVersion: string;
  mission: string;
  contentType: "fato" | "opinião";
  score: number;
  checks: FreedomCheck[];
  autonomy: { question: string; answer: "sim" | "parcialmente" | "não"; blockingRules: string[] };
};

const AUTONOMY_RULES = ["LE-01", "LE-03", "LE-04", "LE-05", "LE-07a", "LE-07b", "LE-08", "LE-09"];

export function runFreedomReview(article: FreedomArticle, extra: FreedomRuleProvider[] = []): FreedomReport {
  const ctx = ctxOf(article);
  const checks = [...RULES, ...extra].flatMap((rule) => rule(ctx));
  const warnings = checks.filter((c) => c.severity === "warning" || c.severity === "block");
  const infos = checks.filter((c) => c.severity === "info").length;
  const score = Math.max(0, Math.min(100, 100 - warnings.length * 12 - infos * 4));
  const blocking = warnings.filter((c) => AUTONOMY_RULES.includes(c.ruleId)).map((c) => c.ruleId);
  return {
    rulesetVersion: FREEDOM_RULESET_VERSION,
    mission: "Informar para que o leitor possa pensar por si mesmo.",
    contentType: isOpinionCategory(ctx.category) ? "opinião" : "fato",
    score,
    checks,
    autonomy: { question: "O leitor consegue formar a própria compreensão sem depender da redação para dizer o que pensar?", answer: blocking.length === 0 ? "sim" : blocking.length <= 2 ? "parcialmente" : "não", blockingRules: blocking },
  };
}
