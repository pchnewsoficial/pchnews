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

## Deploy

Para o Worker:
1. Cloudflare → Workers & Pages → **Workers**.
2. Conectar pchnewsoficial/pch-news.
3. Branch de produção: main.
4. Usar o wrangler.jsonc do repositório.
5. Build: pnpm install --frozen-lockfile && pnpm run build.
6. Deploy: npx wrangler deploy.

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
