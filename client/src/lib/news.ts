export type ArticleStatus = "draft" | "review" | "revised" | "approved" | "scheduled" | "published" | "updated" | "archived";
export type EditorialScope = "national" | "regional" | "international";
export type NewsArticle = {
  id: string;
  title: string;
  category: string;
  author: string;
  authorOpenId?: string | null;
  summary: string;
  date: string;
  updated: string;
  status: ArticleStatus;
  views: number;
  image: string;
  bodyHtml: string;
  scheduledAt?: string;
  tags: string[];
  scope?: EditorialScope;
  region?: string | null;
  state?: string | null;
  country?: string | null;
  language?: string;
  featured?: boolean;
  sourceUrl?: string | null;
  sourceName?: string | null;
  youtubeUrl?: string | null;
  socialLinks?: { instagram?: string; facebook?: string; x?: string; linkedin?: string; tiktok?: string; website?: string };
  slug?: string | null; seoTitle?: string | null; metaDescription?: string | null; canonicalUrl?: string | null; focusKeyword?: string | null; ogTitle?: string | null; ogDescription?: string | null; imageAlt?: string | null; noindex?: boolean;
};

export const EDITORIAL_CATEGORIES = ["Brasil", "Política", "Economia", "Mundo", "Cultura", "Esportes", "Saúde", "Educação", "Ciência & Tecnologia", "Meio ambiente", "Cidades", "Lei & Justiça", "Colunas"] as const;

/**
 * Secondary editorial taxonomy. These are intentionally subthemes, not new
 * top-level categories, so the main navigation stays compact while the
 * newsroom can classify more specific coverage through tags.
 */
export const EDITORIAL_SUBTHEMES = [
  { label: "Saúde e Beleza", parent: "Saúde" },
  { label: "Desenvolvimento Humano", parent: "Colunas" },
  { label: "Terapia e Bem-Estar", parent: "Saúde" },
] as const;

export type EditorialSubtheme = typeof EDITORIAL_SUBTHEMES[number]["label"];


export const EDITORIAL_SCOPES: Array<{ id: EditorialScope; label: string }> = [
  { id: "national", label: "Brasil" },
  { id: "regional", label: "Regiões" },
  { id: "international", label: "Mundo" },
];

export const NEWS_STORAGE_KEY = "pch-news-admin-articles";
export const MEDIA_STORAGE_KEY = "pch-news-admin-media";
export type MediaAsset = { id: string; name: string; src: string; size: string; createdAt: string };

export const NEWS_SEED_VERSION = "evaldo-pilulas-30-v4";

