import { Link } from "wouter";
import type { ReactNode } from "react";
import PageMeta from "@/components/PageMeta";
import PublicFooter from "@/components/PublicFooter";
import { ShieldCheck, FileText, Cookie, ArrowRight } from "lucide-react";

type LegalKind = "privacy" | "terms" | "cookies";

const content = {
  privacy: {
    title: "Política de Privacidade",
    kicker: "PROTEÇÃO DE DADOS",
    description: "Como o PCH News trata dados pessoais em seu site e serviços digitais.",
  },
  terms: {
    title: "Termos de Uso",
    kicker: "REGRAS DE UTILIZAÇÃO",
    description: "Regras para utilização do PCH News, conteúdo editorial, colunistas, parceiros e publicidade.",
  },
  cookies: {
    title: "Política de Cookies",
    kicker: "COOKIES E TECNOLOGIAS",
    description: "Como o PCH News utiliza cookies e tecnologias semelhantes.",
  },
} as const;

function Shell({ kind, children }: { kind: LegalKind; children: ReactNode }) {
  const meta = content[kind];
  return <div className="site-shell public-module-page"><PageMeta title={`${meta.title} — PCH News`} description={meta.description} canonicalPath={kind === "privacy" ? "/privacidade" : kind === "terms" ? "/termos" : "/cookies"} /><header className="public-module-hero"><div className="container"><span className="eyebrow">{meta.kicker}</span><h1>{meta.title}</h1><p>{meta.description}</p></div></header><main className="container legal-layout">{children}</main><PublicFooter /></div>;
}

export function PrivacyPage() {
  return <Shell kind="privacy"><article className="legal-document">
    <p className="legal-updated">Versão operacional · setembro de 2026</p>
    <h2>1. Quem trata seus dados</h2>
    <p>O PCH News atua como responsável pelas decisões sobre o tratamento de dados realizado em seus próprios canais digitais. O canal de privacidade para solicitações dos titulares é <a href="mailto:pchnews.oficial@gmail.com">pchnews.oficial@gmail.com</a>.</p>
    <p>Quando serviços de terceiros são utilizados para hospedar, autenticar, medir desempenho ou processar informações em nome do PCH News, esses fornecedores podem atuar como operadores ou outros agentes de tratamento, conforme o serviço e a relação contratual aplicável.</p>
    <h2>2. Quais dados podemos tratar</h2>
    <ul><li>Dados de contato enviados voluntariamente em formulários, como nome, e-mail, telefone, cidade e dados comerciais.</li><li>Dados necessários à autenticação de contas editoriais.</li><li>Dados técnicos e de segurança necessários ao funcionamento, prevenção de abuso e diagnóstico.</li><li>Dados de navegação e desempenho somente conforme as preferências de privacidade escolhidas para tecnologias não necessárias.</li><li>Localização do dispositivo somente quando o visitante autorizar o recurso de geolocalização do navegador; atualmente ela é utilizada para oferecer clima/localização contextual.</li></ul>
    <h2>3. Finalidades e bases legais</h2>
    <p>As finalidades podem incluir prestação do serviço, segurança, atendimento de solicitações, gestão editorial, recebimento de propostas comerciais, cumprimento de obrigações legais e melhoria de desempenho. A base legal depende da finalidade e pode incluir execução de contrato, cumprimento de obrigação legal, exercício regular de direitos, legítimo interesse ou consentimento, quando aplicável.</p>
    <h2>4. Compartilhamento e retenção</h2>
    <p>O PCH News não comercializa dados pessoais como produto. Informações podem ser compartilhadas com fornecedores necessários à operação, autoridades quando houver obrigação legal e terceiros diretamente envolvidos em uma funcionalidade solicitada pelo titular. Os dados são mantidos pelo período necessário à finalidade, às obrigações legais e à defesa de direitos, aplicando-se critérios de minimização e segurança.</p>
    <h2>5. Direitos do titular</h2>
    <p>Você pode solicitar confirmação da existência de tratamento, acesso, correção, informações sobre compartilhamento e finalidade, eliminação quando cabível, portabilidade nos casos previstos, revogação de consentimento e outros direitos previstos na LGPD. Pedidos podem ser enviados para <a href="mailto:pchnews.oficial@gmail.com">pchnews.oficial@gmail.com</a>.</p>
    <h2>6. Segurança</h2>
    <p>Adotamos medidas técnicas e administrativas compatíveis com a natureza dos dados e os riscos da operação, incluindo controle de acesso, autenticação, separação de dados públicos e privados e uso de serviços de infraestrutura apropriados.</p>
    <h2>7. Crianças e adolescentes</h2>
    <p>O PCH News não solicita deliberadamente dados de crianças para fins incompatíveis com a legislação. Caso identifique tratamento indevido, entre em contato pelo canal de privacidade.</p>
    <h2>8. Atualizações</h2>
    <p>Esta política pode ser atualizada para refletir mudanças no site, na legislação ou nas práticas de tratamento. A data da versão será atualizada quando houver alteração relevante.</p>
    <div className="legal-note"><strong>Importante:</strong> esta é uma política operacional inicial do produto e deve ser revisada pelo responsável jurídico do PCH News antes de ser adotada como documento jurídico definitivo.</div>
  </article></Shell>;
}

