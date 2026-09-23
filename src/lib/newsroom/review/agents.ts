import { getCategory, getColumnist } from "@/data/content";
import {
  DESC_MAX,
  DESC_MIN,
  firstParagraph,
  includesTerm,
  SEO_TITLE_MAX,
  suggestKeyword,
  suggestMetaDescription,
  suggestSeoTitle,
} from "@/lib/seo/audit";
import { isCleanSlug, slugify } from "@/lib/slug";

import type { EditorArticle } from "../types";
import { FIELD_LABEL, getField } from "./fields";
import {
  clip,
  inRanges,
  isHeading,
  matchCase,
  paragraphs,
  quoteRanges,
  sentences,
  snippet,
  wordRe,
  words,
} from "./text";
import type { AgentDefinition, Field, Severity, Suggestion } from "./types";

type Draft = Omit<Suggestion, "id" | "agentId">;

function collector(agentId: string) {
  const list: Suggestion[] = [];
  return { list, add: (d: Draft) => list.push({ ...d, id: `${agentId}-${list.length + 1}`, agentId }) };
}

interface Rule {
  re: RegExp;
  severity: Severity;
  message: string;
  replace?: (match: string, groups: string[]) => string;
  skipQuotes?: boolean;
}

const TEXT_FIELDS: Field[] = ["title", "subtitle", "body"];

function scan(a: EditorArticle, add: (d: Draft) => void, rules: Rule[], fields = TEXT_FIELDS) {
  for (const field of fields) {
    const text = getField(a, field);
    if (!text) continue;
    const quotes = quoteRanges(text);
    for (const rule of rules) {
      for (const m of text.matchAll(rule.re)) {
        const index = m.index ?? 0;
        if (rule.skipQuotes && inRanges(quotes, index)) continue;
        const found = m[0];
        add({
          severity: rule.severity,
          field,
          target: found,
          excerpt: snippet(text, index, found.length),
          message: rule.message,
          fix: rule.replace
            ? { type: "replace", find: found, replace: rule.replace(found, m.slice(1) as string[]) }
            : undefined,
        });
      }
    }
  }
}

const ATTRIBUTION =
  /(disse|diz|afirmou|afirma|declarou|resumiu|segundo|de acordo com|explicou|informou|avaliou|ressaltou|contou|comentou|defendeu|criticou|admitiu|garantiu|reconheceu)/i;

