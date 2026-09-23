# PCH News Hub

Base editorial do PCH News / Tolerajornal.

## Validação atual

- Home pública e cards de notícias
- Página de matéria
- Painel /admin
- Editor de título, linha fina, resumo, corpo, editora, status e slug
- Botão Revisar matéria
- Revisão determinística local, sem chamada a LLM
- Agentes de consistência factual, gramática, estilo, clareza, títulos, SEO e checklist editorial
- Sugestões com severidade, trecho, explicação, Aplicar e Ignorar
- Aplicação segura individual e em lote
- Histórico de revisões
- Painel de auditoria SEO com title tag, meta description, slug, palavra-chave, canonical e indexação
- Prévia de snippet
- Sitemap e robots.txt dinâmicos
- Persistência local preparada para futura troca por Supabase/MySQL

## Fluxo de validação

/ → Painel editorial → escolher matéria → Revisar matéria → conferir achados → aplicar/ignorar → SEO → Salvar.

A arquitetura deixa o motor de revisão atrás de uma interface substituível. O comportamento atual é deliberadamente determinístico e auditável.

## Desenvolvimento

bun install
bun run dev
