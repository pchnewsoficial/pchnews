# Segurança — PCH News

## Reportar uma vulnerabilidade

Não publique detalhes de uma vulnerabilidade de segurança em issue pública.

Para vulnerabilidades que possam comprometer autenticação, autorização, dados editoriais, banco de dados, segredos, API ou infraestrutura, entre em contato com os mantenedores por um canal privado disponível no perfil da organização/repositório.

## Escopo prioritário

- Supabase Auth e controle de acesso editorial
- Row Level Security (RLS) e políticas PostgreSQL
- APIs/Workers e validação de tokens
- exposição de service-role keys, secrets ou credenciais
- GitHub Actions e cadeia de build/deploy
- alterações não autorizadas no conteúdo editorial
- upload e armazenamento de mídia
- vulnerabilidades em dependências

## Boas práticas do projeto

- O banco Supabase é a fonte de verdade do conteúdo editorial.
- Segredos e service-role keys não devem ser enviados ao frontend.
- Toda alteração de schema/RLS deve ser versionada em supabase/migrations/.
- Mudanças de segurança devem ser validadas antes de publicação.
- Alertas de dependências e code scanning devem ser tratados antes de uma release quando indicarem risco relevante.

## Resposta

Ao receber um relato válido, os mantenedores devem avaliar impacto, reproduzir o problema em ambiente controlado, corrigir a vulnerabilidade e, quando necessário, rotacionar credenciais afetadas.
