import manchete from "@/assets/manchete-congresso.jpg";
import urnas from "@/assets/politica-urnas.jpg";
import mercado from "@/assets/economia-mercado.jpg";
import porto from "@/assets/porto-exportacao.jpg";
import eolica from "@/assets/energia-eolica.jpg";
import chip from "@/assets/tecnologia-chip.jpg";
import teatro from "@/assets/cultura-teatro.jpg";
import estadio from "@/assets/esporte-estadio.jpg";
import helenaFoto from "@/assets/colunista-helena.jpg";
import rafaelFoto from "@/assets/colunista-rafael.jpg";
import beatrizFoto from "@/assets/colunista-beatriz.jpg";
import tiagoFoto from "@/assets/colunista-tiago.jpg";

/** Data de referência da edição de exemplo (mantém "há X horas" estável). */
export const EDITION_NOW = "2026-03-18T18:00:00-03:00";
export const EDITION_NUMBER = "4.218";

export type ArticleStatus = "publicado" | "rascunho" | "revisao";
export type CommentStatus = "aprovado" | "pendente" | "reprovado";

export interface Category {
  slug: string;
  name: string;
  description: string;
}

export interface Columnist {
  slug: string;
  name: string;
  beat: string;
  shortBio: string;
  bio: string[];
  photo: string;
  since: number;
}

export interface Article {
  slug: string;
  title: string;
  subtitle: string;
  excerpt: string;
  category: string;
  authorSlug: string;
  publishedAt: string;
  readingMinutes: number;
  image: string;
  imageCredit: string;
  body: string[];
  status: ArticleStatus;
  isHeadline?: boolean;
  inCarousel?: boolean;
  views: number;
}

export interface Comment {
  id: string;
  articleSlug: string;
  author: string;
  email: string;
  text: string;
  createdAt: string;
  status: CommentStatus;
}

export const categories: Category[] = [
  {
    slug: "politica",
    name: "Política",
    description: "Congresso, tribunais, eleições e os bastidores das decisões públicas.",
  },
  {
    slug: "economia",
    name: "Economia",
    description: "Juros, câmbio, emprego e o efeito prático das contas do país.",
  },
  {
    slug: "tecnologia",
    name: "Tecnologia",
    description: "Inovação, dados, indústria e o impacto social das máquinas.",
  },
  {
    slug: "cultura",
    name: "Cultura",
    description: "Teatro, cinema, literatura e as disputas de memória do presente.",
  },
  {
    slug: "esporte",
    name: "Esporte",
    description: "Apuração além do placar: gestão, atletas e política esportiva.",
  },
  {
    slug: "opiniao",
    name: "Opinião",
    description: "Colunas assinadas pela equipe do PCH News.",
  },
];

export const columnists: Columnist[] = [
  {
    slug: "helena-vasques",
    name: "Helena Vasques",
    beat: "Política",
    shortBio: "Cobre Congresso e Judiciário há 18 anos.",
    bio: [
      "Helena Vasques é repórter especial de política do PCH News. Acompanha o Congresso Nacional desde 2008 e assina reportagens sobre financiamento de campanha, reforma tributária e relação entre Executivo e Judiciário.",
      "Formada em jornalismo com mestrado em ciência política, foi correspondente em Brasília por dez anos antes de assumir a coluna semanal do portal.",
    ],
    photo: helenaFoto,
    since: 2019,
  },
  {
    slug: "rafael-munhoz",
    name: "Rafael Munhoz",
    beat: "Economia",
    shortBio: "Analisa política monetária e contas públicas.",
    bio: [
      "Rafael Munhoz escreve sobre economia com foco em política monetária, mercado de crédito e orçamento federal. Antes do PCH News, trabalhou em veículos especializados em finanças e consultorias de risco.",
      "Sua coluna traduz decisões técnicas do Banco Central em consequências concretas para salário, dívida e preço da comida.",
    ],
    photo: rafaelFoto,
    since: 2020,
  },
  {
    slug: "beatriz-lemos",
    name: "Beatriz Lemos",
    beat: "Cultura",
    shortBio: "Crítica cultural e pesquisadora de memória.",
    bio: [
      "Beatriz Lemos é crítica cultural, curadora e pesquisadora de acervos. Escreve sobre artes visuais, teatro e políticas públicas de cultura.",
      "Defende que a crítica é um serviço público: ajuda o leitor a decidir onde investir seu tempo e sua atenção.",
    ],
    photo: beatrizFoto,
    since: 2021,
  },
  {
    slug: "tiago-alencar",
    name: "Tiago Alencar",
    beat: "Tecnologia",
    shortBio: "Investiga algoritmos, dados e trabalho digital.",
    bio: [
      "Tiago Alencar cobre tecnologia com ênfase em automação, proteção de dados e plataformas de trabalho. É engenheiro de formação e virou jornalista depois de sete anos como desenvolvedor.",
      "Na coluna, examina quem ganha e quem perde quando uma decisão humana é transferida para um sistema.",
    ],
    photo: tiagoFoto,
    since: 2022,
  },
];