export const INITIAL_ARTICLES: NewsArticle[] = [
  {
    "id": "evaldo-pilula-01-a-luz-que-ainda-existe",
    "title": "A Luz que Ainda Existe",
    "category": "Colunas",
    "author": "Evaldo Poeta",
    "summary": "",
    "date": "16/09/2026",
    "updated": "acervo PCH News",
    "status": "published",
    "views": 0,
    "image": "/brand/pch-news-official-20260926.svg",
    "bodyHtml": "<p class=\"article-subtitle\"></p><div class=\"pilula-poeta\">Há uma luz dentro de você<br />que o medo não conseguiu apagar.<br />Talvez a vida tenha feito sombra,<br />mas sombra não é fim: é só falta de claridade.<br />Há dias em que a vergonha pesa,<br />o passado tenta falar mais alto,<br />e o coração quase acredita<br />que nasceu para viver escondido.<br />Mas talvez Deus não esteja pedindo perfeição.<br />Talvez esteja pedindo presença.<br />Pare um instante, escute,<br />e perceba que ainda existe luz aí.<br />A pergunta não é se você tem luz.<br />É: o que está impedindo essa luz de aparecer?</div><hr /><p><strong>Reflexão:</strong> O que está cobrindo a sua luz hoje?</p><p><strong>Chamada para ação:</strong> Leia, reflita e compartilhe com alguém que precisa desta palavra hoje.</p>",
    "tags": [
      "Pílula do Poeta",
      "Evaldo Poeta",
      "reflexão",
      "autoconhecimento",
      "fé",
      "vida",
      "comportamento"
    ],
    "scope": "national",
    "language": "pt-BR",
    "featured": true,
    "sourceUrl": "https://pchnews.hostingpress.com.br/materia/a-luz-que-ainda-existe",
    "sourceName": "PCH News / HostingPRESS"
  },
  {
    "id": "evaldo-pilula-02-lave-os-olhos",
    "title": "Lave os Olhos",
    "category": "Colunas",
    "author": "Evaldo Poeta",
    "summary": "",
    "date": "",
    "updated": "acervo PCH News",
    "status": "published",
    "views": 0,
    "image": "/brand/media/pch-lave-os-olhos.svg",
    "bodyHtml": "<p class=\"article-subtitle\"></p><div class=\"pilula-poeta\">Há quem queira falar muito,<br />mas ainda não aprendeu a escutar.<br />Há quem queira ensinar caminhos,<br />mas ainda não parou para olhar.<br />A humildade não diminui ninguém.<br />Ela abre espaço para aprender.<br />Quem escuta com o coração<br />enxerga aquilo que o orgulho não deixa ver.<br />Talvez você não precise de uma resposta nova.<br />Talvez precise de olhos novos.<br />Um olhar disposto a perceber<br />o que antes passava despercebido.<br />Porque quem aprende a enxergar diferente<br />também começa a caminhar diferente.</div><hr /><p><strong>Reflexão:</strong> O que você precisa enxergar de outro jeito hoje?</p><p><strong>Chamada para ação:</strong> Leia, reflita e compartilhe com alguém que precisa desta palavra hoje.</p>",
    "tags": [
      "Pílula do Poeta",
      "Evaldo Poeta",
      "reflexão",
      "autoconhecimento",
      "fé",
      "vida",
      "comportamento"
    ],
    "scope": "national",
    "language": "pt-BR",
    "featured": true,
    "sourceUrl": "https://pchnews.hostingpress.com.br/materia/lave-os-olhos",
    "sourceName": "PCH News / HostingPRESS"
  },
  {
    "id": "evaldo-pilula-03-o-brilho-escondido",
    "title": "O Brilho Escondido",
    "category": "Colunas",
    "author": "Evaldo Poeta",
    "summary": "",
    "date": "17/09/2026",
    "updated": "acervo PCH News",
    "status": "published",
    "views": 0,
    "image": "/brand/pch-news-official-20260926.svg",
    "bodyHtml": "<p class=\"article-subtitle\"></p><div class=\"pilula-poeta\">Existe um brilho escondido<br />por trás de algumas cicatrizes.<br />Há tesouros que não aparecem<br />na primeira vez que olhamos.<br />A dor pode cobrir uma janela,<br />mas não consegue apagar o céu.<br />O silêncio pode esconder uma voz,<br />mas não consegue destruir sua história.<br />Talvez você esteja procurando fora<br />aquilo que precisa primeiro reconhecer dentro.<br />Não para se achar perfeito,<br />mas para lembrar que ainda há vida em você.<br />Às vezes, despertar<br />é simplesmente retirar o véu<br />e reconhecer o que sempre esteve ali.</div><hr /><p><strong>Reflexão:</strong> Que parte bonita de você a dor fez esquecer?</p><p><strong>Chamada para ação:</strong> Leia, reflita e compartilhe com alguém que precisa desta palavra hoje.</p>",
    "tags": [
      "Pílula do Poeta",
      "Evaldo Poeta",
      "reflexão",
      "autoconhecimento",
      "fé",
      "vida",
      "comportamento"
    ],
    "scope": "national",
    "language": "pt-BR",
    "featured": true,
    "sourceUrl": "https://pchnews.hostingpress.com.br/materia/o-brilho-escondido",
    "sourceName": "PCH News / HostingPRESS"
  },
  {
    "id": "evaldo-pilula-04-pegue-o-interruptor",
    "title": "Pegue o Interruptor",
    "category": "Colunas",
    "author": "Evaldo Poeta",
    "summary": "",
    "date": "",
    "updated": "acervo PCH News",
    "status": "published",
    "views": 0,
    "image": "/brand/media/pch-pegue-o-interruptor.svg",
    "bodyHtml": "<p class=\"article-subtitle\"></p><div class=\"pilula-poeta\">A vida pode apagar algumas luzes,<br />mas não precisa levar o interruptor.<br />Há coisas que aconteceram com você<br />que não precisam decidir quem você será.<br />Alguém pode ter ferido,<br />rejeitado ou diminuído você.<br />Mas o passado explica algumas marcas;<br />não precisa escrever todas as próximas páginas.<br />Retomar o comando não é negar o que aconteceu.<br />É reconhecer o que aconteceu<br />sem entregar a ele o volante.<br />Talvez hoje seja o dia<br />de acender novamente uma luz.<br />Não porque tudo ficou fácil,<br />mas porque você decidiu voltar a participar da própria história.</div><hr /><p><strong>Reflexão:</strong> Que decisão você precisa voltar a assumir?</p><p><strong>Chamada para ação:</strong> Leia, reflita e compartilhe com alguém que precisa desta palavra hoje.</p>",
    "tags": [
      "Pílula do Poeta",
      "Evaldo Poeta",
      "reflexão",
      "autoconhecimento",
      "fé",
      "vida",
      "comportamento"
    ],
    "scope": "national",
    "language": "pt-BR",
    "featured": true,
    "sourceUrl": "https://pchnews.hostingpress.com.br/materia/pegue-o-interruptor",
    "sourceName": "PCH News / HostingPRESS"
  },
  {
    "id": "evaldo-pilula-05-de-voz-a-fe",
    "title": "Dê Voz à Fé",
    "category": "Colunas",
    "author": "Evaldo Poeta",
    "summary": "",
    "date": "",
    "updated": "acervo PCH News",
    "status": "published",
    "views": 0,
    "image": "/brand/media/pch-de-voz-a-fe.svg",
    "bodyHtml": "<p class=\"article-subtitle\"></p><div class=\"pilula-poeta\">No meio da multidão,<br />uma voz pode parecer pequena.<br />Mas quem sabe o que procura<br />não precisa gritar para impressionar.<br />Às vezes, você sabe o que precisa pedir,<br />mas o medo manda ficar calado.<br />A vergonha segura a palavra,<br />e a dúvida tenta convencer você a desistir.<br />Bartimeu nos lembra de uma atitude:<br />há momentos em que a fé precisa ser expressa.<br />Não para provar algo aos outros,<br />mas para reconhecer diante de Deus aquilo que o coração deseja.<br />Talvez sua próxima mudança comece<br />quando aquilo que você sente<br />finalmente encontrar uma voz.</div><hr /><p><strong>Reflexão:</strong> O que você precisa ter coragem de colocar em palavras?</p><p><strong>Chamada para ação:</strong> Leia, reflita e compartilhe com alguém que precisa desta palavra hoje.</p>",
    "tags": [
      "Pílula do Poeta",
      "Evaldo Poeta",
      "reflexão",
      "autoconhecimento",
      "fé",
      "vida",
      "comportamento"
    ],
    "scope": "national",
    "language": "pt-BR",
    "featured": true,
    "sourceUrl": "https://pchnews.hostingpress.com.br/materia/de-voz-a-fe",
    "sourceName": "PCH News / HostingPRESS"
  },
  {
    "id": "evaldo-pilula-06-dom-sem-amor",
    "title": "Dom sem Amor",
    "category": "Colunas",
    "author": "Evaldo Poeta",
    "summary": "",
    "date": "",
    "updated": "acervo PCH News",
    "status": "published",
    "views": 0,
    "image": "/brand/media/pch-dom-sem-amor.svg",
    "bodyHtml": "<p class=\"article-subtitle\"></p><div class=\"pilula-poeta\">Você pode ter voz,<br />habilidade, inteligência e força.<br />Pode fazer muito,<br />ser reconhecido e chegar longe.<br />Mas todo dom carrega uma pergunta:<br />para quê?<br />Porque talento sem propósito<br />pode virar apenas barulho.<br />Quando o conhecimento encontra o amor,<br />o que você sabe começa a servir.<br />Quando a capacidade encontra cuidado,<br />o talento deixa de ser vitrine<br />e se transforma em presença.<br />Não é apenas sobre o que você consegue fazer.<br />É sobre o bem que pode nascer<br />quando você decide fazer com amor.</div><hr /><p><strong>Reflexão:</strong> Seu talento está servindo apenas a você ou também a alguém?</p><p><strong>Chamada para ação:</strong> Leia, reflita e compartilhe com alguém que precisa desta palavra hoje.</p>",
    "tags": [
      "Pílula do Poeta",
      "Evaldo Poeta",
      "reflexão",
      "autoconhecimento",
      "fé",
      "vida",
      "comportamento"
    ],
    "scope": "national",
    "language": "pt-BR",
    "featured": true,
    "sourceUrl": "https://pchnews.hostingpress.com.br/materia/dom-sem-amor",
    "sourceName": "PCH News / HostingPRESS"
  },
  {
    "id": "evaldo-pilula-07-quando-a-palavra-ganha-vida",
    "title": "Quando a Palavra Ganha Vida",
    "category": "Colunas",
    "author": "Evaldo Poeta",
    "summary": "",
    "date": "16/09/2026",
    "updated": "acervo PCH News",
    "status": "draft",
    "views": 0,
    "image": "/brand/pch-news-official-20260926.svg",
    "bodyHtml": "<p class=\"article-subtitle\"></p><div class=\"pilula-poeta\">Há pensamentos que ficam presos<br />porque ainda não encontraram palavras.<br />Há sentimentos que parecem enormes<br />até que alguém consegue escrevê-los.<br />Quando escrevemos,<br />o silêncio ganha contorno.<br />O caos encontra uma linha.<br />E aquilo que parecia impossível de explicar<br />começa a ser compreendido.<br />Talvez por isso algumas palavras<br />nos libertem antes mesmo de serem lidas por alguém.<br />Elas organizam quem escreve.<br />Pegue uma folha.<br />Comece sem perfeição.<br />Às vezes, uma frase é o primeiro passo<br />para entender uma história inteira.</div><hr /><p><strong>Reflexão:</strong> Que pensamento dentro de você precisa ganhar palavras?</p><p><strong>Chamada para ação:</strong> Leia, reflita e compartilhe com alguém que precisa desta palavra hoje.</p>",
    "tags": [
      "Pílula do Poeta",
      "Evaldo Poeta",
      "reflexão",
      "autoconhecimento",
      "fé",
      "vida",
      "comportamento"
    ],
    "scope": "national",
    "language": "pt-BR",
    "featured": false,
    "sourceUrl": null,
    "sourceName": null
  },
  {
    "id": "evaldo-pilula-08-um-proposito-maior",
    "title": "Um Propósito Maior",
    "category": "Colunas",
    "author": "Evaldo Poeta",
    "summary": "",
    "date": "Edição 08",
    "updated": "acervo PCH News",
    "status": "draft",
    "views": 0,
    "image": "/brand/pch-news-official-20260926.svg",
    "bodyHtml": "<p class=\"article-subtitle\"></p><div class=\"pilula-poeta\">Há caminhos que parecem comuns,<br />mas carregam um propósito.<br />Há tarefas pequenas<br />que podem tocar vidas grandes.<br />Propósito não é apenas aparecer.<br />É saber por que você continua<br />quando ninguém está olhando.<br />Talvez sua vida não esteja pedindo<br />uma plateia maior.<br />Talvez esteja pedindo<br />uma entrega mais verdadeira.<br />Quando você entende para que caminha,<br />até os passos pequenos<br />começam a ter direção.</div><hr /><p><strong>Reflexão:</strong> O que hoje você faz que poderia ganhar um propósito maior?</p><p><strong>Chamada para ação:</strong> Leia, reflita e compartilhe com alguém que precisa desta palavra hoje.</p>",
    "tags": [
      "Pílula do Poeta",
      "Evaldo Poeta",
      "reflexão",
      "autoconhecimento",
      "fé",
      "vida",
      "comportamento"
    ],
    "scope": "national",
    "language": "pt-BR",
    "featured": false,
    "sourceUrl": null,
    "sourceName": null
  },
  {
    "id": "evaldo-pilula-09-qual-voz-voce-alimenta",
    "title": "Qual Voz Você Alimenta?",
    "category": "Colunas",
    "author": "Evaldo Poeta",
    "summary": "",
    "date": "Edição 09",
    "updated": "acervo PCH News",
    "status": "draft",
    "views": 0,
    "image": "/brand/pch-news-official-20260926.svg",
    "bodyHtml": "<p class=\"article-subtitle\"></p><div class=\"pilula-poeta\">Há vozes que aceleram,<br />vozes que assustam,<br />vozes que dizem que não vai dar.<br />E há uma voz mais serena,<br />que não precisa gritar<br />para ser ouvida.<br />Nem todo pensamento merece ser obedecido.<br />Nem toda urgência é direção.<br />Nem todo medo é aviso.<br />Talvez maturidade também seja isso:<br />aprender a distinguir<br />o barulho daquilo que traz paz.<br />Antes de seguir qualquer voz,<br />pare.<br />Escute.<br />Pergunte de onde ela vem<br />e para onde ela está levando você.</div><hr /><p><strong>Reflexão:</strong> Qual voz tem ocupado espaço demais dentro de você?</p><p><strong>Chamada para ação:</strong> Leia, reflita e compartilhe com alguém que precisa desta palavra hoje.</p>",
    "tags": [
      "Pílula do Poeta",
      "Evaldo Poeta",
      "reflexão",
      "autoconhecimento",
      "fé",
      "vida",
      "comportamento"
    ],
    "scope": "national",
    "language": "pt-BR",
    "featured": false,
    "sourceUrl": null,
    "sourceName": null
  },
  {
    "id": "evaldo-pilula-10-sua-historia-tem-valor",
    "title": "Sua História Tem Valor",
    "category": "Colunas",
    "author": "Evaldo Poeta",
    "summary": "",
    "date": "Edição 10",
    "updated": "acervo PCH News",
    "status": "draft",
    "views": 0,
    "image": "/brand/pch-news-official-20260926.svg",
    "bodyHtml": "<p class=\"article-subtitle\"></p><div class=\"pilula-poeta\">Sua história tem capítulos<br />que talvez você preferisse esconder.<br />Mas até as páginas difíceis<br />fazem parte daquilo que você se tornou.<br />Não é preciso romantizar a dor.<br />Nem fingir que tudo foi fácil.<br />É possível reconhecer as feridas<br />e ainda escolher continuar.<br />Talvez o seu passado<br />não seja uma sentença,<br />mas uma parte da narrativa.<br />E quando você aprende a olhar para trás<br />sem morar lá,<br />a história deixa de ser prisão<br />e começa a se transformar em testemunho.</div><hr /><p><strong>Reflexão:</strong> O que você viveu pode ensinar algo que hoje pode servir a alguém?</p><p><strong>Chamada para ação:</strong> Leia, reflita e compartilhe com alguém que precisa desta palavra hoje.</p>",
    "tags": [
      "Pílula do Poeta",
      "Evaldo Poeta",
      "reflexão",
      "autoconhecimento",
      "fé",
      "vida",
      "comportamento"
    ],
    "scope": "national",
    "language": "pt-BR",
    "featured": false,
    "sourceUrl": null,
    "sourceName": null
  },
  {
    "id": "evaldo-pilula-11-o-que-voce-deixa",
    "title": "O Que Você Deixa?",
    "category": "Colunas",
    "author": "Evaldo Poeta",
    "summary": "",
    "date": "Edição 11",
    "updated": "acervo PCH News",
    "status": "draft",
    "views": 0,
    "image": "/brand/pch-news-official-20260926.svg",
    "bodyHtml": "<p class=\"article-subtitle\"></p><div class=\"pilula-poeta\">O relógio continua andando<br />mesmo quando ninguém percebe.<br />Os dias passam sem pedir licença.<br />No fim, quase ninguém será lembrado<br />pelo tamanho daquilo que acumulou,<br />mas pelo impacto daquilo que ofereceu.<br />Uma palavra pode permanecer.<br />Um abraço pode permanecer.<br />Uma oportunidade dada<br />pode permanecer.<br />Talvez legado não seja deixar coisas.<br />Talvez seja deixar marcas<br />que façam alguém caminhar melhor.</div><hr /><p><strong>Reflexão:</strong> Que marca você gostaria de deixar nas pessoas que cruzam sua vida?</p><p><strong>Chamada para ação:</strong> Leia, reflita e compartilhe com alguém que precisa desta palavra hoje.</p>",
    "tags": [
      "Pílula do Poeta",
      "Evaldo Poeta",
      "reflexão",
      "autoconhecimento",
      "fé",
      "vida",
      "comportamento"
    ],
    "scope": "national",
    "language": "pt-BR",
    "featured": false,
    "sourceUrl": null,
    "sourceName": null
  },
  {
    "id": "evaldo-pilula-12-transforme-a-ponte",
    "title": "Transforme a Ponte",
    "category": "Colunas",
    "author": "Evaldo Poeta",
    "summary": "",
    "date": "Edição 12",
    "updated": "acervo PCH News",
    "status": "draft",
    "views": 0,
    "image": "/brand/pch-news-official-20260926.svg",
    "bodyHtml": "<p class=\"article-subtitle\"></p><div class=\"pilula-poeta\">Há dores que chegam<br />parecendo o fim de uma estrada.<br />Mas nem toda ruptura é destino final.<br />Às vezes, aquilo que nos quebra<br />também revela caminhos<br />que nunca teríamos procurado.<br />Não precisamos chamar a dor de boa<br />para reconhecer que podemos aprender com ela.<br />Não precisamos negar a queda<br />para voltar a caminhar.<br />Talvez a pergunta não seja:<br />“Por que isso aconteceu comigo?”<br />Talvez também seja:<br />“Que caminho posso construir a partir daqui?”</div><hr /><p><strong>Reflexão:</strong> Que experiência difícil pode se transformar em aprendizado para o seu próximo passo?</p><p><strong>Chamada para ação:</strong> Leia, reflita e compartilhe com alguém que precisa desta palavra hoje.</p>",
    "tags": [
      "Pílula do Poeta",
      "Evaldo Poeta",
      "reflexão",
      "autoconhecimento",
      "fé",
      "vida",
      "comportamento"
    ],
    "scope": "national",
    "language": "pt-BR",
    "featured": false,
    "sourceUrl": null,
    "sourceName": null
  },
  {
    "id": "evaldo-pilula-13-cuide-de-si",
    "title": "Cuide de Si",
    "category": "Colunas",
    "author": "Evaldo Poeta",
    "summary": "",
    "date": "Edição 13",
    "updated": "acervo PCH News",
    "status": "draft",
    "views": 0,
    "image": "/brand/pch-news-official-20260926.svg",
    "bodyHtml": "<p class=\"article-subtitle\"></p><div class=\"pilula-poeta\">Você aprendeu a cuidar,<br />a ajudar,<br />a estar presente.<br />Mas quem cuida de você<br />quando você se deixa sempre por último?<br />Amor próprio não é colocar-se acima dos outros.<br />É reconhecer que você também merece cuidado,<br />respeito e descanso.<br />Quem conhece o próprio valor<br />não precisa diminuir ninguém.<br />E quem se trata com dignidade<br />aprende a oferecer dignidade com mais verdade.<br />Não se abandone<br />enquanto tenta salvar todos ao redor.</div><hr /><p><strong>Reflexão:</strong> Em que área da sua vida você precisa voltar a cuidar de si?</p><p><strong>Chamada para ação:</strong> Leia, reflita e compartilhe com alguém que precisa desta palavra hoje.</p>",
    "tags": [
      "Pílula do Poeta",
      "Evaldo Poeta",
      "reflexão",
      "autoconhecimento",
      "fé",
      "vida",
      "comportamento"
    ],
    "scope": "national",
    "language": "pt-BR",
    "featured": false,
    "sourceUrl": null,
    "sourceName": null
  },
  {
    "id": "evaldo-pilula-14-volte-para-casa",
    "title": "Volte para Casa",
    "category": "Colunas",
    "author": "Evaldo Poeta",
    "summary": "",
    "date": "Edição 14",
    "updated": "acervo PCH News",
    "status": "draft",
    "views": 0,
    "image": "/brand/pch-news-official-20260926.svg",
    "bodyHtml": "<p class=\"article-subtitle\"></p><div class=\"pilula-poeta\">Você pode errar.<br />Pode se afastar.<br />Pode tomar caminhos que depois gostaria de refazer.<br />Mas um erro não precisa ser<br />a última palavra da sua história.<br />Há portas que permanecem abertas<br />mesmo depois da distância.<br />Há braços que não precisam<br />de uma explicação perfeita para acolher.<br />Voltar exige humildade.<br />E às vezes a maior coragem<br />não é seguir adiante,<br />mas reconhecer que precisamos retornar.<br />Talvez hoje seja dia de voltar<br />para aquilo que realmente importa.</div><hr /><p><strong>Reflexão:</strong> Existe algum lugar, pessoa ou propósito para o qual seu coração está pedindo retorno?</p><p><strong>Chamada para ação:</strong> Leia, reflita e compartilhe com alguém que precisa desta palavra hoje.</p>",
    "tags": [
      "Pílula do Poeta",
      "Evaldo Poeta",
      "reflexão",
      "autoconhecimento",
      "fé",
      "vida",
      "comportamento"
    ],
    "scope": "national",
    "language": "pt-BR",
    "featured": false,
    "sourceUrl": null,
    "sourceName": null
  },
  {
    "id": "evaldo-pilula-15-a-graca-muda-o-olhar",
    "title": "A Graça Muda o Olhar",
    "category": "Colunas",
    "author": "Evaldo Poeta",
    "summary": "",
    "date": "Edição 15",
    "updated": "acervo PCH News",
    "status": "draft",
    "views": 0,
    "image": "/brand/pch-news-official-20260926.svg",
    "bodyHtml": "<p class=\"article-subtitle\"></p><div class=\"pilula-poeta\">A mesma estrada pode parecer pesada<br />quando o coração está cansado.<br />A mesma vida pode parecer diferente<br />quando o olhar encontra esperança.<br />A graça não apaga a realidade.<br />Mas pode mudar a forma<br />como atravessamos a realidade.<br />Quando o coração se abre,<br />a visão se amplia.<br />O que parecia apenas problema<br />pode revelar uma possibilidade.<br />Talvez a transformação comece<br />não no cenário,<br />mas no olhar que você leva para ele.</div><hr /><p><strong>Reflexão:</strong> O que poderia mudar se você olhasse para sua situação com mais esperança?</p><p><strong>Chamada para ação:</strong> Leia, reflita e compartilhe com alguém que precisa desta palavra hoje.</p>",
    "tags": [
      "Pílula do Poeta",
      "Evaldo Poeta",
      "reflexão",
      "autoconhecimento",
      "fé",
      "vida",
      "comportamento"
    ],
    "scope": "national",
    "language": "pt-BR",
    "featured": false,
    "sourceUrl": null,
    "sourceName": null
  },
  {
    "id": "evaldo-pilula-16-pense-antes-de-prender-se",
    "title": "Pense Antes de Prender-se",
    "category": "Colunas",
    "author": "Evaldo Poeta",
    "summary": "",
    "date": "Edição 16",
    "updated": "acervo PCH News",
    "status": "draft",
    "views": 0,
    "image": "/brand/pch-news-official-20260926.svg",
    "bodyHtml": "<p class=\"article-subtitle\"></p><div class=\"pilula-poeta\">Há pessoas que dizem sim<br />quando gostariam de dizer não.<br />Há escolhas feitas por medo<br />de decepcionar alguém.<br />Mas concordar com tudo<br />também pode ser uma forma de se abandonar.<br />Pensar não é desrespeitar.<br />Questionar não é rebelar-se.<br />Estabelecer limites não é deixar de amar.<br />A liberdade começa quando você percebe<br />que pode refletir antes de responder.<br />Nem toda porta que alguém aponta<br />é uma porta que você precisa atravessar.</div><hr /><p><strong>Reflexão:</strong> Em qual situação você precisa pensar antes de simplesmente dizer sim?</p><p><strong>Chamada para ação:</strong> Leia, reflita e compartilhe com alguém que precisa desta palavra hoje.</p>",
    "tags": [
      "Pílula do Poeta",
      "Evaldo Poeta",
      "reflexão",
      "autoconhecimento",
      "fé",
      "vida",
      "comportamento"
    ],
    "scope": "national",
    "language": "pt-BR",
    "featured": false,
    "sourceUrl": null,
    "sourceName": null
  },
  {
    "id": "evaldo-pilula-17-pare-de-esperar-o-momento-perfeito",
    "title": "Pare de Esperar o Momento Perfeito",
    "category": "Colunas",
    "author": "Evaldo Poeta",
    "summary": "",
    "date": "Edição 17",
    "updated": "acervo PCH News",
    "status": "draft",
    "views": 0,
    "image": "/brand/pch-news-official-20260926.svg",
    "bodyHtml": "<p class=\"article-subtitle\"></p><div class=\"pilula-poeta\">Você espera a hora certa,<br />a coragem certa,<br />a condição certa.<br />Enquanto isso,<br />a vida continua acontecendo.<br />O perfeccionismo promete segurança,<br />mas muitas vezes entrega adiamento.<br />Ele diz: “prepare-se mais um pouco”.<br />E o tempo responde: “comece”.<br />Não é preciso começar perfeito.<br />É preciso começar consciente,<br />aprender no caminho<br />e continuar ajustando os passos.<br />Às vezes, o primeiro movimento<br />é exatamente o que faltava<br />para o segundo aparecer.</div><hr /><p><strong>Reflexão:</strong> O que você está adiando porque ainda não se sente preparado?</p><p><strong>Chamada para ação:</strong> Leia, reflita e compartilhe com alguém que precisa desta palavra hoje.</p>",
    "tags": [
      "Pílula do Poeta",
      "Evaldo Poeta",
      "reflexão",
      "autoconhecimento",
      "fé",
      "vida",
      "comportamento"
    ],
    "scope": "national",
    "language": "pt-BR",
    "featured": false,
    "sourceUrl": null,
    "sourceName": null
  },
  {
    "id": "evaldo-pilula-18-seu-tempo-tem-valor",
    "title": "Seu Tempo Tem Valor",
    "category": "Colunas",
    "author": "Evaldo Poeta",
    "summary": "",
    "date": "Edição 18",
    "updated": "acervo PCH News",
    "status": "draft",
    "views": 0,
    "image": "/brand/pch-news-official-20260926.svg",
    "bodyHtml": "<p class=\"article-subtitle\"></p><div class=\"pilula-poeta\">Cada manhã chega<br />com uma quantidade limitada de horas.<br />E nenhuma delas pode ser guardada<br />para amanhã.<br />O tempo não faz barulho<br />quando vai embora.<br />Ele simplesmente passa.<br />Por isso, algumas perguntas são necessárias:<br />o que merece minha atenção?<br />o que estou adiando?<br />o que estou gastando<br />que não gostaria de perder?<br />Talvez administrar o tempo<br />seja, no fundo,<br />aprender a administrar a própria vida.</div><hr /><p><strong>Reflexão:</strong> Se hoje fosse uma página única, o que você gostaria de escrever nela?</p><p><strong>Chamada para ação:</strong> Leia, reflita e compartilhe com alguém que precisa desta palavra hoje.</p>",
    "tags": [
      "Pílula do Poeta",
      "Evaldo Poeta",
      "reflexão",
      "autoconhecimento",
      "fé",
      "vida",
      "comportamento"
    ],
    "scope": "national",
    "language": "pt-BR",
    "featured": false,
    "sourceUrl": null,
    "sourceName": null
  },
  {
    "id": "evaldo-pilula-19-o-espelho-nao-conta-tudo",
    "title": "O Espelho Não Conta Tudo",
    "category": "Colunas",
    "author": "Evaldo Poeta",
    "summary": "",
    "date": "Edição 19",
    "updated": "acervo PCH News",
    "status": "draft",
    "views": 0,
    "image": "/brand/pch-news-official-20260926.svg",
    "bodyHtml": "<p class=\"article-subtitle\"></p><div class=\"pilula-poeta\">Você olha para o espelho<br />e encontra um rosto.<br />Mas ali também existem histórias,<br />medos, sonhos e recomeços.<br />O problema começa<br />quando uma imagem vira sentença.<br />Quando um detalhe passa a definir<br />toda a pessoa.<br />Você é maior que aquilo<br />que consegue enxergar em alguns segundos.<br />Olhe novamente.<br />Não apenas para o que falta,<br />mas para aquilo que permanece.<br />Talvez exista mais força em você<br />do que o reflexo conseguiu mostrar.</div><hr /><p><strong>Reflexão:</strong> Quando você se olha, enxerga apenas aparência ou também reconhece sua história e seu valor?</p><p><strong>Chamada para ação:</strong> Leia, reflita e compartilhe com alguém que precisa desta palavra hoje.</p>",
    "tags": [
      "Pílula do Poeta",
      "Evaldo Poeta",
      "reflexão",
      "autoconhecimento",
      "fé",
      "vida",
      "comportamento"
    ],
    "scope": "national",
    "language": "pt-BR",
    "featured": false,
    "sourceUrl": null,
    "sourceName": null
  },
  {
    "id": "evaldo-pilula-20-o-chamado-no-meio-da-rotina",
    "title": "O Chamado no Meio da Rotina",
    "category": "Colunas",
    "author": "Evaldo Poeta",
    "summary": "",
    "date": "Edição 20",
    "updated": "acervo PCH News",
    "status": "draft",
    "views": 0,
    "image": "/brand/pch-news-official-20260926.svg",
    "bodyHtml": "<p class=\"article-subtitle\"></p><div class=\"pilula-poeta\">Mateus estava trabalhando<br />quando ouviu um chamado.<br />A vida não parou para preparar o cenário.<br />Talvez seja assim também conosco.<br />Esperamos um grande momento,<br />uma placa,<br />uma certeza absoluta.<br />Mas algumas decisões chegam<br />no meio da rotina.<br />O chamado pode encontrar você<br />no trabalho,<br />em casa,<br />numa conversa,<br />num dia aparentemente comum.<br />A pergunta é simples:<br />quando a oportunidade de mudar aparecer,<br />você vai reconhecê-la?</div><hr /><p><strong>Reflexão:</strong> Que mudança importante pode estar sendo chamada para dentro da sua rotina?</p><p><strong>Chamada para ação:</strong> Leia, reflita e compartilhe com alguém que precisa desta palavra hoje.</p>",
    "tags": [
      "Pílula do Poeta",
      "Evaldo Poeta",
      "reflexão",
      "autoconhecimento",
      "fé",
      "vida",
      "comportamento"
    ],
    "scope": "national",
    "language": "pt-BR",
    "featured": false,
    "sourceUrl": null,
    "sourceName": null
  },
  {
    "id": "evaldo-pilula-21-faca-novo-de-novo",
    "title": "Faça Novo de Novo",
    "category": "Colunas",
    "author": "Evaldo Poeta",
    "summary": "",
    "date": "Edição 21",
    "updated": "acervo PCH News",
    "status": "draft",
    "views": 0,
    "image": "/brand/pch-news-official-20260926.svg",
    "bodyHtml": "<p class=\"article-subtitle\"></p><div class=\"pilula-poeta\">Há dias em que tudo parece repetição.<br />Os mesmos erros,<br />as mesmas dúvidas,<br />as mesmas desculpas.<br />Mas um novo começo<br />não precisa esperar um novo ano.<br />Você pode revisar o caminho,<br />mudar uma escolha,<br />pedir perdão,<br />aprender algo,<br />começar novamente.<br />Fazer melhor não significa<br />nunca ter errado.<br />Significa não usar o erro<br />como desculpa para permanecer igual.<br />Hoje também pode ser<br />um ponto de virada.</div><hr /><p><strong>Reflexão:</strong> O que você pode fazer diferente a partir de hoje?</p><p><strong>Chamada para ação:</strong> Leia, reflita e compartilhe com alguém que precisa desta palavra hoje.</p>",
    "tags": [
      "Pílula do Poeta",
      "Evaldo Poeta",
      "reflexão",
      "autoconhecimento",
      "fé",
      "vida",
      "comportamento"
    ],
    "scope": "national",
    "language": "pt-BR",
    "featured": false,
    "sourceUrl": null,
    "sourceName": null
  },
  {
    "id": "evaldo-pilula-22-rompa-a-multidao",
    "title": "Rompa a Multidão",
    "category": "Colunas",
    "author": "Evaldo Poeta",
    "summary": "",
    "date": "Edição 22",
    "updated": "acervo PCH News",
    "status": "draft",
    "views": 0,
    "image": "/brand/pch-news-official-20260926.svg",
    "bodyHtml": "<p class=\"article-subtitle\"></p><div class=\"pilula-poeta\">Há uma multidão dentro da mente:<br />medo, dúvida, comparação,<br />lembranças e possibilidades.<br />Alguns pensamentos empurram.<br />Outros puxam para trás.<br />Mas nem todo pensamento<br />precisa decidir seu próximo passo.<br />Romper a multidão<br />é reconhecer o que importa<br />e caminhar apesar do ruído.<br />Talvez a coragem não seja<br />ficar sem medo.<br />Talvez seja não deixar<br />que o medo escolha por você.</div><hr /><p><strong>Reflexão:</strong> Qual pensamento você precisa atravessar para chegar ao próximo passo?</p><p><strong>Chamada para ação:</strong> Leia, reflita e compartilhe com alguém que precisa desta palavra hoje.</p>",
    "tags": [
      "Pílula do Poeta",
      "Evaldo Poeta",
      "reflexão",
      "autoconhecimento",
      "fé",
      "vida",
      "comportamento"
    ],
    "scope": "national",
    "language": "pt-BR",
    "featured": false,
    "sourceUrl": null,
    "sourceName": null
  },
  {
    "id": "evaldo-pilula-23-a-porta-esta-aberta",
    "title": "A Porta Está Aberta",
    "category": "Colunas",
    "author": "Evaldo Poeta",
    "summary": "",
    "date": "Edição 23",
    "updated": "acervo PCH News",
    "status": "draft",
    "views": 0,
    "image": "/brand/pch-news-official-20260926.svg",
    "bodyHtml": "<p class=\"article-subtitle\"></p><div class=\"pilula-poeta\">Uma porta aberta<br />não obriga ninguém a atravessar.<br />Ela apenas mostra que existe passagem.<br />Às vezes, pedimos uma oportunidade<br />e, quando ela chega,<br />começamos a procurar motivos para esperar.<br />O medo pergunta:<br />“E se der errado?”<br />A coragem pergunta:<br />“E se eu nunca tentar?”<br />Nem toda porta aberta<br />é a porta certa.<br />Mas toda decisão merece<br />ser tomada com consciência,<br />não apenas com medo.</div><hr /><p><strong>Reflexão:</strong> Que porta aberta você precisa avaliar com coragem e sabedoria?</p><p><strong>Chamada para ação:</strong> Leia, reflita e compartilhe com alguém que precisa desta palavra hoje.</p>",
    "tags": [
      "Pílula do Poeta",
      "Evaldo Poeta",
      "reflexão",
      "autoconhecimento",
      "fé",
      "vida",
      "comportamento"
    ],
    "scope": "national",
    "language": "pt-BR",
    "featured": false,
    "sourceUrl": null,
    "sourceName": null
  },
  {
    "id": "evaldo-pilula-24-troque-a-veste",
    "title": "Troque a Veste",
    "category": "Colunas",
    "author": "Evaldo Poeta",
    "summary": "",
    "date": "Edição 24",
    "updated": "acervo PCH News",
    "status": "draft",
    "views": 0,
    "image": "/brand/pch-news-official-20260926.svg",
    "bodyHtml": "<p class=\"article-subtitle\"></p><div class=\"pilula-poeta\">Há roupas que serviram ontem<br />e hoje apertam.<br />Há pensamentos que um dia protegeram<br />e agora impedem movimento.<br />Mudar não é rejeitar quem você foi.<br />É reconhecer que crescimento<br />também exige renovação.<br />Deixe algumas culpas,<br />alguns hábitos,<br />algumas palavras antigas<br />perderem o lugar de comando.<br />Talvez a mudança comece<br />quando você percebe:<br />não precisa continuar vestindo<br />uma identidade que já não representa você.</div><hr /><p><strong>Reflexão:</strong> O que você precisa deixar para trás para viver uma nova fase?</p><p><strong>Chamada para ação:</strong> Leia, reflita e compartilhe com alguém que precisa desta palavra hoje.</p>",
    "tags": [
      "Pílula do Poeta",
      "Evaldo Poeta",
      "reflexão",
      "autoconhecimento",
      "fé",
      "vida",
      "comportamento"
    ],
    "scope": "national",
    "language": "pt-BR",
    "featured": false,
    "sourceUrl": null,
    "sourceName": null
  },
  {
    "id": "evaldo-pilula-25-conhecer-nao-basta",
    "title": "Conhecer Não Basta",
    "category": "Colunas",
    "author": "Evaldo Poeta",
    "summary": "",
    "date": "Edição 25",
    "updated": "acervo PCH News",
    "status": "draft",
    "views": 0,
    "image": "/brand/pch-news-official-20260926.svg",
    "bodyHtml": "<p class=\"article-subtitle\"></p><div class=\"pilula-poeta\">Você pode saber o que precisa fazer<br />e ainda assim continuar parado.<br />Pode conhecer o caminho,<br />ler sobre ele,<br />falar sobre ele<br />e nunca dar o primeiro passo.<br />Conhecimento sem prática<br />fica esperando na porta.<br />A mudança começa<br />quando aquilo que você entende<br />passa a aparecer nas suas escolhas.<br />Não pergunte apenas:<br />“Eu sei?”<br />Pergunte também:<br />“Eu estou fazendo?”</div><hr /><p><strong>Reflexão:</strong> Que conhecimento você já possui, mas ainda precisa transformar em atitude?</p><p><strong>Chamada para ação:</strong> Leia, reflita e compartilhe com alguém que precisa desta palavra hoje.</p>",
    "tags": [
      "Pílula do Poeta",
      "Evaldo Poeta",
      "reflexão",
      "autoconhecimento",
      "fé",
      "vida",
      "comportamento"
    ],
    "scope": "national",
    "language": "pt-BR",
    "featured": false,
    "sourceUrl": null,
    "sourceName": null
  },
  {
    "id": "evaldo-pilula-26-levante-se",
    "title": "Levante-se",
    "category": "Colunas",
    "author": "Evaldo Poeta",
    "summary": "",
    "date": "Edição 26",
    "updated": "acervo PCH News",
    "status": "draft",
    "views": 0,
    "image": "/brand/pch-news-official-20260926.svg",
    "bodyHtml": "<p class=\"article-subtitle\"></p><div class=\"pilula-poeta\">Ficar no chão por um tempo<br />pode acontecer.<br />Transformar o chão em endereço<br />é outra história.<br />A espera pode ensinar,<br />mas também pode virar hábito.<br />Há coisas que ninguém poderá fazer por você:<br />dar o primeiro passo,<br />tomar uma decisão,<br />retomar uma responsabilidade.<br />Levantar não significa<br />que tudo ficou fácil.<br />Significa que você decidiu<br />não permanecer exatamente onde caiu.<br />Hoje, comece pequeno.<br />Mas comece.</div><hr /><p><strong>Reflexão:</strong> Qual é o menor passo que você pode dar hoje para sair da paralisia?</p><p><strong>Chamada para ação:</strong> Leia, reflita e compartilhe com alguém que precisa desta palavra hoje.</p>",
    "tags": [
      "Pílula do Poeta",
      "Evaldo Poeta",
      "reflexão",
      "autoconhecimento",
      "fé",
      "vida",
      "comportamento"
    ],
    "scope": "national",
    "language": "pt-BR",
    "featured": false,
    "sourceUrl": null,
    "sourceName": null
  },
  {
    "id": "evaldo-pilula-27-vigie-o-que-voce-alimenta",
    "title": "Vigie o que Você Alimenta",
    "category": "Colunas",
    "author": "Evaldo Poeta",
    "summary": "",
    "date": "Edição 27",
    "updated": "acervo PCH News",
    "status": "draft",
    "views": 0,
    "image": "/brand/pch-news-official-20260926.svg",
    "bodyHtml": "<p class=\"article-subtitle\"></p><div class=\"pilula-poeta\">Palavras não são apenas sons.<br />Elas podem construir ambientes,<br />relações e pensamentos.<br />Por isso, vale observar<br />o que você repete,<br />o que consome,<br />o que alimenta.<br />Nem tudo que chega até você<br />merece permanecer dentro de você.<br />Vigiar não é viver com medo.<br />É escolher com consciência.<br />Cuide daquilo que você alimenta,<br />porque pensamentos repetidos<br />podem virar caminhos repetidos.</div><hr /><p><strong>Reflexão:</strong> Que palavra, conteúdo ou pensamento você precisa deixar de alimentar?</p><p><strong>Chamada para ação:</strong> Leia, reflita e compartilhe com alguém que precisa desta palavra hoje.</p>",
    "tags": [
      "Pílula do Poeta",
      "Evaldo Poeta",
      "reflexão",
      "autoconhecimento",
      "fé",
      "vida",
      "comportamento"
    ],
    "scope": "national",
    "language": "pt-BR",
    "featured": false,
    "sourceUrl": null,
    "sourceName": null
  },
  {
    "id": "evaldo-pilula-28-proteja-sua-mente",
    "title": "Proteja Sua Mente",
    "category": "Colunas",
    "author": "Evaldo Poeta",
    "summary": "",
    "date": "Edição 28",
    "updated": "acervo PCH News",
    "status": "draft",
    "views": 0,
    "image": "/brand/pch-news-official-20260926.svg",
    "bodyHtml": "<p class=\"article-subtitle\"></p><div class=\"pilula-poeta\">A mente precisa de cuidado.<br />Assim como uma casa,<br />ela também recebe visitas.<br />Algumas ideias entram<br />e trazem clareza.<br />Outras chegam<br />e deixam confusão.<br />Proteger a mente<br />não significa fugir da realidade.<br />Significa escolher<br />o que merece confiança,<br />o que precisa ser questionado<br />e o que deve ser deixado passar.<br />Cuide daquilo que ocupa<br />o espaço mais íntimo de você:<br />seus pensamentos.</div><hr /><p><strong>Reflexão:</strong> O que você precisa proteger melhor dentro da sua mente hoje?</p><p><strong>Chamada para ação:</strong> Leia, reflita e compartilhe com alguém que precisa desta palavra hoje.</p>",
    "tags": [
      "Pílula do Poeta",
      "Evaldo Poeta",
      "reflexão",
      "autoconhecimento",
      "fé",
      "vida",
      "comportamento"
    ],
    "scope": "national",
    "language": "pt-BR",
    "featured": false,
    "sourceUrl": null,
    "sourceName": null
  },
  {
    "id": "evaldo-pilula-29-comece-a-andar",
    "title": "Comece a Andar",
    "category": "Colunas",
    "author": "Evaldo Poeta",
    "summary": "",
    "date": "Edição 29",
    "updated": "acervo PCH News",
    "status": "draft",
    "views": 0,
    "image": "/brand/pch-news-official-20260926.svg",
    "bodyHtml": "<p class=\"article-subtitle\"></p><div class=\"pilula-poeta\">Há situações em que esperamos<br />que alguém venha nos mover.<br />Esperamos a oportunidade,<br />a aprovação,<br />a condição ideal.<br />Mas algumas mudanças<br />começam quando assumimos<br />a parte que nos pertence.<br />Você não controla tudo.<br />Mas pode escolher sua próxima atitude.<br />Talvez a pergunta não seja<br />“Quem vai me tirar daqui?”<br />Talvez seja:<br />“Qual é o passo que está nas minhas mãos?”<br />Comece com o que você pode.<br />O caminho pode aparecer depois.</div><hr /><p><strong>Reflexão:</strong> Qual responsabilidade está nas suas mãos hoje?</p><p><strong>Chamada para ação:</strong> Leia, reflita e compartilhe com alguém que precisa desta palavra hoje.</p>",
    "tags": [
      "Pílula do Poeta",
      "Evaldo Poeta",
      "reflexão",
      "autoconhecimento",
      "fé",
      "vida",
      "comportamento"
    ],
    "scope": "national",
    "language": "pt-BR",
    "featured": false,
    "sourceUrl": null,
    "sourceName": null
  },
  {
    "id": "evaldo-pilula-30-acalme-o-mar-interior",
    "title": "Acalme o Mar Interior",
    "category": "Colunas",
    "author": "Evaldo Poeta",
    "summary": "Nem toda tempestade pode ser evitada. Mas podemos aprender a atravessá-la sem entregar o comando ao medo.",
    "date": "Edição 30",
    "updated": "acervo PCH News",
    "status": "draft",
    "views": 0,
    "image": "/brand/pch-news-official-20260926.svg",
    "bodyHtml": "<p class=\"article-subtitle\">Nem toda tempestade pode ser evitada. Mas podemos aprender a atravessá-la sem entregar o comando ao medo.</p><div class=\"pilula-poeta\">O vento pode soprar forte.<br />O barco pode balançar.<br />E ainda assim,<br />a história não terminou.<br />Há dias em que o coração<br />parece navegar sem direção.<br />A preocupação faz ondas<br />antes mesmo de a realidade chegar.<br />A fé não promete ausência de tempestades.<br />Ela pode oferecer uma âncora<br />para atravessá-las.<br />Respire.<br />Olhe novamente.<br />Faça o que está ao seu alcance<br />e entregue a Deus aquilo que você não controla.<br />Nem todo mar calmo é sinal de paz.<br />Às vezes, paz é continuar firme<br />mesmo quando o mar se move.</div><hr /><p><strong>Reflexão:</strong> O que hoje está fora do seu controle e precisa ser entregue, em vez de carregado sozinho?</p><p><strong>Chamada para ação:</strong> Leia, reflita e compartilhe com alguém que precisa desta palavra hoje.</p>",
    "tags": [
      "Pílula do Poeta",
      "Evaldo Poeta",
      "reflexão",
      "autoconhecimento",
      "fé",
      "vida",
      "comportamento"
    ],
    "scope": "national",
    "language": "pt-BR",
    "featured": false,
    "sourceUrl": null,
    "sourceName": null
  },
  {
    "id": "evaldo-a-porta-live",
    "title": "A Porta",
    "category": "Colunas",
    "author": "Evaldo Poeta",
    "summary": "Às vezes, o caminho não está fechado. Só estamos esperando coragem para entrar.",
    "date": "17/09/2026",
    "updated": "PCH News",
    "status": "published",
    "views": 0,
    "image": "/brand/pch-news-official-20260926.svg",
    "bodyHtml": "<p class=\"article-subtitle\">Às vezes, o caminho não está fechado. Só estamos esperando coragem para entrar.</p><div class=\"pilula-poeta\">Tem porta que a vida fecha.<br /><br />Tem porta que o medo tranca.<br /><br />E tem porta que continua aberta...<br />mas a gente não entra.<br /><br />A gente espera o momento certo,<br />a coragem certa,<br />a certeza certa.<br /><br />Esperamos tanto pela certeza<br />que esquecemos de dar o primeiro passo.<br /><br />Mas talvez a vida não esteja pedindo certeza.<br />Talvez esteja pedindo movimento.<br /><br />Porque, às vezes,<br />o caminho não aparece depois que você decide.<br />Ele aparece quando você começa.<br /><br />Talvez aquela porta ainda esteja aberta.<br />Talvez você só esteja esperando alguém empurrá-la.<br /><br />Mas algumas portas da vida<br />só se abrem por dentro.<br /><br />Pílula do Poeta.<br /><br />Uma palavra pode mudar o pensamento.<br />Um pensamento pode mudar uma escolha.<br />E uma escolha pode mudar o caminho.<br /><br />E você?<br /><br />Qual porta da sua vida continua aberta,<br />mas você ainda não teve coragem de atravessar?</div>",
    "tags": [
      "Pílula do Poeta",
      "Evaldo Poeta",
      "reflexão",
      "comportamento"
    ],
    "scope": "national",
    "language": "pt-BR",
    "featured": true,
    "sourceUrl": "https://pchnews.hostingpress.com.br/materia/a-porta-2",
    "sourceName": "PCH News / HostingPRESS"
  }
];

