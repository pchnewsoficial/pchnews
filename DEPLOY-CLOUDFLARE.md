# PCH News — Cloudflare Workers

Esta é a rota de produção do PCH News: **Cloudflare Workers + Static Assets**, com o GitHub como fonte oficial do código. O ambiente Lovable é usado como editor/preview; ele não é a fonte de verdade da produção.

## Arquitetura atual

- **Frontend:** React + Vite → `dist/`
- **Backend:** Cloudflare Worker usando Express/tRPC/OAuth/storage/health
- **SPA:** Cloudflare Static Assets
- **Banco de produção:** **Supabase Postgres**
- **Autenticação:** Supabase Auth
- **Storage:** Supabase Storage quando usado pelos fluxos do projeto
- **Fonte oficial do código:** `pchnewsoficial/pchnews` / `main`

O código ainda contém artefatos legados de Drizzle/mysql2 para compatibilidade e tipos. Eles não devem ser tratados como a fonte do banco de produção sem validação explícita.

## Configuração do Worker

O repositório contém:

- `wrangler.jsonc`
- `worker/index.ts`
- `assets.directory = ./dist`
- `assets.not_found_handling = single-page-application`
- `assets.run_worker_first` para `/api/*`, `/manus-storage/*` e `/healthz`

Isso permite que as páginas React sejam servidas como assets e que as rotas de backend passem primeiro pelo Worker.

## Banco e runtime

A aplicação atualmente usa `@supabase/supabase-js` no backend e as tabelas reais estão no projeto Supabase `pch-news`.

O runtime do Worker precisa ter, conforme os fluxos utilizados:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` apenas para funções administrativas que realmente usem o cliente admin
- `SUPABASE_STORAGE_BUCKET`
- demais variáveis específicas de autenticação, e-mail ou integrações quando exigidas pelo código

**Nunca colocar service-role key, JWT secrets, SMTP credentials ou outros segredos no repositório.**

## Deploy automático GitHub → Cloudflare Worker

O deploy de produção é feito por:

`.github/workflows/deploy-cloudflare.yml`

Fluxo:

1. Push em `main`.
2. GitHub instala dependências com `pnpm install --frozen-lockfile`.
3. Executa `pnpm run build`.
4. Executa typecheck e testes.
5. Autentica o Wrangler.
6. Configura os secrets de runtime necessários.
7. Executa `wrangler deploy`.
8. Testa publicamente `/healthz` e `/`.
9. Executa smoke test no Chromium.
10. Só então declara o deployment concluído.

O workflow usa:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- `OWNER_OPEN_ID` quando necessário

O token nunca deve ser colocado no Git.

## Critério de conclusão

O PCH News só deve ser considerado operacional quando:

1. o Worker estiver ativo;
2. `/healthz` responder HTTP 200;
3. a SPA carregar;
4. o DOM React renderizar sem ErrorBoundary;
5. as rotas de API essenciais responderem;
6. Supabase Auth funcionar;
7. leitura e escrita necessárias no Supabase funcionarem;
8. Storage funcionar quando usado;
9. o editor conseguir salvar/publicar uma matéria;
10. a versão publicada corresponder ao commit validado no `main`.

Um dashboard dizendo “Deployment successful” sozinho não é prova suficiente de produção funcional.

## Validações do projeto

Depois de qualquer alteração relevante, verificar pelo menos:

- `pnpm run check`
- `pnpm test`
- `pnpm run build`
- `npx wrangler@4.38.0 deploy --dry-run`
- smoke test público do Worker
- fluxo de autenticação
- leitura/publicação de matéria
- imagens/storage
- SEO das páginas públicas

## Observação sobre Supabase

O banco de produção foi verificado no projeto Supabase `dlfipxqtbzmmbuksppvk`, região `sa-east-1`, PostgreSQL 17. O schema público possui RLS habilitado nas tabelas do PCH News.

Qualquer alteração de schema deve ser feita por migration rastreável e validada no banco antes de ser considerada concluída.


<!-- Production redeploy trigger: 2026-09-29 03:51 BRT. No application code change. -->