export function TermsPage() {
  return <Shell kind="terms"><article className="legal-document">
    <p className="legal-updated">Versão operacional · setembro de 2026</p>
    <h2>1. Sobre o PCH News</h2>
    <p>O PCH News é uma publicação digital que reúne notícias, colunas, materiais de parceiros e espaços publicitários. O site distingue, sempre que aplicável, conteúdo editorial, opinião, conteúdo de colaborador e publicidade.</p>
    <h2>2. Conteúdo editorial e colunistas</h2>
    <p>Conteúdos assinados por colunistas e colaboradores são identificados como tais. O autor é responsável pelo material que fornece ao PCH News, incluindo exatidão das informações, direitos autorais, direitos de imagem e autorizações necessárias. O PCH News mantém responsabilidade editorial própria sobre a publicação, revisão, contextualização, correções e decisões de retirar ou atualizar conteúdo; a declaração do colunista não transfere nem elimina responsabilidades legais do PCH News.</p>
    <h2>3. Publicidade e conteúdo de marca</h2>
    <p>Anúncios são identificados como <strong>PUBLICIDADE</strong> ou outra identificação equivalente. Conteúdo patrocinado ou de marca deve ser distinguido do jornalismo editorial e seguir as regras comerciais e legais aplicáveis. O anunciante responde pelas informações, marcas, imagens, links e autorizações do material que fornece.</p>
    <h2>4. Parceiros e fontes externas</h2>
    <p>Parceiros podem manter sites, bases e políticas editoriais próprias. Quando um conteúdo externo for usado como fonte ou distribuição parceira, o PCH News deve identificar sua origem quando isso for relevante ao leitor e não apresentar material de terceiros como produção própria.</p>
    <h2>5. Uso aceitável</h2>
    <p>É proibido utilizar o site para fraude, invasão, distribuição de código malicioso, violação de direitos de terceiros, envio abusivo de dados, falsificação de identidade ou qualquer atividade ilícita.</p>
    <h2>6. Correções e remoções</h2>
    <p>O PCH News poderá corrigir, atualizar, contextualizar, suspender ou retirar conteúdos quando identificar erro, risco jurídico, violação de direitos, quebra das regras editoriais ou outra razão legítima. Solicitações devem ser encaminhadas pelos canais disponíveis no site.</p>
    <h2>7. Privacidade</h2>
    <p>O tratamento de dados pessoais é regulado pela <Link href="/privacidade">Política de Privacidade</Link> e pela <Link href="/cookies">Política de Cookies</Link>.</p>
    <h2>8. Vigência</h2>
    <p>Estes termos podem ser atualizados conforme a evolução do produto e das obrigações legais.</p>
    <div className="legal-note"><strong>Revisão jurídica:</strong> este documento é uma base operacional para o produto e deve ser revisado juridicamente antes da publicação definitiva.</div>
  </article></Shell>;
}

