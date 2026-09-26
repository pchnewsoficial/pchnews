# PCH News — preparação para Lovable

O projeto foi adaptado no GitHub para facilitar a importação como React + Vite.

## Fonte oficial

O repositório oficial e atual do PCH News é:

`pchnewsoficial/pchnews`

Branch de produção:

`main`

O repositório antigo `pchnewsoficial/pchnews.oficial` não é fonte de produção e não deve ser usado para importar, sincronizar ou publicar o projeto.

## Alterações feitas

- Removido o runtime específico do Manus do Vite.
- Removido o coletor de debug específico do Manus.
- Simplificados os scripts para Vite (`dev`, `build`, `preview`).
- Removido o analytics que dependia de variáveis externas do ambiente Manus.
- Mantidos React, TypeScript, Tailwind, páginas e componentes existentes.

## Logo

O logo oficial está em `client/public/brand/logo.svg`.

## Backend

O projeto ainda contém backend, autenticação, tRPC e banco de dados. A adaptação do frontend não converte automaticamente essas partes para Supabase ou outro backend. Elas precisam permanecer em um serviço compatível ou ser migradas separadamente.

## Lovable

O projeto PCH News Hub no Lovable deve permanecer alinhado ao repositório oficial `pchnewsoficial/pchnews`, branch `main`.

Ao configurar ou reconectar o GitHub no Lovable, selecionar exclusivamente:

- Repositório: `pchnewsoficial/pchnews`
- Branch: `main`

Não usar `pchnewsoficial/pchnews.oficial`.
