# Deploy externo do PCH News

Este repositório foi preparado para produção em uma hospedagem externa que suporte Node.js com processo persistente. O runtime atual usa Express, serve arquivos estáticos de `dist/`, expõe `GET /healthz`, e preserva o frontend, backend, autenticação, banco, APIs e regras editoriais do projeto.

## Plataforma recomendada

Render (Docker-based web service)

Motivo:
- suporta Node.js full-stack;
- aceita `PORT` dinâmico do ambiente;
- permite health check em `/healthz`;
- mantém o backend Express e o frontend estáticos no mesmo container;
- não exige conversão do projeto para site estático.

## Build local obrigatório

```bash
pnpm install --frozen-lockfile
pnpm run check
pnpm test
pnpm run build
NODE_ENV=production PORT=43127 node dist/server/index.js
```

### Smoke tests esperados

```bash
curl -i http://127.0.0.1:43127/healthz
curl -i http://127.0.0.1:43127/
curl -I http://127.0.0.1:43127/admin
curl -I http://127.0.0.1:43127/assets/index-DjizX0BK.css
```

## Docker

O projeto inclui um `Dockerfile` que:
- instala as dependências com pnpm;
- executa `pnpm run build`;
- inicia a aplicação com `node dist/server/index.js`;
- usa `PORT` do ambiente;
- expõe `/healthz` no health check.

Comando local para validar o container:

```bash
docker build -t pch-news:local .
docker run --rm -p 3000:3000 -e PORT=3000 pch-news:local
```

## Variáveis de ambiente exigidas

O runtime lê estas variáveis em `server/_core/env.ts`:

- `JWT_SECRET`
- `DATABASE_URL`
- `OAUTH_SERVER_URL`
- `OWNER_OPEN_ID`
- `PUBLIC_APP_URL`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM`
- `SMTP_SSL`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_STORAGE_BUCKET`
- `VITE_APP_ID`
- `BUILT_IN_FORGE_API_URL`
- `BUILT_IN_FORGE_API_KEY`

Se alguma delas não estiver definida, certos fluxos do app podem ficar em modo degradado ou sem autenticação/integração.

## Publicação no Render

1. Conecte o repositório GitHub `pchnewsoficial/pch-news`.
2. Escolha o serviço `Web Service` com `Docker`.
3. Use a branch `main`.
4. Defina `Build Command` como vazio, pois o Dockerfile já faz build.
5. Defina `Start Command` como vazio, pois o Dockerfile já inicia a app.
6. Confirmar que a plataforma expõe a variável `PORT` automaticamente.
7. Habilite health check em `/healthz`.
8. Configure o domínio público desejado.

## URL esperada

A URL pública real depende do domínio configurado pela plataforma escolhida, por exemplo:

- `https://pch-news.onrender.com`
- ou um domínio customizado do proprietário

A URL somente será considerada válida quando responder `HTTP 200` em `/healthz`, `/ e /admin`.

## Importante

Não é necessário converter o PCH News em site estático nem remover o Express. A produção externa deve manter o mesmo código do GitHub e usar um runtime Node persistente.
