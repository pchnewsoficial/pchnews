# PCH News — preparação para Lovable

O projeto foi adaptado no GitHub para facilitar a importação como React + Vite.

## Alterações feitas

- Removido o runtime específico do Manus do Vite.
- Removido o coletor de debug específico do Manus.
- Simplificados os scripts para Vite (`dev`, `build`, `preview`).
- Removido o analytics que dependia de variáveis externas do ambiente Manus.
- Mantidos React, TypeScript, Tailwind, páginas e componentes existentes.

## Logo

Não existe atualmente um arquivo de logo identificável no repositório. Quando o logo oficial estiver disponível, o local recomendado é `client/public/brand/logo.svg`.

## Backend

O projeto ainda contém backend, autenticação, tRPC e banco de dados. A adaptação do frontend não converte automaticamente essas partes para Supabase ou outro backend. Elas precisarão ser mantidas em um serviço compatível ou migradas separadamente.

## Importação

No Lovable, conecte o GitHub e selecione o repositório privado `pchnewsoficial/pchnews.oficial`, branch `main`. Depois configure as variáveis/secrets necessários para o backend.
