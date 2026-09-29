import { runFreedomReview } from "./editorialFreedom";
import type { EditorialResearchContext } from "./apiHub/editorialContext";

export type EditorialAgentId =
  | "story-editor"
  | "fact-checker"
  | "seo-optimization-specialist"
  | "publication-readiness"
  | "ethics-advisor"
  | "multi-platform-distributor"
  | "liberdade-editorial"
  | "beyond-news"
  | "journalism-master-orchestrator";

export type EditorialArticleInput = {
  id: string;
  title: string;
  category: string;
  author: string;
  summary: string;
  bodyHtml: string;
  image: string;
  tags: string;
  status: string;
  scheduledAt?: number | null;
  researchContext?: EditorialResearchContext;
};

export type AgentFinding = {
  severity: "info" | "warning" | "block";
  code: string;
  message: string;
  suggestion?: string;
  ruleId?: string;
  evidence?: string[];
};

export type AgentResult = {
  agentId: EditorialAgentId;
  agentName: string;
  status: "pass" | "review" | "block";
  findings: AgentFinding[];
  output: Record<string, unknown>;
};

const stripHtml = (html: string) =>
  html.replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();

const sentences = (text: string) =>
  text.split(/(?<=[.!?])\s+/).map((item) => item.trim()).filter(Boolean);

const slugify = (value: string) =>
  value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const parseTags = (value: string) => {
  try {
    const parsed = JSON.parse(value || "[]");
    return Array.isArray(parsed) ? parsed.map(String).filter(Boolean) : [];
  } catch {
    return value.split(",").map((tag) => tag.trim()).filter(Boolean);
  }
};

function base(article: EditorialArticleInput) {
  const body = stripHtml(article.bodyHtml || "");
  return { body, words: body ? body.split(/\s+/).length : 0, sentences: sentences(body) };
}

function storyEditor(article: EditorialArticleInput): AgentResult {
  const { body, words, sentences: lines } = base(article);
  const findings: AgentFinding[] = [];
  if (!article.title.trim()) findings.push({ severity: "block", code: "missing-title", message: "A matéria está sem título." });
  if (article.title.trim().length > 90) findings.push({ severity: "warning", code: "long-title", message: "O título está muito longo para leitura rápida.", suggestion: "Reduza para uma formulação mais direta." });
  if (!article.summary.trim()) findings.push({ severity: "block", code: "missing-summary", message: "Falta resumo/deck." });
  if (article.summary.trim().length > 220) findings.push({ severity: "warning", code: "long-summary", message: "O resumo está extenso.", suggestion: "Condense o contexto inicial e preserve o fato principal." });
  if (body.length < 180) findings.push({ severity: "warning", code: "short-body", message: "O corpo da matéria está muito curto para uma publicação jornalística.", suggestion: "Inclua contexto, evidências, fontes e fechamento." });
  if (/ {2,}/.test(body)) findings.push({ severity: "warning", code: "double-spaces", message: "Há espaços duplicados no texto." });
  if (/!!+|\?\?+/.test(body)) findings.push({ severity: "warning", code: "punctuation", message: "Há pontuação repetida que pode comprometer o tom editorial." });
  const allCaps = lines.filter((line) => line.length > 24 && line === line.toUpperCase() && /[A-ZÁÉÍÓÚÃÕÇ]/.test(line));
  if (allCaps.length) findings.push({ severity: "warning", code: "all-caps", message: "Há trechos longos em caixa alta.", suggestion: "Use caixa normal, salvo siglas e nomes próprios." });
  const status = findings.some((f) => f.severity === "block") ? "block" : findings.length ? "review" : "pass";
  return { agentId: "story-editor", agentName: "Story Editor", status, findings, output: { wordCount: words, sentenceCount: lines.length, cleanedTextLength: body.length } };
}