export const articles: Article[] = [
  {
    slug: "reforma-tributaria-entra-na-reta-final",
    title: "Reforma tributária entra na reta final e divide o Congresso",
    subtitle:
      "Governo articula a base para votar o texto-base até sexta; oposição pede prazo maior e ameaça obstruir a pauta.",
    excerpt:
      "Relator apresenta novo parecer com transição de oito anos; estados do Norte e do Nordeste cobram fundo de compensação.",
    category: "politica",
    authorSlug: "helena-vasques",
    publishedAt: "2026-03-18T17:18:00-03:00",
    readingMinutes: 7,
    image: manchete,
    imageCredit: "PCH News / Arquivo",
    body: [
      "O texto-base da reforma tributária voltou ao plenário nesta quarta-feira com mudanças no cronograma de transição e um novo desenho do fundo de compensação entre estados. A articulação do governo trabalha para concluir a votação até sexta-feira, antes do recesso das comissões.",
      "Segundo três parlamentares que participaram das reuniões, o relator aceitou estender a transição de seis para oito anos e criou uma trava de arrecadação para municípios com menos de 50 mil habitantes. A mudança respondeu à pressão de bancadas do Norte e do Nordeste.",
      "A oposição contesta o ritmo. Para líderes de dois partidos, o parecer chegou tarde demais para ser analisado com rigor e a votação deveria ficar para abril, depois de novas audiências públicas com secretarias estaduais de fazenda.",
      "## O que muda para quem paga",
      "Na prática, a proposta unifica cinco tributos em dois — um federal e outro compartilhado entre estados e municípios. A promessa é de neutralidade de carga: o total arrecadado permanece o mesmo, mas a distribuição entre setores se altera.",
      "Serviços intensivos em mão de obra tendem a sentir mais o ajuste, enquanto a indústria e o agronegócio projetam redução de custo logístico com o fim da cobrança em cascata.",
      "\"Não existe reforma sem perdedor. Existe reforma com transição previsível\", resumiu uma técnica do Ministério da Fazenda que acompanha o grupo de trabalho.",
      "O relatório final deve ser publicado na quinta-feira. Se aprovado, o texto segue para o Senado, onde já há pedido de audiência com representantes de 14 setores.",
    ],
    status: "publicado",
    isHeadline: true,
    views: 24180,
  },
  {
    slug: "copom-sinaliza-corte-de-juros",
    title: "Copom sinaliza corte de juros já na próxima reunião",
    subtitle:
      "Ata aponta inflação de serviços como principal obstáculo, mas indica espaço para afrouxamento gradual.",
    excerpt:
      "Comunicado retira a expressão \"cautela adicional\" e mercado passa a projetar queda de 0,5 ponto em maio.",
    category: "economia",
    authorSlug: "rafael-munhoz",
    publishedAt: "2026-03-18T15:40:00-03:00",
    readingMinutes: 5,
    image: mercado,
    imageCredit: "PCH News / Mercado",
    body: [
      "A ata do Comitê de Política Monetária publicada nesta quarta-feira reforçou a leitura de que o ciclo de queda de juros deve começar na próxima reunião. O documento retirou a menção a \"cautela adicional\" presente no comunicado anterior.",
      "Analistas de sete casas consultadas pelo PCH News passaram a projetar corte de 0,5 ponto percentual em maio, com outra redução da mesma magnitude em junho.",
      "O comitê ressalva que a inflação de serviços continua acima da meta e depende do comportamento do mercado de trabalho, hoje aquecido em cinco das seis regiões metropolitanas monitoradas.",
      "## Efeito no crédito",
      "Para o crédito às famílias, a transmissão não é imediata: bancos costumam repassar a redução com dois a três meses de atraso, e linhas rotativas praticamente não acompanham o movimento.",
      "O impacto mais rápido aparece no custo de capital das empresas de capital aberto e na renegociação de dívida corporativa indexada ao CDI.",
    ],
    status: "publicado",
    inCarousel: true,
    views: 15320,
  },
  {
    slug: "chip-nacional-chega-ao-mercado",
    title: "Primeiro chip de projeto nacional chega ao mercado em 2027",
    subtitle:
      "Consórcio entre três universidades e uma fabricante paulista conclui validação do protótipo em Campinas.",
    excerpt:
      "Peça é voltada a sensores industriais e deve reduzir dependência de importação em equipamentos agrícolas.",
    category: "tecnologia",
    authorSlug: "tiago-alencar",
    publishedAt: "2026-03-18T14:05:00-03:00",
    readingMinutes: 6,
    image: chip,
    imageCredit: "PCH News / Tecnologia",
    body: [
      "Um consórcio formado por três universidades públicas e uma fabricante de eletrônicos do interior de São Paulo concluiu a validação do primeiro chip com projeto integralmente nacional voltado a sensores industriais.",
      "A produção em escala deve começar no segundo semestre de 2027, em linha de montagem instalada em Campinas. O encapsulamento continuará sendo feito no exterior nos dois primeiros anos.",
      "Segundo os coordenadores do projeto, a peça atende a equipamentos agrícolas e sistemas de monitoramento de energia, dois mercados que hoje dependem quase integralmente de importação.",
      "## Gargalo de mão de obra",
      "O desafio declarado não é técnico, e sim de pessoal: o setor estima faltar cerca de 4 mil engenheiros especializados em projeto de circuitos no país.",
      "Três programas de formação começam em agosto, com bolsas financiadas por fundos setoriais e contrapartida das empresas participantes.",
    ],
    status: "publicado",
    inCarousel: true,
    views: 9870,
  },
  {
    slug: "teatro-municipal-reabre-apos-restauro",
    title: "Teatro Municipal reabre após dois anos de restauro",
    subtitle:
      "Temporada de estreia terá ópera, recitais gratuitos e programa de formação para escolas públicas.",
    excerpt:
      "Obra recuperou o forro original da plateia e substituiu todo o sistema elétrico do edifício centenário.",
    category: "cultura",
    authorSlug: "beatriz-lemos",
    publishedAt: "2026-03-18T12:30:00-03:00",
    readingMinutes: 4,
    image: teatro,
    imageCredit: "PCH News / Cultura",
    body: [
      "Depois de dois anos fechado, o Teatro Municipal reabre no próximo sábado com uma temporada que combina ópera, recitais gratuitos e um programa de formação de plateia voltado a escolas públicas.",
      "O restauro recuperou o forro original da plateia, refez a instalação elétrica completa e devolveu ao foyer o piso de mosaico encontrado sob três camadas de reforma dos anos 1970.",
      "A programação inaugural prevê 42 apresentações até dezembro, sendo 12 com ingresso gratuito distribuído por sorteio digital.",
      "\"Restaurar um teatro é reconhecer que a cidade tem memória e quer continuar usando esse espaço\", diz a diretora artística da casa.",
      "A bilheteria física volta a funcionar na sexta-feira, das 10h às 18h.",
    ],
    status: "publicado",
    inCarousel: true,
    views: 7410,
  },
  {
    slug: "classico-decide-lideranca-do-estadual",
    title: "Clássico decide liderança do estadual neste domingo",
    subtitle:
      "Equipes chegam separadas por um ponto e com elencos desfalcados pela convocação da seleção.",
    excerpt:
      "Estádio esgotou a carga de ingressos em quatro horas; clubes negociam ampliação do setor visitante.",
    category: "esporte",
    authorSlug: "rafael-munhoz",
    publishedAt: "2026-03-18T11:12:00-03:00",
    readingMinutes: 4,
    image: estadio,
    imageCredit: "PCH News / Esporte",
    body: [
      "O clássico de domingo define a liderança do campeonato estadual com as duas equipes separadas por um ponto na tabela e sete jogos pela frente.",
      "Os treinadores confirmaram desfalques: três titulares foram convocados para a seleção e outro cumpre suspensão automática.",
      "A carga inicial de ingressos esgotou em quatro horas. Os clubes negociam com a federação a ampliação do setor visitante de 8% para 10% da capacidade.",
      "## Arrecadação recorde",
      "Com bilheteria cheia, a partida deve render a maior renda da competição nos últimos cinco anos, valor que será dividido conforme o regulamento entre clubes e federação.",
    ],
    status: "publicado",
    inCarousel: true,
    views: 11260,
  },
  {
    slug: "leilao-de-energia-eolica-atrai-investidores",
    title: "Leilão de energia eólica atrai 14 grupos investidores",
    subtitle:
      "Contratos somam R$ 9 bilhões em novos parques no Nordeste, com entrega prevista a partir de 2029.",
    excerpt:
      "Preço médio ficou 11% abaixo do teto e três consórcios estrangeiros venceram lotes na Bahia e no Piauí.",
    category: "economia",
    authorSlug: "rafael-munhoz",
    publishedAt: "2026-03-18T09:50:00-03:00",
    readingMinutes: 5,
    image: eolica,
    imageCredit: "PCH News / Energia",
    body: [
      "O leilão de energia nova reuniu 14 grupos investidores e contratou R$ 9 bilhões em parques eólicos, concentrados na Bahia, no Piauí e no Rio Grande do Norte.",
      "O preço médio fechou 11% abaixo do teto estabelecido no edital, resultado atribuído pelo setor à redução do custo de turbinas e ao câmbio mais estável.",
      "A entrega dos primeiros parques está prevista para 2029. O gargalo declarado pelos vencedores é a linha de transmissão: dois lotes dependem de obras ainda não licitadas.",
      "## Emprego local",
      "Municípios do semiárido projetam 6 mil vagas diretas na fase de construção, com pico entre 2028 e 2029.",
    ],
    status: "publicado",
    inCarousel: true,
    views: 6120,
  },
  {
    slug: "senado-aprova-pec-da-autonomia-municipal",
    title: "Senado aprova PEC que amplia autonomia municipal",
    subtitle: "Texto segue para a Câmara e deve ser votado na próxima semana em comissão especial.",
    excerpt:
      "Proposta transfere a prefeituras a gestão de três programas federais de atenção básica em saúde.",
    category: "politica",
    authorSlug: "helena-vasques",
    publishedAt: "2026-03-18T08:20:00-03:00",
    readingMinutes: 5,
    image: urnas,
    imageCredit: "PCH News / Política",
    body: [
      "O Senado aprovou em segundo turno a proposta de emenda constitucional que amplia a autonomia dos municípios na gestão de programas de atenção básica em saúde.",
      "A PEC transfere a prefeituras a execução de três programas hoje coordenados pelo governo federal, mantendo o repasse vinculado a metas de cobertura.",
      "Entidades municipalistas comemoraram. Conselhos de saúde alertam que, sem reforço de equipe técnica, cidades pequenas podem perder capacidade de fiscalização.",
      "O texto vai à Câmara, onde a relatoria deve ser definida na próxima semana.",
    ],
    status: "publicado",
    views: 5280,
  },
  {
    slug: "exportacoes-de-graos-crescem-no-trimestre",
    title: "Exportações de grãos crescem 12% no trimestre",
    subtitle: "Portos operam acima da capacidade em plena safra e filas de caminhões voltam às rodovias.",
    excerpt:
      "Terminais do Sul e do Sudeste registram espera média de 19 horas para descarga; setor pede obras de acesso.",
    category: "economia",
    authorSlug: "rafael-munhoz",
    publishedAt: "2026-03-17T19:05:00-03:00",
    readingMinutes: 5,
    image: porto,
    imageCredit: "PCH News / Logística",
    body: [
      "As exportações de grãos cresceram 12% no primeiro trimestre em comparação com o mesmo período do ano anterior, segundo dados consolidados pelos terminais portuários.",
      "A alta pressionou a infraestrutura: a espera média para descarga chegou a 19 horas em dois terminais do Sul e do Sudeste.",
      "Transportadoras relatam filas de até 11 quilômetros nos acessos rodoviários, com reflexo no custo do frete e no prazo de contratos de venda.",
      "## Obras travadas",
      "Três projetos de ampliação de acesso estão parados por pendências ambientais e disputas de desapropriação, algumas com mais de seis anos.",
    ],
    status: "publicado",
    views: 4390,
  },
  {
    slug: "startups-brasileiras-captam-recorde-em-ia",
    title: "Startups brasileiras captam US$ 2,3 bilhões em inteligência artificial",
    subtitle: "Capital estrangeiro responde por 70% do valor aportado no trimestre.",
    excerpt:
      "Levantamento mapeia 340 empresas em sete estados; São Paulo concentra metade dos aportes.",
    category: "tecnologia",
    authorSlug: "tiago-alencar",
    publishedAt: "2026-03-17T16:40:00-03:00",
    readingMinutes: 6,
    image: mercado,
    imageCredit: "PCH News / Tecnologia",
    body: [
      "Startups brasileiras que desenvolvem produtos de inteligência artificial captaram US$ 2,3 bilhões no primeiro trimestre, segundo levantamento com 340 empresas em sete estados.",
      "Fundos estrangeiros responderam por 70% do valor. São Paulo concentrou metade dos aportes, seguida por Minas Gerais e Pernambuco.",
      "A maior parte das rodadas foi destinada a soluções corporativas: atendimento, análise de crédito e automação de processos jurídicos.",
      "## Concentração preocupa",
      "Pesquisadores alertam que quatro empresas absorveram 38% do total, o que aumenta o risco de dependência tecnológica em setores críticos.",
    ],
    status: "publicado",
    views: 8130,
  },
  {
    slug: "bienal-anuncia-programacao-com-40-paises",
    title: "Bienal anuncia programação com artistas de 40 países",
    subtitle: "Curadoria tem foco em arquivos, arte digital e obras produzidas em territórios indígenas.",
    excerpt:
      "Mostra ocupa três andares do pavilhão e inclui residência artística de oito semanas.",
    category: "cultura",
    authorSlug: "beatriz-lemos",
    publishedAt: "2026-03-17T14:15:00-03:00",
    readingMinutes: 4,
    image: teatro,
    imageCredit: "PCH News / Cultura",
    body: [
      "A próxima edição da Bienal terá obras de artistas de 40 países, com curadoria organizada em três eixos: arquivos, arte digital e produção em territórios indígenas.",
      "A mostra ocupará três andares do pavilhão e inclui uma residência artística de oito semanas com 12 selecionados por edital público.",
      "A entrada será gratuita durante toda a temporada, com agendamento on-line para grupos escolares.",
    ],
    status: "publicado",
    views: 3980,
  },
  {
    slug: "atleta-quebra-recorde-sul-americano",
    title: "Atleta brasileira quebra recorde sul-americano dos 400 metros",
    subtitle: "Marca garante vaga no mundial de agosto e coloca a prova em novo patamar técnico.",
    excerpt:
      "Resultado veio em etapa disputada no Rio; comissão técnica projeta ajuste de ritmo nos últimos 100 metros.",
    category: "esporte",
    authorSlug: "tiago-alencar",
    publishedAt: "2026-03-17T10:05:00-03:00",
    readingMinutes: 3,
    image: estadio,
    imageCredit: "PCH News / Esporte",
    body: [
      "A corredora brasileira estabeleceu novo recorde sul-americano dos 400 metros em etapa disputada no Rio de Janeiro, com marca que garante vaga direta no mundial de agosto.",
      "A comissão técnica apontou ganho de eficiência na curva final e projeta novos ajustes de ritmo nos últimos 100 metros.",
      "A atleta disputa em abril a etapa europeia do circuito, primeira de três provas antes do mundial.",
    ],
    status: "publicado",
    views: 5610,
  },
  {
    slug: "documentario-sobre-mata-atlantica-estreia",
    title: "Documentário sobre a mata atlântica estreia em circuito nacional",
    subtitle: "Produção levou três anos e reuniu 200 horas de gravação em seis estados.",
    excerpt:
      "Filme acompanha oito famílias que vivem de restauração florestal no corredor entre Bahia e Espírito Santo.",
    category: "cultura",
    authorSlug: "beatriz-lemos",
    publishedAt: "2026-03-16T18:00:00-03:00",
    readingMinutes: 4,
    image: eolica,
    imageCredit: "PCH News / Cultura",
    body: [
      "O documentário estreia em 38 salas e acompanha oito famílias que vivem da restauração florestal no corredor entre o sul da Bahia e o norte do Espírito Santo.",
      "A produção levou três anos e reuniu 200 horas de gravação em seis estados, com equipe reduzida e captação de som direto.",
      "Depois do circuito comercial, o filme será disponibilizado para exibição escolar com material didático de acompanhamento.",
    ],
    status: "publicado",
    views: 2870,
  },
  {
    slug: "governo-detalha-transicao-fiscal",
    title: "Governo detalha transição fiscal e admite revisão de meta",
    subtitle: "Equipe econômica apresenta cenário alternativo com ajuste de despesa obrigatória.",
    excerpt:
      "Documento enviado ao Congresso prevê três faixas de resultado primário até 2029.",
    category: "politica",
    authorSlug: "helena-vasques",
    publishedAt: "2026-03-16T09:30:00-03:00",
    readingMinutes: 6,
    image: manchete,
    imageCredit: "PCH News / Política",
    body: [
      "A equipe econômica enviou ao Congresso documento que detalha a transição fiscal em três faixas de resultado primário até 2029 e admite revisão da meta atual.",
      "O cenário alternativo prevê contenção de despesa obrigatória e revisão de benefícios tributários a partir do próximo orçamento.",
      "Relatores das comissões de finanças pediram audiência conjunta para discutir os números antes da votação da lei de diretrizes orçamentárias.",
    ],
    status: "publicado",
    views: 6740,
  },
  {
    slug: "inteligencia-artificial-no-servico-publico",
    title: "Tribunais ampliam uso de inteligência artificial em triagem de processos",
    subtitle: "Levantamento identifica 27 sistemas em operação e apenas nove com auditoria publicada.",
    excerpt:
      "Especialistas cobram transparência sobre critérios de classificação e registro de decisões revisadas.",
    category: "tecnologia",
    authorSlug: "tiago-alencar",
    publishedAt: "2026-03-15T15:20:00-03:00",
    readingMinutes: 7,
    image: chip,
    imageCredit: "PCH News / Tecnologia",
    body: [
      "Vinte e sete sistemas de inteligência artificial estão em operação em tribunais brasileiros para triagem e classificação de processos, aponta levantamento obtido pelo PCH News.",
      "Apenas nove deles têm relatório de auditoria publicado. Em 11 casos, não há registro público dos critérios usados para priorizar processos.",
      "Pesquisadores de direito digital defendem a publicação obrigatória de documentação técnica e de taxa de revisão humana das decisões sugeridas.",
      "## O que dizem os tribunais",
      "Procurados, seis tribunais afirmaram que os sistemas apenas organizam a fila de análise e que nenhuma decisão de mérito é automatizada.",
    ],
    status: "publicado",
    views: 7020,
  },
  {
    slug: "rascunho-plano-de-mobilidade-urbana",
    title: "Plano de mobilidade urbana prevê 120 km de faixas exclusivas",
    subtitle: "Minuta em apuração; dados ainda em conferência com as secretarias municipais.",
    excerpt: "Matéria em produção pela editoria de cidades.",
    category: "politica",
    authorSlug: "helena-vasques",
    publishedAt: "2026-03-18T16:00:00-03:00",
    readingMinutes: 5,
    image: urnas,
    imageCredit: "PCH News",
    body: [
      "Conteúdo em apuração. Os números de extensão das faixas exclusivas ainda estão sendo conferidos junto às secretarias municipais de mobilidade.",
    ],
    status: "rascunho",
    views: 0,
  },
  {
    slug: "revisao-caixa-dagua-do-semiarido",
    title: "Programa de cisternas no semiárido tem fila de 90 mil famílias",
    subtitle: "Reportagem em revisão de texto e checagem de dados.",
    excerpt: "Matéria aguardando revisão final antes da publicação.",
    category: "politica",
    authorSlug: "helena-vasques",
    publishedAt: "2026-03-18T13:00:00-03:00",
    readingMinutes: 8,
    image: eolica,
    imageCredit: "PCH News",
    body: ["Conteúdo em revisão final pela editoria."],
    status: "revisao",
    views: 0,
  },
  {
    slug: "o-custo-de-esperar-a-proxima-eleicao",
    title: "O custo de esperar a próxima eleição",
    subtitle: "Por que o debate fiscal não pode ser adiado por mais um ciclo político.",
    excerpt:
      "Cada ano de postergação encarece o ajuste e transfere a conta para quem tem menos margem de defesa.",
    category: "opiniao",
    authorSlug: "helena-vasques",
    publishedAt: "2026-03-18T07:00:00-03:00",
    readingMinutes: 4,
    image: manchete,
    imageCredit: "PCH News / Opinião",
    body: [
      "Há uma tradição confortável em Brasília: empurrar o problema difícil para depois da eleição. O cálculo é sempre o mesmo e, do ponto de vista eleitoral, sempre racional.",
      "O problema é que a conta não congela enquanto o Congresso espera. Ela rende juros.",
      "\"Adiar não é neutro. É uma escolha com beneficiários bem definidos.\"",
      "Discutir tributação em ano de disputa é ingrato, mas é o único momento em que o eleitor consegue cobrar posição registrada. Talvez seja exatamente por isso que o tema desaparece da agenda.",
    ],
    status: "publicado",
    views: 4120,
  },
  {
    slug: "juros-altos-a-conta-que-ninguem-quer-pagar",
    title: "Juros altos: a conta que ninguém quer pagar",
    subtitle: "O debate público confunde causa e sintoma — e o crédito das famílias paga a diferença.",
    excerpt:
      "Enquanto a discussão fica presa na taxa básica, o custo real do endividamento doméstico segue fora do radar.",
    category: "opiniao",
    authorSlug: "rafael-munhoz",
    publishedAt: "2026-03-17T07:00:00-03:00",
    readingMinutes: 4,
    image: mercado,
    imageCredit: "PCH News / Opinião",
    body: [
      "Toda discussão sobre juros no Brasil começa pela taxa básica e termina antes de chegar ao ponto que interessa: o spread.",
      "É no intervalo entre o que o banco capta e o que ele cobra que mora a maior parte da dor do endividamento das famílias.",
      "\"A taxa básica é a manchete. O spread é a fatura.\"",
      "Sem transparência de custo por linha de crédito, qualquer corte na Selic vira promessa que não desce até o consumidor.",
    ],
    status: "publicado",
    views: 3610,
  },
  {
    slug: "a-arte-que-insiste-em-incomodar",
    title: "A arte que insiste em incomodar",
    subtitle: "A reabertura do Municipal recoloca uma pergunta antiga: para quem serve o teatro público?",
    excerpt:
      "Restaurar um prédio é a parte simples. Difícil é garantir que a plateia mude junto com a fachada.",
    category: "opiniao",
    authorSlug: "beatriz-lemos",
    publishedAt: "2026-03-16T07:00:00-03:00",
    readingMinutes: 3,
    image: teatro,
    imageCredit: "PCH News / Opinião",
    body: [
      "O forro recuperado do Municipal é bonito e merece a festa que terá. Mas nenhuma obra de restauro responde sozinha à pergunta que importa: quem entra?",
      "Programa de formação de plateia não é cortesia institucional, é política pública com metas verificáveis.",
      "\"Um teatro cheio de sempre os mesmos é um teatro pela metade.\"",
      "A temporada inaugural tem 12 apresentações gratuitas. É um começo — e é pouco para uma cidade deste tamanho.",
    ],
    status: "publicado",
    views: 2960,
  },
  {
    slug: "o-algoritmo-que-decide-quem-voce-contrata",
    title: "O algoritmo que decide quem você contrata",
    subtitle: "Sistemas de triagem já filtram currículos sem que ninguém assuma o critério.",
    excerpt:
      "Quando a recusa vem de um modelo, o candidato perde até o direito de saber o motivo.",
    category: "opiniao",
    authorSlug: "tiago-alencar",
    publishedAt: "2026-03-15T07:00:00-03:00",
    readingMinutes: 5,
    image: chip,
    imageCredit: "PCH News / Opinião",
    body: [
      "Automatizar a triagem de currículos economiza tempo do recrutador e transfere um custo invisível para o candidato: a ausência de explicação.",
      "Modelos treinados em contratações passadas aprendem as preferências do passado. Inclusive as que a empresa diz ter abandonado.",
      "\"Todo sistema de seleção carrega a visão de quem o escreveu.\"",
      "A saída não é abandonar a tecnologia, e sim exigir registro auditável de critério, taxa de revisão humana e direito a resposta.",
    ],
    status: "publicado",
    views: 4480,
  },
];

