export type EditorialAgentId =
  | "story-editor"
  | "fact-checker"
  | "seo-optimization-specialist"
  | "publication-readiness"
  | "ethics-advisor"
  | "multi-platform-distributor"
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
};

export type AgentFinding = {
  severity: "info" | "warning" | "block";
  code: string;
  message: string;
  suggestion?: string;
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
  return { agentId: "fact-checker", agentName: "Fact Checker", status: findings.some((f) => f.severity === "warning") ? "review" : "pass", findings, output: { evidenceCandidates: evidenceSentences.slice(0, 20), sourceLinks: links, attributedClaims: namedClaims.slice(0, 20) } };
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

export function runEditorialAgent(agentId: EditorialAgentId, article: EditorialArticleInput): AgentResult {
  switch (agentId) {
    case "story-editor": return storyEditor(article);
    case "fact-checker": return factChecker(article);
    case "seo-optimization-specialist": return seo(article);
    case "publication-readiness": return publicationReadiness(article);
    case "ethics-advisor": return ethics(article);
    case "multi-platform-distributor": return distributor(article);
    case "journalism-master-orchestrator": {
      const results = [
        storyEditor(article),
        factChecker(article),
        seo(article),
        ethics(article),
        publicationReadiness(article),
        distributor(article)
      ];
      const blocked = results.some((result) => result.status === "block");
      const review = results.some((result) => result.status === "review");
      return {
        agentId,
        agentName: "Journalism Master Orchestrator",
        status: blocked ? "block" : review ? "review" : "pass",
        findings: results.flatMap((result) => result.findings).slice(0, 80),
        output: { agents: results, publicationGate: blocked ? "blocked" : review ? "human-review" : "ready" }
      };
    }
  }
}