function factChecker(article: EditorialArticleInput): AgentResult {
  const { body } = base(article);
  const findings: AgentFinding[] = [];
  const evidenceSentences = sentences(body).filter((line) =>
    /\b(19|20)\d{2}\b|\b\d{1,3}(?:[.,]\d{3})*(?:%| milhões?| bilhões?| mil)?\b|["“”]/.test(line)
  );
  const links = (article.bodyHtml || "").match(/https?:\/\/[^"'\s<]+/gi) || [];
  if (evidenceSentences.length) {
    findings.push({
      severity: "info",
      code: "claims-require-sources",
      message: `${evidenceSentences.length} trecho(s) contêm datas, números ou citações e devem ser conferidos contra fontes primárias.`,
      suggestion: "Abra as fontes originais e registre a evidência antes da publicação."
    });
  }
  if (!links.length) findings.push({ severity: "warning", code: "no-source-links", message: "Não foram encontrados links de fonte no corpo.", suggestion: "Inclua links de fontes quando a matéria depender de dados, documentos ou declarações verificáveis." });
  const namedClaims = sentences(body).filter((line) => /\b(segundo|afirmou|disse|informou|de acordo com|apontou)\b/i.test(line));
  if (namedClaims.length) findings.push({ severity: "info", code: "attribution-check", message: `${namedClaims.length} trecho(s) usam atribuição e merecem conferência da declaração original.` });
  const research = article.researchContext;
  if (research) {
    if (research.sources.length) {
      findings.push({
        severity: "info",
        code: "api-context-sources",
        message: `O API HUB trouxe ${research.sources.length} fonte(s) externas para conferência contextual.`,
        suggestion: "Abra as fontes originais e confirme datas, números, declarações e contexto antes de publicar.",
        evidence: research.sources.slice(0, 6).map((source) => `${source.source || source.provider}: ${source.title}`)
      });
    }
    if (research.limitations.length) {
      findings.push({ severity: "info", code: "api-context-limitations", message: "A coleta automática teve limitações; elas não substituem a apuração humana.", evidence: research.limitations.slice(0, 6) });
    }
  }
  return { agentId: "fact-checker", agentName: "Fact Checker", status: findings.some((f) => f.severity === "warning") ? "review" : "pass", findings, output: { evidenceCandidates: evidenceSentences.slice(0, 20), sourceLinks: links, attributedClaims: namedClaims.slice(0, 20), researchContext: research ?? null } };
}

function seo(article: EditorialArticleInput): AgentResult {
  const findings: AgentFinding[] = [];
  const title = article.title.trim();
  const summary = article.summary.trim();
  const tags = parseTags(article.tags);
  if (title.length < 40 || title.length > 65) findings.push({ severity: "warning", code: "seo-title-length", message: `Título com ${title.length} caracteres; a faixa recomendada para busca é aproximadamente 40–65.` });
  if (summary.length < 120 || summary.length > 160) findings.push({ severity: "warning", code: "seo-summary-length", message: `Resumo com ${summary.length} caracteres; ajuste para uma descrição mais objetiva para busca e compartilhamento.` });
  if (!tags.length) findings.push({ severity: "warning", code: "missing-tags", message: "A matéria não possui tags editoriais." });
  const suggestedSlug = slugify(title);
  return {
    agentId: "seo-optimization-specialist",
    agentName: "SEO Optimization Specialist",
    status: findings.length ? "review" : "pass",
    findings,
    output: { suggestedSlug, titleLength: title.length, summaryLength: summary.length, tags, metaDescription: summary.slice(0, 160) }
  };
}

function publicationReadiness(article: EditorialArticleInput): AgentResult {
  const findings: AgentFinding[] = [];
  const { body } = base(article);
  if (!article.image.trim()) findings.push({ severity: "block", code: "missing-image", message: "A publicação não possui imagem principal." });
  if (!article.author.trim()) findings.push({ severity: "block", code: "missing-author", message: "A publicação não possui autoria." });
  if (!article.category.trim()) findings.push({ severity: "block", code: "missing-category", message: "A publicação não possui editoria." });
  if (!article.title.trim() || !article.summary.trim() || body.length < 180) findings.push({ severity: "block", code: "incomplete-content", message: "Conteúdo editorial incompleto para publicação." });
  if (article.status === "scheduled" && !article.scheduledAt) findings.push({ severity: "block", code: "missing-schedule", message: "A matéria está marcada como agendada, mas não possui horário." });
  return { agentId: "publication-readiness", agentName: "Publication Readiness", status: findings.some((f) => f.severity === "block") ? "block" : findings.length ? "review" : "pass", findings, output: { ready: findings.length === 0 } };
}

function ethics(article: EditorialArticleInput): AgentResult {
  const { body } = base(article);
  const findings: AgentFinding[] = [];
  if (/\b(acusado de|culpado|criminoso|fraudador|ladrão|ladrão|mentiroso)\b/i.test(body)) {
    findings.push({ severity: "warning", code: "loaded-accusation", message: "Há linguagem potencialmente acusatória ou conclusiva.", suggestion: "Verifique atribuição, contexto, presunção de inocência e documentação antes de publicar." });
  }
  if (/\b(sem provas|com certeza|obviamente|sempre|nunca)\b/i.test(body)) {
    findings.push({ severity: "warning", code: "absolute-language", message: "Há linguagem absoluta que pode exigir evidência adicional." });
  }
  if (/\b(vazou|exclusivo|urgente|chocante|escândalo)\b/i.test(article.title)) {
    findings.push({ severity: "info", code: "sensational-headline", message: "O título contém termos de alta carga editorial.", suggestion: "Confirme se cada termo é necessário e sustentado pela matéria." });
  }
  return { agentId: "ethics-advisor", agentName: "Ethics Advisor", status: findings.some((f) => f.severity === "warning") ? "review" : "pass", findings, output: { humanReviewRequired: findings.length > 0 } };
}

function distributor(article: EditorialArticleInput): AgentResult {
  const summary = article.summary.trim();
  const title = article.title.trim();
  return {
    agentId: "multi-platform-distributor",
    agentName: "Multi-Platform Distributor",
    status: "pass",
    findings: [],
    output: {
      instagram: `${title}\n\n${summary}`,
      facebook: `${title} — ${summary}`,
      x: `${title} — ${summary.slice(0, 180)}`,
      whatsapp: `PCH News: ${title}\n${summary}`,
      youtube: `${title} | PCH News`
    }
  };
}

function beyondNews(article: EditorialArticleInput): AgentResult {
  const { body } = base(article);
  const findings: AgentFinding[] = [];
  const hasContext = /\b(contexto|histórico|historia|origem|por que|porque|impacto|consequência|consequências|efeito|reação|repercussão)\b/i.test(body);
  const hasHumanDimension = /\b(pessoa|pessoas|família|familias|comunidade|comportamento|emocional|emoção|emoções|psicológ|saúde mental|sociedade|humano)\b/i.test(body);
  const hasBeyondQuestion = /\b(além|significa|revela|o que isso muda|o que está por trás|implicação|implicações|aprend|reflexão)\b/i.test(body);
  if (!hasContext) findings.push({ severity: "warning", code: "missing-context-layer", message: "A matéria apresenta o fato, mas não deixa evidente uma camada de contexto.", suggestion: "Considere explicar origem, histórico, contexto ou por que o fato importa." });
  if (!hasHumanDimension) findings.push({ severity: "info", code: "missing-human-dimension", message: "Não foi identificada uma dimensão humana, comportamental ou social explícita.", suggestion: "Quando houver base e relevância, explore impactos sobre pessoas, comunidades, comportamento ou experiência humana." });
  if (!hasBeyondQuestion) findings.push({ severity: "warning", code: "missing-beyond-news-layer", message: "A segunda leitura do PCH News ainda não está evidente.", suggestion: "Pergunte: o que este fato revela, muda, ensina ou permite compreender além do acontecimento em si?" });
  const sensitive = /\b(suicíd|suicid|depress|ansiedade|pânico|transtorno|diagnóst|saúde mental|trauma)\b/i.test(body);
  if (sensitive) findings.push({ severity: "info", code: "sensitive-mental-health-topic", message: "O texto toca em saúde mental ou sofrimento psicológico.", suggestion: "Evite diagnóstico de pessoas, generalizações clínicas e linguagem sensacionalista; diferencie informação de orientação profissional." });
  return {
    agentId: "beyond-news",
    agentName: "Além da Notícia — PCH News",
    status: findings.some((f) => f.severity === "warning") ? "review" : "pass",
    findings,
    output: {
      principle: "informar + contextualizar + ampliar compreensão",
      checks: { hasContext, hasHumanDimension, hasBeyondQuestion, sensitiveMentalHealthTopic: sensitive },
      editorialQuestion: "Depois de ler, o leitor entende apenas o que aconteceu ou também compreende por que isso importa?",
      guideQuestions: [
        "O que aconteceu? Quem informou? Quais são as fontes e evidências disponíveis?",
        "O que o leitor precisa saber para compreender o fato além do título?",
        "Como pessoas, comunidades, comportamentos e relações podem ser afetados?",
        "Que perguntas, aprendizados, consequências ou perspectivas relevantes o fato permite explorar?"
      ]
    }
  };
}

function liberdadeEditorial(article: EditorialArticleInput): AgentResult {
  const report = runFreedomReview(article);
  const findings: AgentFinding[] = report.checks.filter((c) => c.severity !== "ok").map((c) => ({
    severity: c.severity === "block" ? "block" : c.severity === "warning" ? "warning" : "info",
    code: "freedom-" + c.ruleId.toLowerCase(), ruleId: c.ruleId, evidence: c.evidence,
    message: `[${c.ruleId}] ${c.message}`, suggestion: c.action
  }));
  return { agentId: "liberdade-editorial", agentName: "Liberdade Editorial — PCH News", status: findings.some((f) => f.severity === "warning") ? "review" : "pass", findings, output: report as unknown as Record<string, unknown> };
}

export function runEditorialAgent(agentId: EditorialAgentId, article: EditorialArticleInput, researchContext?: EditorialResearchContext): AgentResult {
  const enrichedArticle = researchContext ? { ...article, researchContext } : article;
  switch (agentId) {
    case "story-editor": return storyEditor(enrichedArticle);
    case "fact-checker": return factChecker(enrichedArticle);
    case "seo-optimization-specialist": return seo(enrichedArticle);
    case "publication-readiness": return publicationReadiness(enrichedArticle);
    case "ethics-advisor": return ethics(enrichedArticle);
    case "multi-platform-distributor": return distributor(enrichedArticle);
    case "liberdade-editorial": return liberdadeEditorial(enrichedArticle);
    case "beyond-news": return beyondNews(enrichedArticle);
    case "journalism-master-orchestrator": {
      const results = [
        storyEditor(enrichedArticle),
        factChecker(enrichedArticle),
        seo(enrichedArticle),
        ethics(enrichedArticle),
        liberdadeEditorial(enrichedArticle),
        beyondNews(enrichedArticle),
        publicationReadiness(enrichedArticle),
        distributor(enrichedArticle)
      ];
      const blocked = results.some((result) => result.status === "block");
      const review = results.some((result) => result.status === "review");
      return {
        agentId,
        agentName: "Journalism Master Orchestrator",
        status: blocked ? "block" : review ? "review" : "pass",
        findings: results.flatMap((result) => result.findings).slice(0, 80),
        output: { agents: results, researchContext: researchContext ?? null, publicationGate: blocked ? "blocked" : review ? "human-review" : "ready" }
      };
    }
  }
}
