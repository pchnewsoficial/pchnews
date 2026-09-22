# PCH News Hub

Crie um novo projeto chamado "PCH News".

Quero um portal de notícias moderno, profissional e responsivo, em português do Brasil.

IMPORTANTE:

- NÃO use a marca ou logo do Manus na interface.

- O projeto deve usar a identidade "PCH News".

- Não invente serviços externos desnecessários.

- Estruture o projeto para poder ser conectado ao GitHub posteriormente.

- Priorize código limpo, componentizado e fácil de manter.

Identidade visual:

- Nome: PCH News

- Slogan: "Notícias para libertar a mente"

- Visual jornalístico moderno, elegante e responsivo.

- Boa experiência em desktop, tablet e celular.

- Tipografia legível e hierarquia visual forte.

Crie as seguintes áreas:

1. Página inicial

- Manchete principal em destaque.

- Carrossel de notícias com navegação anterior/próxima e indicadores.

- Notícias mais recentes.

- Categorias.

- Cards de notícias com imagem, título, resumo e data.

- Área de colunistas.

- Rodapé completo.

2. Página de notícia

- Título.

- Subtítulo/resumo.

- Autor.

- Data e hora.

- Imagem principal.

- Conteúdo da matéria.

- Compartilhamento.

- Notícias relacionadas.

3. Categorias

- Página individual para cada categoria.

- Listagem de matérias.

- Paginação ou carregamento progressivo.

4. Colunistas

- Lista de colunistas.

- Perfil individual.

- Foto, nome, biografia e artigos publicados.

5. Login

- Interface profissional de autenticação.

- Preparada para integração com Supabase Auth.

- Não colocar "Login com Manus" ou qualquer branding do Manus.

6. Área administrativa

- Dashboard.

- Indicadores de notícias, comentários e pendências.

- Gerenciamento de notícias.

- Gerenciamento de categorias.

- Gerenciamento de colunistas.

- Gerenciamento de comentários.

- Perfil do usuário.

- Notificações.

7. Responsividade

- Mobile first.

- Menu mobile.

- Layout adaptado para telas pequenas.

- Imagens responsivas.

- Boa acessibilidade.

8. Performance e qualidade

- Componentes reutilizáveis.

- Lazy loading quando apropriado.

- SEO básico.

- Meta tags.

- URLs amigáveis para notícias.

- Estados de loading e erro.

- Não deixar páginas vazias ou botões sem função.

IMPORTANTE SOBRE ARQUITETURA:

Não faça uma migração destrutiva para outro banco ou serviço.

A arquitetura deverá ficar preparada para trabalhar posteriormente com:

- Supabase Auth/Storage

- MySQL/Drizzle

- Express

- tRPC

Se algum recurso ainda não puder ser conectado, crie a estrutura de integração sem substituir a arquitetura por serviços fictícios.

Primeiro construa o projeto completo e funcional com dados de exemplo realistas. Depois deixe o código organizado para conexão com o GitHub.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/50a4b9f4-d0a8-4f19-a810-c59546a0d4f9).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