export function readStoredArticles(): NewsArticle[] {
  if (typeof window === "undefined") return INITIAL_ARTICLES;
  try {
    const storedVersion = window.localStorage.getItem("pch-news-seed-version");
    if (storedVersion !== NEWS_SEED_VERSION) {
      window.localStorage.setItem(NEWS_STORAGE_KEY, JSON.stringify(INITIAL_ARTICLES));
      window.localStorage.setItem("pch-news-seed-version", NEWS_SEED_VERSION);
      return INITIAL_ARTICLES;
    }
    const stored = window.localStorage.getItem(NEWS_STORAGE_KEY);
    if (!stored) return INITIAL_ARTICLES;
    const parsed = JSON.parse(stored) as NewsArticle[];
    return Array.isArray(parsed) && parsed.length > 0
      ? parsed.map((article) => ({
          ...article,
          bodyHtml: article.bodyHtml || `<p>${article.summary}</p>`,
          tags: article.tags || [],
          scope: article.scope || "national",
          language: article.language || "pt-BR",
        }))
      : INITIAL_ARTICLES;
  } catch {
    return INITIAL_ARTICLES;
  }
}

export function persistArticles(articles: NewsArticle[]) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(NEWS_STORAGE_KEY, JSON.stringify(articles));
    window.dispatchEvent(new CustomEvent("pch-news-data-changed"));
  }
}

export function makeArticleId() {
  return `article-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export const statusLabels: Record<ArticleStatus, string> = {
  published: "Publicado",
  draft: "Rascunho",
  review: "Em revisão",
  scheduled: "Agendado",
  revised: "Revisada",
  approved: "Aprovada",
  updated: "Atualizada",
  archived: "Arquivada",
};

export function readStoredMedia(): MediaAsset[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = window.localStorage.getItem(MEDIA_STORAGE_KEY);
    return stored ? (JSON.parse(stored) as MediaAsset[]) : [];
  } catch {
    return [];
  }
}

export function persistMedia(media: MediaAsset[]) {
  if (typeof window !== "undefined") window.localStorage.setItem(MEDIA_STORAGE_KEY, JSON.stringify(media));
}
