'use client';

import { type ReactNode } from 'react';
import Link from 'next/link';
import { Download } from 'lucide-react';
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['600', '700', '800'] });
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

/* -------------------------------------------------------------------------
 * SagaTurismo — Política de Privacidade
 * Secretaria Municipal de Turismo de São Geraldo do Araguaia (SEMTUR / SGA-PA)
 * Fundamentada na Lei nº 13.709/2018 (LGPD)
 * ---------------------------------------------------------------------- */

const TOC = [
  { id: 'introducao', label: '1. Introdução e compromisso' },
  { id: 'controlador', label: '2. Controlador dos dados' },
  { id: 'dados-coletados', label: '3. Dados coletados' },
  { id: 'finalidade', label: '4. Finalidade do tratamento' },
  { id: 'ia', label: '5. Como a IA processa documentos' },
  { id: 'base-legal', label: '6. Base legal' },
  { id: 'seguranca', label: '7. Armazenamento e segurança' },
  { id: 'compartilhamento', label: '8. Compartilhamento' },
  { id: 'retencao', label: '9. Prazo de retenção' },
  { id: 'direitos', label: '10. Direitos do titular' },
  { id: 'exercicio', label: '11. Exercício de direitos' },
  { id: 'cookies', label: '12. Cookies' },
  { id: 'alteracoes', label: '13. Alterações da Política' },
  { id: 'contato', label: '14. Contato e ANPD' },
];