export const comments: Comment[] = [
  {
    id: "c-1",
    articleSlug: "reforma-tributaria-entra-na-reta-final",
    author: "Marcos Ribeiro",
    email: "marcos.ribeiro@exemplo.com.br",
    text: "Faltou explicar o impacto para prestadores de serviço autônomos. Podem detalhar em uma próxima matéria?",
    createdAt: "2026-03-18T17:42:00-03:00",
    status: "pendente",
  },
  {
    id: "c-2",
    articleSlug: "copom-sinaliza-corte-de-juros",
    author: "Ana Paula Cordeiro",
    email: "anapaula@exemplo.com.br",
    text: "Excelente leitura da ata. O trecho sobre repasse ao crédito das famílias foi o mais esclarecedor.",
    createdAt: "2026-03-18T16:10:00-03:00",
    status: "aprovado",
  },
  {
    id: "c-3",
    articleSlug: "chip-nacional-chega-ao-mercado",
    author: "Eduardo Lins",
    email: "eduardo.lins@exemplo.com.br",
    text: "Trabalho na área e o gargalo de engenheiros é ainda maior do que o citado.",
    createdAt: "2026-03-18T15:02:00-03:00",
    status: "pendente",
  },
  {
    id: "c-4",
    articleSlug: "teatro-municipal-reabre-apos-restauro",
    author: "Sem identificação",
    email: "anon@exemplo.com",
    text: "COMPREM INGRESSOS NO MEU SITE PROMOCIONAL >>> link",
    createdAt: "2026-03-18T14:20:00-03:00",
    status: "reprovado",
  },
  {
    id: "c-5",
    articleSlug: "classico-decide-lideranca-do-estadual",
    author: "Juliana Prado",
    email: "juliana.prado@exemplo.com.br",
    text: "A divisão da renda entre clubes e federação merecia uma reportagem própria.",
    createdAt: "2026-03-18T12:55:00-03:00",
    status: "pendente",
  },
  {
    id: "c-6",
    articleSlug: "o-algoritmo-que-decide-quem-voce-contrata",
    author: "Renata Figueiredo",
    email: "renata.f@exemplo.com.br",
    text: "Coluna certeira. Passei por processo assim e nunca recebi justificativa.",
    createdAt: "2026-03-17T20:30:00-03:00",
    status: "aprovado",
  },
];

