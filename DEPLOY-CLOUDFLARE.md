# PCH News — Cloudflare Workers

Esta implantação mantém o GitHub como fonte oficial do código e usa Cloudflare Workers para publicação.

## Arquitetura

- React + Vite: dist/
- API/tRPC/health/storage/OAuth: Worker + Express
- SPA: Cloudflare Static Assets
- Banco MySQL: variável DATABASE_URL ou, posteriormente, Cloudflare Hyperdrive
- Fonte: pchnewsoficial/pch-news

## Configuração no Cloudflare

1. Abra Workers & Pages no Cloudflare.
2. Crie uma aplicação em Import a repository.
3. Conecte o GitHub e selecione pchnewsoficial/pch-news.
4. Use a branch main como produção.
5. O arquivo wrangler.jsonc já define o Worker pch-news.
6. Build command:
   pnpm install --frozen-lockfile && pnpm run build
7. Deploy command:
   npx wrangler deploy
8. Configure as variáveis/secrets de runtime usadas pelo PCH News no Cloudflare.

## Variáveis necessárias

A aplicação atual utiliza, entre outras, DATABASE_URL, JWT_SECRET, OWNER_OPEN_ID, PUBLIC_APP_URL, credenciais Supabase e as variáveis do storage/SMTP quando esses recursos forem usados.

Nunca coloque valores secretos neste arquivo ou no Git.

## Banco MySQL

O PCH News atual usa Drizzle + mysql2. Cloudflare Hyperdrive suporta MySQL/mysql2 em Workers; para produção, o Hyperdrive pode ser conectado ao banco existente sem substituir o banco. A configuração do binding deve ser feita no ambiente Cloudflare.

## Validação

Depois do primeiro deployment, validar:

- /healthz → HTTP 200
- / → HTML do PCH News
- /admin → shell da aplicação
- /api/trpc/* → API
- assets /assets/* → HTTP 200
- autenticação
- leitura/escrita no banco

O deployment só deve ser considerado concluído depois desses testes em uma URL pública workers.dev ou domínio próprio.