export default function PoliticaDePrivacidadePage() {
  return (
    <div className={`${inter.className} flex min-h-screen flex-col bg-[#FDFCF7] text-slate-800`}>

      <main className="flex-1 pt-28 md:pt-36">
        <div className="mx-auto max-w-6xl px-6 py-8 md:py-12">
          {/* Cabeçalho da página */}
          <div className="mb-10 flex flex-col gap-6 border-b border-slate-200 pb-8 sm:flex-row sm:items-end sm:justify-between print:hidden">
            <div>
              <h1 className={`${jakarta.className} text-4xl font-black tracking-tight text-[#00577C] md:text-5xl`}>
                Política de Privacidade
              </h1>
              <p className="mt-4 text-sm text-slate-500 font-medium">
                Plataforma SagaTurismo · Última atualização: 01 de Outubro de 2026 · Versão 1.1
              </p>
            </div>

            <button
              onClick={() => window.print()}
              className={`${jakarta.className} inline-flex items-center justify-center gap-2 rounded-full bg-[#00577C] px-6 py-3.5 text-xs uppercase tracking-widest font-black text-white shadow-lg shadow-[#00577C]/20 transition hover:bg-[#004a6b] hover:-translate-y-0.5`}
            >
              <Download className="h-4 w-4" />
              Baixar PDF
            </button>
          </div>

          <div className="lg:grid lg:grid-cols-[1fr_260px] lg:items-start lg:gap-12">
            {/* Conteúdo */}
            <article className="min-w-0 divide-y divide-slate-200">
              <Section id="introducao" number="1" title="Introdução e compromisso com a LGPD">
                <P>
                  Esta Política de Privacidade descreve como a Secretaria Municipal de Turismo de São
                  Geraldo do Araguaia (&quot;SEMTUR&quot;, &quot;Secretaria&quot;, &quot;nós&quot;)
                  coleta, utiliza, armazena e protege os dados pessoais dos usuários
                  (&quot;titular&quot;, &quot;você&quot;) da plataforma SagaTurismo, em conformidade com
                  a Lei nº 13.709/2018 — Lei Geral de Proteção de Dados Pessoais (&quot;LGPD&quot;).
                </P>
                <P>
                  Ao utilizar a Plataforma e fornecer seus dados, você declara estar ciente das práticas
                  descritas neste documento, que deve ser lido em conjunto com os{' '}
                  <Link href="/termos" className="font-bold text-[#00577C] underline underline-offset-2">
                    Termos de Uso
                  </Link>
                  .
                </P>
              </Section>

              <Section id="controlador" number="2" title="Quem é o controlador dos dados">
                <P>
                  O controlador dos dados pessoais tratados pela Plataforma é a{' '}
                  <strong>Prefeitura Municipal de São Geraldo do Araguaia</strong>, por meio da{' '}
                  <strong>Secretaria Municipal de Turismo (SEMTUR)</strong>, pessoa jurídica de direito
                  público interno, com sede em São Geraldo do Araguaia, Estado do Pará.
                </P>
              </Section>

              <Section id="dados-coletados" number="3" title="Dados pessoais coletados">
                <P>
                  Para emissão da <strong>Carteira Digital de Residente</strong> e para o funcionamento
                  dos serviços turísticos da Plataforma, coletamos:
                </P>

                <H3>Dados cadastrais</H3>
                <Ul>
                  <Li>Nome completo;</Li>
                  <Li>CPF;</Li>
                  <Li>Data de nascimento;</Li>
                  <Li>E-mail.</Li>
                </Ul>

                <H3>Dado sensível (biométrico)</H3>
                <Ul>
                  <Li>
                    <strong>Selfie</strong> (foto do rosto), utilizada para verificação de identidade. Por
                    envolver reconhecimento facial, este dado é classificado como{' '}
                    <strong>dado pessoal sensível</strong>, nos termos do art. 5º, II, da LGPD, recebendo
                    proteção reforçada.
                  </Li>
                </Ul>

                <H3>Documentos</H3>
                <Ul>
                  <Li>
                    <strong>Comprovante de residência</strong>, utilizado exclusivamente para validar o
                    endereço declarado no cadastro e comprovar a condição de residente no município.
                  </Li>
                </Ul>

                <H3>Dados de navegação (opcionais)</H3>
                <Ul>
                  <Li>
                    Ao navegar pela Plataforma, podemos coletar dados anónimos de uso (páginas visitadas,
                    tempo de permanência, tipo de dispositivo) para fins de melhoria contínua do serviço.
                    Estes dados <strong>não identificam você pessoalmente</strong>.
                  </Li>
                </Ul>
              </Section>

              <Section id="finalidade" number="4" title="Finalidade do tratamento">
                <P>Os dados listados acima são tratados para as seguintes finalidades:</P>
                <Ul>
                  <Li>Verificar a identidade e a condição de residente do titular;</Li>
                  <Li>Emitir e manter ativa a Carteira Digital de Residente;</Li>
                  <Li>
                    Viabilizar a concessão do desconto turístico de até 50% em atrativos e
                    estabelecimentos parceiros do município (por exemplo, na Cachoeira Três Quedas);
                  </Li>
                  <Li>
                    Permitir a fiscalização do uso correto da carteira por agentes municipais e
                    estabelecimentos credenciados;
                  </Li>
                  <Li>Enviar comunicações relacionadas ao cadastro e à carteira, via e-mail;</Li>
                  <Li>
                    Divulgar eventos, roteiros e novidades turísticas de São Geraldo do Araguaia, quando
                    você autorizar expressamente a inscrição na newsletter.
                  </Li>
                </Ul>
                <P>
                  Os dados <strong>não são utilizados</strong> para fins de publicidade de terceiros ou
                  criação de perfis comerciais.
                </P>
              </Section>

              <Section id="ia" number="5" title="Como a Inteligência Artificial processa seus documentos">
                <P>
                  Este ponto é central em nossa política e merece transparência total: a selfie e o
                  comprovante de residência enviados <strong>não são analisados por nenhum ser humano</strong>.
                  Todo o processamento é automatizado, conforme o fluxo abaixo:
                </P>
                <Ul>
                  <Li>
                    <strong>Extração automática:</strong> um sistema de Inteligência Artificial lê o
                    comprovante de residência e extrai os dados necessários para confirmar o endereço;
                  </Li>
                  <Li>
                    <strong>Validação automática:</strong> a mesma tecnologia analisa a selfie para
                    confirmar que se trata de uma pessoa real e compatível com o cadastro, verificando a
                    autenticidade e a veracidade dos documentos enviados;
                  </Li>
                  <Li>
                    <strong>Exclusão imediata:</strong> concluída a análise — aprovada ou recusada — os
                    arquivos originais do comprovante de residência e da selfie enviada são{' '}
                    <strong>excluídos permanente e irreversivelmente</strong> dos servidores de
                    processamento, em questão de minutos;
                  </Li>
                  <Li>
                    <strong>Retenção mínima:</strong> somente em caso de aprovação, ficam armazenados no
                    banco de dados apenas: a fotografia de rosto aprovada (utilizada para compor
                    a carteira), o nome, o CPF e o e-mail — dados estritamente necessários para gerar a
                    carteira e permitir sua fiscalização.
                  </Li>
                </Ul>
                <P>
                  Em nenhuma etapa do processo, funcionários, estagiários, prestadores de serviço ou
                  terceiros têm acesso visual, download ou cópia dos arquivos originais enviados pelo
                  titular.
                </P>
              </Section>

              <Section id="base-legal" number="6" title="Base legal para o tratamento">
                <P>O tratamento dos dados pessoais descritos nesta Política fundamenta-se em:</P>
                <Ul>
                  <Li>
                    <strong>Consentimento do titular</strong> (art. 7º, I, e art. 11, I, da LGPD),
                    manifestado no momento do cadastro, em especial quanto ao envio da selfie e do
                    comprovante de residência;
                  </Li>
                  <Li>
                    <strong>Execução de políticas públicas</strong> (art. 7º, III, e art. 23 da LGPD),
                    considerando que a emissão da Carteira Digital de Residente e o incentivo ao turismo
                    local são políticas públicas municipais;
                  </Li>
                  <Li>
                    <strong>Legítimo interesse</strong> (art. 7º, IX, da LGPD) para o envio de
                    comunicações sobre eventos e novidades turísticas, sempre com a possibilidade de
                    cancelamento imediato.
                  </Li>
                </Ul>
              </Section>

              <Section id="seguranca" number="7" title="Armazenamento e segurança dos dados">
                <Ul>
                  <Li>
                    Os dados retidos (nome, CPF, e-mail e foto aprovada) são armazenados em infraestrutura
                    de banco de dados com criptografia em trânsito e em repouso;
                  </Li>
                  <Li>
                    O acesso ao banco de dados é restrito a processos e credenciais estritamente
                    necessários ao funcionamento da Plataforma, seguindo o princípio do menor privilégio;
                  </Li>
                  <Li>
                    Adotamos medidas técnicas e administrativas razoáveis para proteger os dados contra
                    acessos não autorizados, perda, alteração ou divulgação indevida;
                  </Li>
                  <Li>
                    Em caso de incidente de segurança que possa acarretar risco ou dano relevante aos
                    titulares, comunicaremos os afetados e a ANPD nos prazos legais.
                  </Li>
                </Ul>
              </Section>

              <Section id="compartilhamento" number="8" title="Compartilhamento de dados">
                <Ul>
                  <Li>
                    Nome, foto e status da carteira podem ser exibidos a estabelecimentos parceiros
                    credenciados e a agentes municipais, exclusivamente para validar o direito ao desconto
                    no momento do uso;
                  </Li>
                  <Li>
                    <strong>Não vendemos, alugamos ou compartilhamos</strong> seus dados pessoais com
                    terceiros para fins de marketing ou publicidade;
                  </Li>
                  <Li>
                    Poderemos compartilhar dados com autoridades públicas quando exigido por lei, ordem
                    judicial ou requisição de órgão de fiscalização competente.
                  </Li>
                </Ul>
              </Section>

              <Section id="retencao" number="9" title="Prazo de retenção">
                <Ul>
                  <Li>
                    Os arquivos originais de selfie e comprovante de residência são eliminados de forma
                    automática, em poucos minutos após a conclusão da análise pela Inteligência
                    Artificial, conforme descrito na Seção 5;
                  </Li>
                  <Li>
                    Nome, CPF, e-mail e foto aprovada são mantidos enquanto a Carteira Digital de Residente
                    estiver ativa ou até que o titular solicite sua exclusão;
                  </Li>
                  <Li>
                    Dados poderão ser mantidos por prazo adicional quando exigido para cumprimento de
                    obrigação legal ou para exercício regular de direitos em processo administrativo ou
                    judicial.
                  </Li>
                </Ul>
              </Section>

              <Section id="direitos" number="10" title="Direitos do titular">
                <P>Nos termos do art. 18 da LGPD, você tem direito a:</P>
                <Ul>
                  <Li>Confirmação da existência de tratamento de seus dados;</Li>
                  <Li>Acesso aos dados que tratamos sobre você;</Li>
                  <Li>Correção de dados incompletos, inexatos ou desatualizados;</Li>
                  <Li>
                    Anonimização, bloqueio ou eliminação de dados desnecessários, excessivos ou tratados
                    em desconformidade com a LGPD;
                  </Li>
                  <Li>
                    Portabilidade dos dados a outro fornecedor de serviço, mediante requisição expressa;
                  </Li>
                  <Li>Eliminação dos dados pessoais tratados com base no seu consentimento;</Li>
                  <Li>Informação sobre entidades com as quais compartilhamos seus dados;</Li>
                  <Li>
                    Informação sobre a possibilidade de não fornecer consentimento e sobre as
                    consequências da negativa;
                  </Li>
                  <Li>Revogação do consentimento, a qualquer momento.</Li>
                </Ul>
                <P>
                  A revogação do consentimento ou a exclusão de dados essenciais poderá implicar a
                  impossibilidade de emissão ou manutenção da Carteira Digital de Residente.
                </P>
              </Section>

              <Section id="exercicio" number="11" title="Como exercer seus direitos">
                <P>
                  Para exercer qualquer um dos direitos listados acima, entre em contato pelo canal
                  indicado na Seção 14. Sua solicitação será respondida dentro dos prazos estabelecidos
                  pela LGPD, podendo ser exigida a confirmação de identidade do solicitante por medida de
                  segurança.
                </P>
                <P>
                  Você também pode contatar a nossa equipe de suporte diretamente pela página de{' '}
                  <Link href="/suporte" className="font-bold text-[#00577C] underline underline-offset-2">
                    Suporte
                  </Link>
                  , disponível na Plataforma.
                </P>
              </Section>

              <Section id="cookies" number="12" title="Cookies">
                <P>
                  A Plataforma pode utilizar cookies e tecnologias semelhantes estritamente necessários
                  ao seu funcionamento, como manutenção de sessão de login. Não utilizamos cookies de
                  publicidade ou rastreamento por terceiros para fins comerciais.
                </P>
                <P>
                  Ao navegar pela primeira vez, você poderá aceitar ou recusar cookies não essenciais
                  através do banner de consentimento apresentado na parte inferior da página.
                </P>
              </Section>

              <Section id="alteracoes" number="13" title="Alterações desta Política">
                <P>
                  Esta Política poderá ser atualizada periodicamente para refletir melhorias na
                  Plataforma ou mudanças legais. A versão vigente estará sempre disponível nesta página,
                  com indicação da data da última atualização.
                </P>
                <P>
                  Recomendamos que você a consulte periodicamente. O uso continuado da Plataforma após
                  alterações constitui aceitação da versão atualizada.
                </P>
              </Section>

              <Section id="contato" number="14" title="Contato e Autoridade Nacional de Proteção de Dados">
                <P>
                  Em caso de dúvidas sobre esta Política ou sobre o tratamento de seus dados pessoais,
                  entre em contato com a Secretaria Municipal de Turismo de São Geraldo do Araguaia
                  pelos canais oficiais divulgados na Plataforma.
                </P>
                <P>
                  Caso não obtenha resposta satisfatória, você também pode registrar reclamação junto à
                  Autoridade Nacional de Proteção de Dados (ANPD), pelo site{' '}
                  <span className="font-bold text-[#00577C]">gov.br/anpd</span>.
                </P>
              </Section>
            </article>

            {/* Sumário lateral (desktop) */}
            <TableOfContents />
          </div>
        </div>
      </main>
    </div>
  );
}