export interface AdminNotification {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  read: boolean;
  kind: "comentario" | "materia" | "sistema";
}

export const notifications: AdminNotification[] = [
  {
    id: "n-1",
    title: "3 comentários aguardando moderação",
    description: "Matérias de política, tecnologia e esporte receberam novos comentários.",
    createdAt: "2026-03-18T17:45:00-03:00",
    read: false,
    kind: "comentario",
  },
  {
    id: "n-2",
    title: "Matéria enviada para revisão",
    description: "\"Programa de cisternas no semiárido\" foi enviada por Helena Vasques.",
    createdAt: "2026-03-18T13:05:00-03:00",
    read: false,
    kind: "materia",
  },
  {
    id: "n-3",
    title: "Rascunho sem imagem principal",
    description: "\"Plano de mobilidade urbana\" está sem crédito de foto definido.",
    createdAt: "2026-03-18T10:20:00-03:00",
    read: true,
    kind: "sistema",
  },
  {
    id: "n-4",
    title: "Coluna publicada",
    description: "\"O custo de esperar a próxima eleição\" foi ao ar às 7h.",
    createdAt: "2026-03-18T07:02:00-03:00",
    read: true,
    kind: "materia",
  },
];

// ————— Consultas de leitura —————

export const publishedArticles = (): Article[] =>
  articles
    .filter((article) => article.status === "publicado")
    .sort((a, b) => +new Date(b.publishedAt) - +new Date(a.publishedAt));

