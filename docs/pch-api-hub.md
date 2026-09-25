# PCH API HUB

Camada única do PCH News para integrações externas. O objetivo é manter chaves fora do navegador, centralizar timeout/retry, permitir cache e evitar acoplamento do editor a fornecedores específicos.

## Matriz inicial

| API | Categoria | Finalidade no PCH | Chave | HTTPS | CORS no catálogo | Custo | Limite | Execução | Status |
|---|---|---|---|---|---|---|---|---|---|
| Open-Meteo | Clima | previsão e contexto meteorológico | não | sim | sim | não verificado | não verificado | server/browser | pronta |
| Banco Central do Brasil | Dados públicos/economia | séries econômicas oficiais | não | sim | não informado | não verificado | não verificado | server | pronta |
| OpenStreetMap/Nominatim | Geolocalização | geocodificação | não | sim | não informado | não verificado | não verificado | server | preparada |
| Image-Charts | Gráficos/QR | visualizações e QR | não | sim | sim | não verificado | não verificado | server | preparada |
| Mediastack | Notícias | radar/descoberta de notícias | sim | sim | não informado | plano do fornecedor; não verificado | não verificado | server | preparada |
| Currents | Notícias | radar/descoberta de notícias | sim | sim | sim | plano do fornecedor; não verificado | não verificado | server | preparada |
| API-FOOTBALL | Esportes | resultados/tabelas | sim | sim | não informado | plano do fornecedor; não verificado | não verificado | server | preparada |
| TheSportsDB | Esportes | equipes, placares e arte | conforme fornecedor | sim | não informado | não verificado | não verificado | server | preparada |
| FIPE/veículos | Veículos | preços e dados de veículos | não | sim | não informado | não verificado | não verificado | server | preparada |

Os metadados de HTTPS/CORS acima são os registrados no catálogo comunitário public-apis/public-apis quando disponíveis. Preço, limite, licença, SLA e uso comercial devem ser confirmados no fornecedor antes de produção; não são inferidos do catálogo.

## Variáveis de ambiente

- `MEDIASTACK_API_KEY` — somente servidor.
- `CURRENTS_API_KEY` — somente servidor.
- `API_FOOTBALL_KEY` — somente servidor quando o adapter for ativado.
- `VITE_CLARITY_PROJECT_ID` — identificador público do projeto Microsoft Clarity; não é segredo.

Nunca coloque chaves privadas em variáveis `VITE_*`.

## Microsoft Clarity

O PCH News inicializa o Microsoft Clarity somente quando `VITE_CLARITY_PROJECT_ID` estiver configurado. A integração usa o script oficial, é compatível com React SPA e registra `page_view` nas mudanças de rota. Não envie PII, tokens, conteúdo de formulários ou segredos em eventos.

Para configurar: crie/abra o projeto no Microsoft Clarity, copie o Project ID e disponibilize `VITE_CLARITY_PROJECT_ID` no ambiente de build do frontend. Depois valide no painel do Clarity se sessões e page views aparecem.

Clarity também oferece integração com Google Analytics; os dois podem coexistir no PCH News.

Fontes: https://github.com/public-apis/public-apis — catálogo de descoberta; https://clarity.microsoft.com/ — produto oficial; https://clarity.microsoft.com/integrations — integrações oficiais.

## Arquitetura

`frontend -> PCH API HUB -> provider externo`

Providers com chave devem ser acessados pelo servidor. Falhas externas devem ser tratadas como falhas de enriquecimento, nunca como motivo para derrubar o editor/publicação.