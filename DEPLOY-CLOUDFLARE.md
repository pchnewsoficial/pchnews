# PCH News — Cloudflare Workers

Esta é a rota de produção do PCH News: **Workers + Static Assets**, com o GitHub como fonte oficial do código. Cloudflare recomenda Workers Static Assets para aplicações full-stack novas; Pages não é a arquitetura de produção deste projeto.

## Arquitetura

- React + Vite: dist/
- API/tRPC/OAuth/storage/health: Worker + Express
- SPA: Cloudflare Static Assets
- Banco atual: MySQL + Drizzle + mysql2
- Para produção no Workers, o acesso ao MySQL deve usar **Cloudflare Hyperdrive**
- Fonte: pchnewsoficial/pch-news

## Configuração do Worker

O repositório já contém:
- wrangler.jsonc
- worker/index.ts
- assets.directory = ./dist
- assets.not_found_handling = single-page-application
- assets.run_worker_first para /api/*, /manus-storage/* e /healthz

Isso permite que as páginas React sejam servidas como assets e que API/backend passem primeiro pelo Worker.

## Banco de dados — bloqueador de produção

O código de banco existente usa drizzle-orm/mysql2 e DATABASE_URL. Em Cloudflare Workers, a conexão com um MySQL tradicional deve ser feita por Hyperdrive; a documentação atual do Cloudflare recomenda Hyperdrive para MySQL e documenta mysql2 >= 3.13.0 com Node.js compatibility.

Portanto, **não considere o deployment concluído apenas porque o Worker sobe**. É obrigatório configurar:
1. Um Hyperdrive apontando para o banco MySQL real do PCH News.
2. O binding HYPERDRIVE no Worker.
3. As credenciais/configurações de aplicação como secrets/vars no Cloudflare.
4. A validação real de leitura e escrita no banco.

O projeto atualmente já usa mysql2 3.15.x, compatível com o requisito documentado pelo Cloudflare.

## Secrets e variáveis

Configure no ambiente de produção, nunca no Git:
- DATABASE_URL se mantido para compatibilidade/ambientes Node
- JWT_SECRET
- OWNER_OPEN_ID
- PUBLIC_APP_URL
- SUPABASE_URL
- SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
- SUPABASE_STORAGE_BUCKET
- BUILT_IN_FORGE_API_URL
- BUILT_IN_FORGE_API_KEY
- SMTP_HOST
- SMTP_PORT
- SMTP_USER
- SMTP_PASS
- SMTP_FROM
- SMTP_SSL

Nem todas são necessárias para cada fluxo, mas as funcionalidades correspondentes devem ser testadas antes de considerar produção concluída.

## Deploy automático GitHub → Cloudflare Worker

O deploy de produção agora é feito pelo GitHub Actions no workflow:
`.github/workflows/deploy-cloudflare.yml`.

Fluxo:
1. Push em `main`.
2. GitHub instala as dependências com pnpm.
3. GitHub executa `pnpm run build`.
4. GitHub executa typecheck e testes.
5. GitHub executa `cloudflare/wrangler-action@v4`.
6. Wrangler publica o Worker `pch-news` usando o `wrangler.jsonc`.

O workflow usa estes **GitHub Actions Secrets**:
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

O token deve ter permissão suficiente para fazer deploy do Worker. O valor do token nunca deve ser colocado no repositório. A documentação atual do Cloudflare recomenda essas duas credenciais para CI/CD com GitHub Actions.

Depois que os dois secrets forem configurados, qualquer push aprovado em `main` dispara o deploy automaticamente. Também é possível executar manualmente pelo GitHub Actions usando `workflow_dispatch`.

**Não criar um projeto Pages para este aplicativo.**

## Validação obrigatória

Depois do deployment real, validar publicamente:
- / → HTML do PCH News
- /healthz → HTTP 200
- /admin → shell do painel
- /materia/<id-ou-slug> → matéria publicada
- /api/trpc/* → API
- /api/oauth/callback → rota de autenticação
- /manus-storage/* → storage quando configurado
- assets JS/CSS/imagens → HTTP 200
- login/logout
- leitura do banco
- criação/edição/publicação de matéria
- upload de imagem
- comentários/moderação
- auditoria
- revisão editorial determinística
- SEO por matéria

## Critério de conclusão

O PCH News só é considerado **publicado e operacional** quando houver:
1. Worker ativo;
2. URL pública funcional;
3. /healthz respondendo;
4. frontend carregando sem erro;
5. tRPC respondendo;
6. autenticação funcionando;
7. banco funcionando;
8. storage funcionando quando usado;
9. editor conseguindo salvar/publicar;
10. nenhuma dependência crítica de Pages, VitePress, Lovable static hosting ou dados apenas em localStorage.

Um dashboard dizendo “Deployment successful” sozinho **não é prova de produção funcional**.


<!-- Production trigger verification: 2026-09-25 -->