export function CookiesPage() {
  return <Shell kind="cookies"><article className="legal-document">
    <p className="legal-updated">Versão operacional · setembro de 2026</p>
    <h2>1. O que são cookies</h2>
    <p>Cookies e tecnologias semelhantes permitem guardar ou acessar informações no dispositivo do visitante. Nem toda tecnologia usada no site é um cookie, mas as regras de preferência se aplicam às tecnologias de rastreamento não necessárias de forma equivalente.</p>
    <h2>2. Categorias</h2>
    <ul><li><strong>Necessários:</strong> essenciais para segurança, autenticação, sessão e funcionamento básico. Não dependem de consentimento quando forem estritamente necessários.</li><li><strong>Preferências:</strong> guardam escolhas como idioma ou preferências do site quando essa funcionalidade existir.</li><li><strong>Analytics/desempenho:</strong> usados para compreender navegação e melhorar o produto. O PCH News usa Microsoft Clarity somente conforme a escolha de analytics do visitante.</li><li><strong>Publicidade:</strong> destinados a medição, personalização ou retargeting de publicidade. Não ativamos tecnologias dessa categoria por padrão.</li></ul>
    <h2>3. Suas escolhas</h2>
    <p>Na primeira visita, o visitante pode aceitar, recusar ou configurar categorias não necessárias. A escolha pode ser alterada pelo botão <strong>Preferências de privacidade</strong> no rodapé.</p>
    <h2>4. Microsoft Clarity</h2>
    <p>Quando analytics for autorizado, o PCH News pode usar o Microsoft Clarity para análise de experiência e desempenho. A integração aplica sinal de consentimento às categorias de analytics e publicidade conforme a escolha do visitante.</p>
    <h2>5. Revogação</h2>
    <p>O consentimento pode ser alterado a qualquer momento pelo painel de preferências. Tecnologias estritamente necessárias continuam ativas quando indispensáveis ao funcionamento do site.</p>
    <div className="legal-note"><strong>Importante:</strong> esta política deve ser atualizada sempre que novas ferramentas de analytics, publicidade, vídeos, mapas ou outros terceiros forem adicionados ao site.</div>
  </article></Shell>;
}

export function PartnersPage() {
  return <div className="site-shell public-module-page"><PageMeta title="Parceiros — PCH News" description="Rede de parceiros e conexões editoriais do PCH News." canonicalPath="/parceiros" /><header className="public-module-hero"><div className="container"><span className="eyebrow">REDE PCH NEWS</span><h1>Parceiros.</h1><p>Distribuição, tecnologia e conexões editoriais com identificação clara.</p></div></header><main className="container partners-page-grid"><section className="partner-feature"><span className="eyebrow">PARCERIA ATUAL</span><h2>HostingPRESS</h2><p>Portal de origem e infraestrutura parceira já referenciado no acervo do PCH News. Conteúdos provenientes dessa origem são tratados como material de fonte/parceria e devem manter sua identificação editorial.</p><a href="https://pchnews.hostingpress.com.br" target="_blank" rel="noreferrer">Visitar origem <ArrowRight size={15} /></a></section><section className="partner-feature partner-feature-empty"><span className="eyebrow">NOVAS CONEXÕES</span><h2>Seja parceiro.</h2><p>Espaço preparado para futuras parcerias institucionais, tecnológicas, de distribuição ou conteúdo, sempre com identificação pública e critérios editoriais.</p><Link href="/anuncie">Falar com o PCH News <ArrowRight size={15} /></Link></section></main><PublicFooter /></div>;
}