/* --------------------------------- UI bits -------------------------------- */

function TableOfContents() {
  return (
    <aside className="hidden lg:block">
      <div className="sticky top-28 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className={`${jakarta.className} mb-3 text-xs font-black uppercase tracking-wide text-slate-400`}>
          Nesta página
        </p>
        <nav className="space-y-2.5 text-sm font-bold">
          {TOC.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className="block text-slate-600 transition hover:text-[#00577C]"
            >
              {item.label}
            </a>
          ))}
        </nav>
      </div>
    </aside>
  );
}

function Section({ id, number, title, children }: { id: string; number: string; title: string; children: ReactNode; }) {
  return (
    <section id={id} className="scroll-mt-28 py-8 first:pt-0">
      <div className="flex items-start gap-4">
        <span className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-[#00577C]/10 text-sm font-black text-[#00577C]">
          {number}
        </span>
        <div className="min-w-0 flex-1 pt-1.5">
          <h2 className={`${jakarta.className} text-xl font-black tracking-tight text-slate-900 md:text-2xl`}>
            {title}
          </h2>
          <div className="mt-4 space-y-4">{children}</div>
        </div>
      </div>
    </section>
  );
}

function H3({ children }: { children: ReactNode }) {
  return (
    <h3 className={`${jakarta.className} mt-6 text-sm font-black uppercase tracking-widest text-[#00577C]`}>
      {children}
    </h3>
  );
}

function P({ children }: { children: ReactNode }) {
  return <p className="leading-relaxed font-medium text-slate-600">{children}</p>;
}

function Ul({ children }: { children: ReactNode }) {
  return <ul className="space-y-3">{children}</ul>;
}

function Li({ children }: { children: ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="mt-2.5 h-1.5 w-1.5 flex-none rounded-full bg-[#009640]" />
      <span className="leading-relaxed font-medium text-slate-600">{children}</span>
    </li>
  );
}