export const getHeadline = (): Article | undefined =>
  publishedArticles().find((article) => article.isHeadline);

export const getCarouselArticles = (): Article[] =>
  publishedArticles().filter((article) => article.inCarousel);

export const getLatest = (limit?: number): Article[] => {
  const list = publishedArticles().filter((article) => !article.isHeadline);
  return typeof limit === "number" ? list.slice(0, limit) : list;
};

export const getByCategory = (slug: string): Article[] =>
  publishedArticles().filter((article) => article.category === slug);

export const getByAuthor = (slug: string): Article[] =>
  publishedArticles().filter((article) => article.authorSlug === slug);

export const getArticle = (slug: string): Article | undefined =>
  articles.find((article) => article.slug === slug);

export const getCategory = (slug: string): Category | undefined =>
  categories.find((category) => category.slug === slug);

export const getColumnist = (slug: string): Columnist | undefined =>
  columnists.find((columnist) => columnist.slug === slug);

export const getColumnistName = (slug: string): string =>
  getColumnist(slug)?.name ?? "Redação PCH News";

export const getRelated = (article: Article, limit = 3): Article[] => {
  const sameCategory = publishedArticles().filter(
    (item) => item.category === article.category && item.slug !== article.slug,
  );
  const fallback = publishedArticles().filter(
    (item) => item.category !== article.category && item.slug !== article.slug,
  );
  return [...sameCategory, ...fallback].slice(0, limit);
};

export const getApprovedComments = (slug: string): Comment[] =>
  comments.filter((comment) => comment.articleSlug === slug && comment.status === "aprovado");