const factual: AgentDefinition = {
  id: "factual",
  name: "Consistência factual",
  description: "Coerência interna entre título, linha fina e corpo; atribuição e fontes. Não inventa nem corrige fatos.",
  run(a) {
    const { list, add } = collector(this.id);
    const bodyNumbers = new Set(a.body.match(/\d+(?:[.,]\d+)*/g) ?? []);
    for (const field of ["title", "subtitle"] as Field[]) {
      const text = getField(a, field);
      for (const m of text.matchAll(/\d+(?:[.,]\d+)*/g)) {
        if (bodyNumbers.has(m[0])) continue;
        add({
          severity: "alta",
          field,
          target: m[0],
          excerpt: snippet(text, m.index ?? 0, m[0].length),
          message: `O número “${m[0]}” está no ${FIELD_LABEL[field].toLowerCase()}, mas não aparece no corpo. Confira a apuração e deixe os dois coerentes — este agente não altera dados.`,
        });
      }
    }
    for (const p of paragraphs(a.body)) {
      if (isHeading(p)) continue;
      const quote = p.match(/["“][^"”]{12,}["”]/);
      if (quote && !ATTRIBUTION.test(p)) {
        add({
          severity: "media",
          field: "body",
          target: quote[0],
          excerpt: clip(p),
          message: "Citação sem atribuição explícita. Informe quem falou (nome e função) ou a origem da informação.",
        });
      }
    }
    scan(a, add, [
      {
        re: wordRe("(?:especialistas|analistas|fontes|estudos|pesquisas)\\s+(?:dizem|afirmam|apontam|indicam|mostram|garantem)"),
        severity: "media",
        message: "Fonte genérica. Nomeie o especialista, a instituição ou o estudo citado.",
      },
      {
        re: /(?<!\d)[1-9]\d{2,}(?:,\d+)?\s?%/g,
        severity: "baixa",
        message: "Percentual acima de 100%. Confirme a base de comparação com a fonte.",
      },
      {
        re: wordRe("ontem|anteontem|amanhã|semana passada|mês passado"),
        severity: "baixa",
        message: "Referência de tempo relativa. Prefira o dia ou a data explícita — a matéria será lida depois.",
        skipQuotes: true,
      },
      {
        re: wordRe("sempre|nunca|ninguém|todos os brasileiros|pela primeira vez na história|inédit[oa]"),
        severity: "baixa",
        message: "Afirmação absoluta. Confirme na apuração ou relativize.",
        skipQuotes: true,
      },
    ]);
    return list;
  },
};

const fix = (value: string) => (m: string) => matchCase(m, value);

const grammar: AgentDefinition = {
  id: "gramatica",
  name: "Gramática e ortografia",
  description: "Concordância, crase, grafia e pontuação.",
  run(a) {
    const { list, add } = collector(this.id);
    scan(a, add, [
      { re: wordRe("houveram"), severity: "alta", message: "“Haver” no sentido de existir é impessoal: use “houve”.", replace: fix("houve") },
      { re: wordRe("à partir"), severity: "media", message: "Não há crase antes de verbo.", replace: fix("a partir") },
      { re: wordRe("à prazo"), severity: "media", message: "Não há crase antes de palavra masculina.", replace: fix("a prazo") },
      {
        re: wordRe("fazem (?:\\d+|dois|duas|três|quatro|cinco|seis|sete|oito|nove|dez|muitos|vários) (?:anos|meses|dias|semanas)"),
        severity: "alta",
        message: "“Fazer” indicando tempo decorrido é impessoal.",
        replace: (m) => m.replace(/^fazem/i, (x) => matchCase(x, "faz")),
      },
      {
        re: wordRe("há (\\d+|dois|três|quatro|cinco|muitos) (anos|meses|dias) atrás"),
        severity: "media",
        message: "Pleonasmo: “há” já indica passado.",
        replace: (m) => m.replace(/\s+atrás$/i, ""),
      },
      { re: wordRe("a nível de"), severity: "baixa", message: "Prefira “em nível de” — ou reformule (“no âmbito de”).", replace: fix("em nível de") },
      { re: wordRe("concerteza"), severity: "alta", message: "Grafia correta: “com certeza”.", replace: fix("com certeza") },
      { re: wordRe("derrepente"), severity: "alta", message: "Grafia correta: “de repente”.", replace: fix("de repente") },
      { re: wordRe("menas"), severity: "alta", message: "“Menos” é invariável.", replace: fix("menos") },
      { re: wordRe("excessão"), severity: "alta", message: "Grafia correta: “exceção”.", replace: fix("exceção") },
      { re: wordRe("impecilho"), severity: "alta", message: "Grafia correta: “empecilho”.", replace: fix("empecilho") },
      { re: wordRe("previlégio"), severity: "alta", message: "Grafia correta: “privilégio”.", replace: fix("privilégio") },
      { re: wordRe("enquanto que"), severity: "baixa", message: "“Que” é dispensável.", replace: fix("enquanto") },
      { re: wordRe("mais (maior|melhor|pior)"), severity: "media", message: "Comparativo duplicado.", replace: (m, g) => matchCase(m, g[0]) },
      { re: / {2,}/g, severity: "baixa", message: "Espaço duplicado.", replace: () => " " },
      { re: / +([,.;:!?])/g, severity: "baixa", message: "Espaço antes de pontuação.", replace: (_m, g) => g[0] },
      { re: /(?<![\p{L}])(\p{L}{2,})\s+\1(?![\p{L}])/giu, severity: "media", message: "Palavra repetida.", replace: (_m, g) => g[0] },
    ]);
    return list;
  },
};

const style: AgentDefinition = {
  id: "estilo",
  name: "Estilo jornalístico",
  description: "Impessoalidade, clichês e tom noticioso (manual PCH).",
  run(a) {
    const { list, add } = collector(this.id);
    const rules: Rule[] = [
      {
        re: /(vale ressaltar que|vale lembrar que|é importante (?:destacar|ressaltar|lembrar) que)\s+(\p{L})/giu,
        severity: "baixa",
        message: "Muleta de texto. Vá direto à informação.",
        replace: (m, g) => (m.charAt(0) === m.charAt(0).toUpperCase() ? g[1].toUpperCase() : g[1]),
      },
      { re: wordRe("no sentido de"), severity: "baixa", message: "Locução prolixa.", replace: fix("para") },
      { re: wordRe("via de regra"), severity: "baixa", message: "Clichê.", replace: fix("em geral") },
      { re: wordRe("a todo vapor|correr contra o tempo|jogar a toalha|divisor de águas"), severity: "baixa", message: "Clichê. Prefira descrever o fato." },
    ];
    if (a.category !== "opiniao") {
      rules.push(
        {
          re: wordRe("incrível|absurd[oa]|vergonhos[oa]|lamentável|espetacular|fantástic[oa]|maravilhos[oa]|péssim[oa]"),
          severity: "media",
          message: "Adjetivo opinativo fora de citação. Em notícia, atribua a avaliação a uma fonte ou descreva o fato.",
          skipQuotes: true,
        },
        { re: wordRe("nós|nosso|nossa|nossos|nossas"), severity: "baixa", message: "Primeira pessoa em texto noticioso.", skipQuotes: true },
        { re: /!/g, severity: "baixa", message: "Evite exclamação fora de citações.", skipQuotes: true },
      );
    }
    scan(a, add, rules);
    return list;
  },
};

const clarity: AgentDefinition = {
  id: "clareza",
  name: "Clareza e estrutura",
  description: "Lide, extensão de frases e parágrafos, intertítulos.",
  run(a) {
    const { list, add } = collector(this.id);
    const all = paragraphs(a.body);
    const paras = all.filter((p) => !isHeading(p));
    const lead = paras[0];
    if (lead && words(lead).length > 70) {
      add({
        severity: "media",
        field: "body",
        target: lead.slice(0, 60),
        excerpt: clip(lead),
        message: `Lide com ${words(lead).length} palavras. Entregue o essencial (o quê, quem, quando, onde) em até ~50 e desloque detalhes.`,
      });
    }
    for (const p of paras) {
      for (const s of sentences(p)) {
        const n = words(s).length;
        if (n > 40) add({ severity: "media", field: "body", target: s.slice(0, 60), excerpt: clip(s), message: `Frase com ${n} palavras. Divida em duas.` });
      }
      if (words(p).length > 110) add({ severity: "baixa", field: "body", target: p.slice(0, 60), excerpt: clip(p), message: "Parágrafo longo. Quebre em blocos menores." });
    }
    if (words(a.body).length > 450 && !all.some(isHeading)) {
      add({ severity: "baixa", field: "body", target: "", excerpt: "Texto sem intertítulos.", message: "Inclua intertítulos (linha começando com “## ”) para orientar a leitura." });
    }
    return list;
  },
};

const titles: AgentDefinition = {
  id: "titulos",
  name: "Títulos",
  description: "Título e linha fina: extensão, clareza e padrão editorial.",
  run(a) {
    const { list, add } = collector(this.id);
    const t = a.title.trim();
    const sub = a.subtitle.trim();
    if (!t) add({ severity: "alta", field: "title", target: "", excerpt: "(vazio)", message: "Matéria sem título." });
    else {
      if (t.length < 35) add({ severity: "media", field: "title", target: t, excerpt: t, message: `Título curto (${t.length} caracteres). Informe o fato principal com sujeito e verbo.` });
      if (t.length > 100) add({ severity: "media", field: "title", target: t, excerpt: t, message: `Título longo (${t.length} caracteres). Busque até 90.` });
      if (/\.\s*$/.test(t)) add({ severity: "baixa", field: "title", target: ".", excerpt: t, message: "Títulos não levam ponto final.", fix: { type: "set", value: t.replace(/\.+\s*$/, ""), expected: a.title } });
      if (/\p{L}/u.test(t) && t === t.toUpperCase()) {
        const value = t.charAt(0) + t.slice(1).toLowerCase();
        add({ severity: "alta", field: "title", target: t, excerpt: t, message: "Título em caixa alta.", fix: { type: "set", value, expected: a.title } });
      }
      if (/\?\s*$/.test(t)) add({ severity: "baixa", field: "title", target: "?", excerpt: t, message: "Título em forma de pergunta: em notícia, prefira afirmar o fato apurado." });
    }
    if (!sub) add({ severity: "alta", field: "subtitle", target: "", excerpt: "(vazio)", message: "Linha fina ausente. Complemente o título com o segundo dado mais importante." });
    else if (sub.toLowerCase() === t.toLowerCase()) add({ severity: "media", field: "subtitle", target: sub, excerpt: sub, message: "Linha fina repete o título." });
    else if (sub.length > 220) add({ severity: "baixa", field: "subtitle", target: sub.slice(0, 40), excerpt: clip(sub), message: "Linha fina longa (mais de 220 caracteres)." });
    return list;
  },
};

const seo: AgentDefinition = {
  id: "seo",
  name: "SEO",
  description: "Title tag, meta description, slug, tema principal e imagem.",
  run(a) {
    const { list, add } = collector(this.id);
    const seoTitle = a.seo.title.trim();
    const sTitle = suggestSeoTitle(a);
    if (!seoTitle && a.title) {
      add({
        severity: a.title.length > SEO_TITLE_MAX ? "media" : "baixa",
        field: "seoTitle",
        target: "",
        excerpt: "(vazio — usa o título da matéria)",
        message: a.title.length > SEO_TITLE_MAX ? `Sem title tag própria e o título tem ${a.title.length} caracteres; pode ser cortado nos resultados.` : "Defina uma title tag própria, direta e com o tema principal.",
        fix: { type: "set", value: sTitle, expected: a.seo.title },
      });
    } else if (seoTitle.length > SEO_TITLE_MAX) {
      add({ severity: "media", field: "seoTitle", target: seoTitle, excerpt: seoTitle, message: `Title tag com ${seoTitle.length} caracteres.`, fix: { type: "set", value: sTitle, expected: a.seo.title } });
    }
    const desc = a.seo.description.trim();
    if (!desc) {
      add({ severity: "alta", field: "seoDescription", target: "", excerpt: "(vazio)", message: "Meta description ausente. Sugestão gerada a partir da linha fina/lide.", fix: { type: "set", value: suggestMetaDescription(a), expected: a.seo.description } });
    } else if (desc.length < DESC_MIN || desc.length > DESC_MAX) {
      add({ severity: "media", field: "seoDescription", target: desc, excerpt: clip(desc), message: `Meta description com ${desc.length} caracteres (faixa: ${DESC_MIN}–${DESC_MAX}).`, fix: { type: "set", value: suggestMetaDescription(a), expected: a.seo.description } });
    }
    const kw = a.seo.keyword.trim();
    if (!kw) {
      const suggestion = suggestKeyword(a);
      add({ severity: "media", field: "keyword", target: "", excerpt: "(vazio)", message: "Tema principal não definido. Sugestão extraída do título e do texto.", fix: suggestion ? { type: "set", value: suggestion, expected: a.seo.keyword } : undefined });
    } else {
      if (!includesTerm(seoTitle || a.title, kw)) add({ severity: "baixa", field: "seoTitle", target: "", excerpt: seoTitle || a.title, message: `O tema “${kw}” não aparece na title tag.` });
      if (!includesTerm(firstParagraph(a), kw)) add({ severity: "baixa", field: "body", target: "", excerpt: clip(firstParagraph(a)), message: `O tema “${kw}” não aparece no lide.` });
    }
    const slug = a.slug.trim();
    if (!slug || !isCleanSlug(slug) || slug.length > 80) {
      add({ severity: slug ? "media" : "alta", field: "slug", target: slug, excerpt: slug || "(vazio)", message: "Slug fora do padrão (minúsculas, sem acento, hífens, até 80 caracteres).", fix: { type: "set", value: slugify(a.title), expected: a.slug } });
    }
    if (a.image && !a.imageAlt.trim()) add({ severity: "media", field: "imageAlt", target: "", excerpt: "(vazio)", message: "Imagem sem texto alternativo. Descreva o que a foto mostra — só quem viu a imagem pode escrever." });
    return list;
  },
};

const checklist: AgentDefinition = {
  id: "checklist",
  name: "Checklist editorial",
  description: "Itens obrigatórios antes de publicar.",
  run(a) {
    const { list, add } = collector(this.id);
    if (!a.image) add({ severity: "alta", field: "image", target: "", excerpt: "(sem imagem)", message: "Matéria sem imagem principal." });
    else if (!a.imageCredit.trim()) add({ severity: "media", field: "imageCredit", target: "", excerpt: "(vazio)", message: "Imagem sem crédito." });
    if (!getCategory(a.category)) add({ severity: "alta", field: "category", target: "", excerpt: a.category || "(vazio)", message: "Editoria não definida." });
    if (!getColumnist(a.authorSlug)) add({ severity: "alta", field: "authorSlug", target: "", excerpt: a.authorSlug || "(vazio)", message: "Autor não definido." });
    const n = words(a.body).length;
    if (n < 200) add({ severity: "media", field: "body", target: "", excerpt: `${n} palavras`, message: "Texto curto para uma matéria (menos de 200 palavras)." });
    if (!a.excerpt.trim()) {
      const first = sentences(firstParagraph(a))[0] ?? "";
      add({ severity: "baixa", field: "excerpt", target: "", excerpt: "(vazio)", message: "Resumo para cards ausente.", fix: first ? { type: "set", value: clip(first, 200), expected: a.excerpt } : undefined });
    }
    return list;
  },
};

export const AGENTS: AgentDefinition[] = [factual, grammar, style, clarity, titles, seo, checklist];
export const seoAgent = seo;
export const agentName = (id: string) => AGENTS.find((agent) => agent.id === id)?.name ?? id;
